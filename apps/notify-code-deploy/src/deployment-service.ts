import {
  CodeDeployClient,
  LifecycleEventStatus,
  PutLifecycleEventHookExecutionStatusCommand,
} from '@aws-sdk/client-codedeploy';
import {
  Deployment,
  DeploymentRepository,
  DeploymentStage,
} from '@code-deploy-external-hook/deployment-repository';
import { singleton } from 'tsyringe';
import { DeploymentTestResult } from './deployment-test-result';
import ExecutionContext from './execution-context';
import HttpError from './http-error';

@singleton()
export default class DeploymentService {
  constructor(
    private readonly repo: DeploymentRepository,
    private readonly codeDeploy: CodeDeployClient,
    private readonly ctx: ExecutionContext
  ) {}

  private notifyCodeDeploy(
    deploymentId: string,
    lifecycleEventHookExecutionId: string,
    status: LifecycleEventStatus
  ) {
    return this.codeDeploy.send(
      new PutLifecycleEventHookExecutionStatusCommand({
        deploymentId,
        lifecycleEventHookExecutionId,
        status,
      })
    );
  }

  private async getDeploymentsAsMap(
    applicationName: string,
    hookType: DeploymentStage,
    deploymentGroupNames: string[]
  ) {
    const deployments = await this.repo.getDeployments(
      applicationName,
      hookType,
      deploymentGroupNames
    );

    const map = deployments.reduce((acc, deployment) => {
      acc[deployment.deploymentGroupName] = deployment;
      return acc;
    }, {} as { [deploymentGroupName: string]: Deployment });

    if (deploymentGroupNames.length != deployments.length) {
      throw new HttpError(400, {
        requested: {
          applicationName,
          hookType,
          deploymentGroupNames,
        },
        found: {
          applicationName,
          hookType,
          deploymentGroupNames: deploymentGroupNames.filter(
            (name) => !map[name]
          ),
        },
      });
    }

    return map;
  }

  async publishTestResult(
    applicationName: string,
    hookType: DeploymentStage,
    testResults: DeploymentTestResult
  ) {
    const deployments = await this.getDeploymentsAsMap(
      applicationName,
      hookType,
      Object.keys(testResults)
    );

    this.ctx.log.info(deployments, 'Marking deployments as finished');

    await Promise.all(
      Object.entries(testResults).map(async ([deploymentGroupName, result]) => {
        const deployment = deployments[deploymentGroupName];

        await this.notifyCodeDeploy(
          deployment.deploymentId,
          deployment.lifecycleEventHookExecutionId,
          result === 'SUCCESS'
            ? LifecycleEventStatus.SUCCEEDED
            : LifecycleEventStatus.FAILED
        );
      })
    );

    await this.repo.deleteDeployments(
      applicationName,
      hookType,
      Object.keys(testResults)
    );
  }
}
