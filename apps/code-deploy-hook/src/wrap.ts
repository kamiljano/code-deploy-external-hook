import { CodeDeployClient } from '@aws-sdk/client-codedeploy';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeploymentRepository } from '@code-deploy-external-hook/deployment-repository';
import { container } from 'tsyringe';
import { CodeDeployHookEvent } from './code-deploy-hook-event';
import ExecutionContext from './execution-context';

type Handler = (event: CodeDeployHookEvent) => Promise<void>;

const getMandatoryEnvVar = (name: string): string => {
  const result = process.env[name];
  if (!result) {
    throw new Error(`The mandatory environment variable "${name}" is missing`);
  }
  return result;
};

const getMandatoryEnvVarAsInt = (name: string) => {
  const result = parseInt(getMandatoryEnvVar(name), 10);
  if (isNaN(result)) {
    throw new Error(
      `The environment variable ${name} is expected to be an integer number`
    );
  }
  return result;
};

let configInitialized = false;

const initConfig = () => {
  if (!configInitialized) {
    container.register(CodeDeployClient, {
      useValue: new CodeDeployClient({}),
    });

    container.register(DeploymentRepository, {
      useValue: new DeploymentRepository(
        new DynamoDBClient({}),
        getMandatoryEnvVar('DEPLOYMENT_TABLE_NAME'),
        {
          ttl: getMandatoryEnvVarAsInt('DEPLOYMENT_TABLE_TTL'),
          hookType: getMandatoryEnvVar('LIFECYCLE_STAGE'),
        }
      ),
    });

    configInitialized = true;
  }
};

export default function wrap(handle: Handler): Handler {
  return async (event) => {
    const ctx = container.resolve(ExecutionContext).init(event);

    try {
      initConfig();

      await handle(event);
    } catch (err) {
      ctx.log.error(err, 'Failed to execute the CodeDeployHook');
      throw err;
    }
  };
}
