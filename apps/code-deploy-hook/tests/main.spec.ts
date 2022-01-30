import { DeploymentRepository } from '@code-deploy-external-hook/deployment-repository';
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

    expect(DeploymentRepository.prototype.saveDeployment).toHaveBeenCalledTimes(
      1
    );
    expect(DeploymentRepository.prototype.saveDeployment).toHaveBeenCalledWith({
      applicationName: 'WordPress_App',
      deploymentGroupName: 'WordPress_DG',
      deploymentId: 'test-deployment-id',
      lifecycleEventHookExecutionId: 'test-lifecycle-event-hook-execution-id',
    });
  });
});
