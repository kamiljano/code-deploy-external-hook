import {
  AwsIntegration,
  JsonSchemaType,
  LambdaIntegration,
  MethodOptions,
  Model,
  RequestValidator,
  RestApi,
} from '@aws-cdk/aws-apigateway';
import {
  IRole,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import DeploymentTable from './deployment-table';
import NotifyCodeDeployFunction from './functions/notify-code-deploy-function';

export interface ApiProps {
  readonly restApiName: string;
  readonly deploymentTable: DeploymentTable;
}

const errorResponses = [
  {
    selectionPattern: '400',
    statusCode: '400',
    responseTemplates: {
      'application/json': `{
            "error": "Bad input!"
          }`,
    },
  },
  {
    selectionPattern: '5\\d{2}',
    statusCode: '500',
    responseTemplates: {
      'application/json': `{
            "error": "Internal Service Error!"
          }`,
    },
  },
];

export default class Api extends RestApi {
  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id, {
      restApiName: props.restApiName,
      description: 'API for querying the current state of CodeDeploy hooks',
    });

    const deploymentsPath = this.root.addResource('deployments');

    const hookPath = deploymentsPath
      .addResource('{applicationName}')
      .addResource('{hookType}');

    const deploymentGroupNamesModel = new Model(
      this,
      'DeploymentGroupNamesModel',
      {
        restApi: this,
        contentType: 'application/json',
        description: 'Model with deploymentGroupNames string array',
        modelName: 'DeploymentGroupNamesModel',
        schema: {
          type: JsonSchemaType.OBJECT,
          required: ['deploymentGroupNames'],
          properties: {
            deploymentGroupNames: {
              type: JsonSchemaType.ARRAY,
              items: {
                type: JsonSchemaType.STRING,
              },
            },
          },
        },
      }
    );

    const requestValidator = new RequestValidator(
      this,
      'DeploymentGroupNamesValidator',
      {
        restApi: this,
        requestValidatorName: 'DeploymentGroupNames',
        validateRequestBody: true,
      }
    );

    const methodOptions: MethodOptions = {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '500' },
      ],
      requestValidator,
    };

    const lambda = new NotifyCodeDeployFunction(
      this,
      'DeleteDeploymentLambda',
      {
        functionName: `${props.restApiName}-delete`,
        deploymentTable: props.deploymentTable,
      }
    );

    const apiRole = new Role(this, 'ApiRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      description:
        'Role assumed by the API Gateway to query the CodeDeploy hook data',
      roleName: props.restApiName,
      inlinePolicies: {
        QueryDynamo: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:BatchGetItem',
              ],
              resources: [props.deploymentTable.tableArn],
            }),
            new PolicyStatement({
              actions: ['lambda:InvokeFunction'],
              resources: [lambda.functionArn],
            }),
          ],
        }),
      },
    });

    hookPath.addMethod('POST', this.batchGetIntegration(props, apiRole), {
      ...methodOptions,
      requestModels: {
        'application/json': deploymentGroupNamesModel,
      },
    });

    hookPath.addMethod(
      'DELETE',
      new LambdaIntegration(lambda, {
        credentialsRole: apiRole,
      }),
      {
        ...methodOptions,
        requestModels: {
          'application/json': new Model(this, 'DeploymentTestResult', {
            restApi: this,
            contentType: 'application/json',
            description: 'Representation of which deployments passed the test',
            modelName: 'DeploymentResult',
            schema: {
              type: JsonSchemaType.OBJECT,
              required: ['deploymentTests'],
              properties: {
                deploymentTests: {
                  type: JsonSchemaType.OBJECT,
                  description:
                    'A map of deploymentGroupNames and SUCCESS/FAILURE indicating if a certain deployment passed the test or not',
                  additionalProperties: {
                    type: JsonSchemaType.STRING,
                    enum: ['SUCCESS', 'FAILURE'],
                  },
                },
              },
            },
          }),
        },
      }
    );
  }

  private batchGetIntegration(props: ApiProps, credentialsRole: IRole) {
    return new AwsIntegration({
      action: 'BatchGetItem',
      options: {
        credentialsRole,
        integrationResponses: [
          ...errorResponses,
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': `{
                   "deployments": {
                      #foreach($item in $input.path('$.Responses.${props.deploymentTable.tableName}'))
                      "$item.deploymentGroupName.S": {
                        "id": "$item.id.S",
                        "deploymentId": "$item.deploymentId.S",
                        "lifecycleEventHookExecutionId": "$item.lifecycleEventHookExecutionId.S"
                      }
                      #if($foreach.hasNext),#end
                      #end
                   }
                }`,
            },
          },
        ],
        requestTemplates: {
          'application/json': `{
              "RequestItems": {
                "${props.deploymentTable.tableName}": {
                  "Keys": [
                    #foreach($deploymentGroupName in $input.path('$.deploymentGroupNames'))

                    {"id": { "S": "$method.request.path.applicationName:$deploymentGroupName:$method.request.path.hookType" } }

                    #if($foreach.hasNext),#end
                    #end
                  ]
                }
              }
            }`,
        },
      },
      service: 'dynamodb',
    });
  }
}
