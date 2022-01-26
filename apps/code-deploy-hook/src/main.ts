import { DeploymentRepository } from '@code-deploy-external-hook/deployment-repository';
import 'reflect-metadata';
import 'source-map-support/register';
import { container } from 'tsyringe';
import { CodeDeployHookEvent } from './code-deploy-hook-event';
import CodeDeployService from './code-deploy-service';
import wrap from './wrap';

export const handle = wrap(async (event: CodeDeployHookEvent) => {
  const deployment = await container
    .resolve(CodeDeployService)
    .getDeployment(event.DeploymentId);

  await container.resolve(DeploymentRepository).saveDeployment({
    deploymentId: event.DeploymentId,
    lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
    applicationName: deployment.applicationName as string,
    deploymentGroupName: deployment.deploymentGroupName as string,
  });
});
