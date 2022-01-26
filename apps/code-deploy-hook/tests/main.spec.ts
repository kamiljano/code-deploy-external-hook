import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CodeDeployHookEvent } from '../src/code-deploy-hook-event';
import { handle } from '../src/main';

const event: CodeDeployHookEvent = Object.freeze({
  DeploymentId: 'test-deployment-id',
  LifecycleEventHookExecutionId: 'test-lifecycle-event-hook-execution-id',
});

describe('Given the code-deploy-hook lambda handler, When the lambda is invoked by CodeDeploy', () => {
  const now = Date.now();
  let nowSpy: jest.SpyInstance;

  beforeEach(() => {
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  test('With a pre-traffic event, Then the lambda stores that info in the DynamoDB table', async () => {
    await handle(event);

    expect(DynamoDBClient.prototype.send).toHaveBeenCalledTimes(1);
    expect(
      (DynamoDBClient.prototype.send as jest.Mock).mock.calls[0][0].input
    ).toEqual({
      TableName: process.env.DEPLOYMENT_TABLE_NAME,
      Item: {
        ttl: {
          N: String(
            Math.ceil(now / 1000) +
              parseInt(process.env.DEPLOYMENT_TABLE_TTL as string, 10)
          ),
        },
        id: {
          S: 'WordPress_App:WordPress_DG:PRE_TRAFFIC',
        },
        deploymentGroupName: { S: 'WordPress_DG' },
        deploymentId: { S: event.DeploymentId },
        lifecycleEventHookExecutionId: {
          S: event.LifecycleEventHookExecutionId,
        },
        applicationName: {
          S: 'WordPress_App',
        },
        stage: {
          S: 'PRE_TRAFFIC',
        },
      },
    });
  });
});
