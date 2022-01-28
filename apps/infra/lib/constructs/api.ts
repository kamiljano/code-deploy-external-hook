import { AwsIntegration, RestApi } from '@aws-cdk/aws-apigateway';
import {
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import DeploymentTable from './deployment-table';

export interface ApiProps {
  readonly restApiName: string;
  readonly deploymentTable: DeploymentTable;
}

export default class Api extends RestApi {
  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id, {
      restApiName: props.restApiName,
      description: 'API for querying the current state of CodeDeploy hooks',
    });

    const queryDeploymentsRole = new Role(this, 'ApiRole', {
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
          ],
        }),
      },
    });

    const deploymentsPath = this.root.addResource('deployments');

    const methodOptions = {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
        { statusCode: '500' },
      ],
    };

    const hookPath = deploymentsPath
      .addResource('{applicationName}')
      .addResource('{hookType}');

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

    hookPath.addMethod(
      'POST',
      new AwsIntegration({
        action: 'BatchGetItem',
        options: {
          credentialsRole: queryDeploymentsRole,
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
      }),
      {
        ...methodOptions,
      }
    );
  }
}
