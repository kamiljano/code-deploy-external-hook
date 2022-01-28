import { CfnOutput, Construct, Stack, StackProps } from '@aws-cdk/core';
import Api from './constructs/api';
import DeploymentTable from './constructs/deployment-table';
import CodeDeployHook from './constructs/functions/code-deploy-hook';
import { HookInvocationPolicy } from './constructs/hook-invocation-policy';

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const deploymentTable = new DeploymentTable(this, 'DeploymentTable', {
      tableName: `${this.stackName}-deployments`,
    });

    const preTrafficHook = new CodeDeployHook(this, 'PreHook', {
      functionName: `${this.stackName}-pre-traffic-hook`,
      deploymentTable,
      lifecycleStage: 'PRE_TRAFFIC',
    });

    const postTrafficHook = new CodeDeployHook(this, 'PostHook', {
      functionName: `${this.stackName}-post-traffic-hook`,
      deploymentTable,
      lifecycleStage: 'POST_TRAFFIC',
    });

    const hookInvocationPolicy = new HookInvocationPolicy(
      this,
      'HookInvocationPolicy',
      {
        managedPolicyName: `${this.stackName}-invocation-policy`,
        postTrafficHook,
        preTrafficHook,
      }
    );

    const api = new Api(this, 'Api', {
      restApiName: this.stackName,
      deploymentTable,
    });

    new CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Url to query the deployment status',
    });

    new CfnOutput(this, 'HookInvocationRoleArn', {
      value: hookInvocationPolicy.managedPolicyArn,
      description:
        'A policy you should attach to the CodeDeploy role in order to be able to invoke the pre/post-traffic hooks',
      exportName: `${this.stackName}-invocation-policy`,
    });

    new CfnOutput(this, 'PreHookArn', {
      value: preTrafficHook.functionArn,
      description:
        'ARN of the function that CodeDeploy should invoke as a pre-traffic hook',
      exportName: `${this.stackName}-pre-traffic-function`,
    });

    new CfnOutput(this, 'PostHookArn', {
      value: postTrafficHook.functionArn,
      description:
        'ARN of the function that CodeDeploy should invoke as a post-traffic hook',
      exportName: `${this.stackName}-post-traffic-function`,
    });
  }
}
