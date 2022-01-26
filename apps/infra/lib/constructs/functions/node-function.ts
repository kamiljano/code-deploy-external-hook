import { Code, Function as LambdaFunction, Runtime } from '@aws-cdk/aws-lambda';
import { RetentionDays } from '@aws-cdk/aws-logs';
import { Construct, Duration } from '@aws-cdk/core';
import * as path from 'path';

interface NodeFunctionProps {
  readonly projectName: string;
  readonly functionName: string;
  readonly description: string;
  readonly environment?: Record<string, string>;
}

const getCode = (projectName: string): Code => {
  const lambdaPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    'dist',
    'apps',
    projectName
  );
  return Code.fromAsset(lambdaPath);
};

export default class NodeFunction extends LambdaFunction {
  constructor(scope: Construct, id: string, props: NodeFunctionProps) {
    super(scope, id, {
      handler: 'main.handle',
      runtime: Runtime.NODEJS_14_X,
      functionName: props.functionName,
      description: props.description,
      memorySize: 256,
      code: getCode(props.projectName),
      environment: props.environment,
      logRetention: RetentionDays.FIVE_DAYS,
      timeout: Duration.minutes(1),
    });
  }
}
