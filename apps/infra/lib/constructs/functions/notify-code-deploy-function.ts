import { PolicyStatement } from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import DeploymentTable from '../deployment-table';
import NodeFunction from './node-function';

export interface NotifyCodeDeployFunctionProps {
  readonly functionName: string;
  readonly deploymentTable: DeploymentTable;
}

export default class NotifyCodeDeployFunction extends NodeFunction {
  constructor(
    scope: Construct,
    id: string,
    props: NotifyCodeDeployFunctionProps
  ) {
    super(scope, id, {
      projectName: 'notify-code-deploy',
      description:
        'Lambda invoked by HTTP request. It deletes the record from the deployment DynamoDB table and notifies CodeDeploy about the finished tests',
      functionName: props.functionName,
      environment: {
        DEPLOYMENT_TABLE_NAME: props.deploymentTable.tableName,
      },
    });

    props.deploymentTable.grantReadWriteData(this);
    this.role!.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ['codedeploy:PutLifecycleEventHookExecutionStatus'],
        resources: ['*'],
      })
    );
  }
}
