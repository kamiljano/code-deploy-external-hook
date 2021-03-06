import { Table } from '@aws-cdk/aws-dynamodb';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import NodeFunction from './node-function';

export interface CodeDeployHookProps {
  readonly functionName: string;
  readonly deploymentTable: Table;
  readonly lifecycleStage: 'PRE_TRAFFIC' | 'POST_TRAFFIC';
  readonly extraDescription: string;
}

export default class CodeDeployHook extends NodeFunction {
  constructor(scope: Construct, id: string, props: CodeDeployHookProps) {
    super(scope, id, {
      projectName: 'code-deploy-hook',
      description: `Lambda that is triggered as a CodeDeploy hook. ${props.extraDescription}`,
      functionName: props.functionName,
      environment: {
        DEPLOYMENT_TABLE_NAME: props.deploymentTable.tableName,
        DEPLOYMENT_TABLE_TTL: String(60 * 60 * 12), // 12 hours
        LIFECYCLE_STAGE: props.lifecycleStage,
      },
    });

    props.deploymentTable.grantReadWriteData(this);
    this.role!.addToPrincipalPolicy(
      new PolicyStatement({
        sid: 'AllowReadForCodeDeploy',
        effect: Effect.ALLOW,
        actions: ['codedeploy:GetDeployment'],
        resources: ['*'],
      })
    );
  }
}
