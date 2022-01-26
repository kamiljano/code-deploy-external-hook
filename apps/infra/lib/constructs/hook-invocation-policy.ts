import { ManagedPolicy, PolicyStatement } from '@aws-cdk/aws-iam';
import { IFunction } from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';

export interface HookInvocationPolicyProps {
  readonly managedPolicyName: string;
  readonly preTrafficHook: IFunction;
  readonly postTrafficHook: IFunction;
}

export class HookInvocationPolicy extends ManagedPolicy {
  constructor(scope: Construct, id: string, props: HookInvocationPolicyProps) {
    super(scope, id, {
      managedPolicyName: props.managedPolicyName,
      description:
        'A policy you should attach to the CodeDeploy role in order to be able to invoke the pre/post-traffic hooks',
      statements: [
        new PolicyStatement({
          sid: 'InvokeHooks',
          actions: ['lambda:InvokeFunction'],
          resources: [
            props.preTrafficHook.functionArn,
            props.postTrafficHook.functionArn,
          ],
        }),
      ],
    });
  }
}
