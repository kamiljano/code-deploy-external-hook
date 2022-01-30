import { CodeDeployClient } from '@aws-sdk/client-codedeploy';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeploymentRepository } from '@code-deploy-external-hook/deployment-repository';
import { APIGatewayEvent } from 'aws-lambda';
import 'reflect-metadata';
import 'source-map-support/register';
import { container } from 'tsyringe';
import ExecutionContext from './execution-context';
import { TestResultEvent } from './test-result-event';

type Handler<E, R> = (event: E) => Promise<R>;

const getMandatoryEnvVar = (name: string): string => {
  const result = process.env[name];
  if (!result) {
    throw new Error(`The mandatory environment variable "${name}" is missing`);
  }
  return result;
};

let initialized = false;

const initConfig = () => {
  if (!initialized) {
    container.register(DeploymentRepository, {
      useValue: new DeploymentRepository(
        new DynamoDBClient({}),
        getMandatoryEnvVar('DEPLOYMENT_TABLE_NAME')
      ),
    });

    container.register(CodeDeployClient, {
      useValue: new CodeDeployClient({}),
    });

    initialized = true;
  }
};

export default function wrap<R>(
  handler: Handler<TestResultEvent, R>
): Handler<APIGatewayEvent, R> {
  return async (event) => {
    const ctx = container
      .resolve(ExecutionContext)
      .init(event.requestContext.requestId);

    try {
      await initConfig();

      return await handler({
        ...JSON.parse(event.body as string),
        hookType: event.pathParameters!.hookType,
        applicationName: event.pathParameters!.applicationName,
      });
    } catch (err) {
      ctx.log.error(err, 'Failed to execute the notify-code-deploy');
      throw err;
    }
  };
}
