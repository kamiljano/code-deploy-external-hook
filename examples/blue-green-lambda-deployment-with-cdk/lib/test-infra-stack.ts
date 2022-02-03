import {
  LambdaApplication,
  LambdaDeploymentGroup,
} from '@aws-cdk/aws-codedeploy';
import { LambdaDeploymentConfig } from '@aws-cdk/aws-codedeploy/lib/lambda/deployment-config';
import { ManagedPolicy, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import {
  Alias,
  Code,
  Function as LambdaFunction,
  Runtime,
} from '@aws-cdk/aws-lambda';
import { Construct, Fn, Stack, StackProps } from '@aws-cdk/core';

export class TestInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const fun = new LambdaFunction(this, 'TestLambda', {
      runtime: Runtime.NODEJS_14_X,
      functionName: `${this.stackName}-test`,
      handler: 'index.handle',
      code: Code.fromInline(
        `module.exports.handle = () => { console.log('${new Date().toISOString()}') }`
      ),
      environment: {
        // this is to enforce triggering of CodeDeploy every time
        DEPLOYMENT_TIME: new Date().toISOString(),
      },
    });

    const alias = new Alias(this, 'TestLambdaAlias', {
      aliasName: 'test',
      version: fun.currentVersion,
    });

    const app = new LambdaApplication(this, 'TestLambdaApplication', {
      applicationName: `${this.stackName}-test`,
    });

    new LambdaDeploymentGroup(this, 'TestDeploymentGroup', {
      deploymentGroupName: `${this.stackName}-test`,
      application: app,
      alias,
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
      },
      deploymentConfig: LambdaDeploymentConfig.ALL_AT_ONCE,
      preHook: LambdaFunction.fromFunctionArn(
        this,
        'PreHook',
        Fn.importValue('code-deploy-external-hook-pre-traffic-function')
      ),
      postHook: LambdaFunction.fromFunctionArn(
        this,
        'PostHook',
        Fn.importValue('code-deploy-external-hook-post-traffic-function')
      ),
      role: new Role(this, 'CodeDeployRole', {
        roleName: this.stackName,
        description:
          'CodeDeploy role allowing to test the pre/post-traffic hooks',
        assumedBy: new ServicePrincipal('codedeploy.amazonaws.com'),
        managedPolicies: [
          ManagedPolicy.fromManagedPolicyArn(
            this,
            'CodeDeployInvokeHookPolicy',
            Fn.importValue('code-deploy-external-hook-invocation-policy')
          ),
        ],
      }),
    });
  }
}
