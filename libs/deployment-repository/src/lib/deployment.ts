export type DeploymentStage = 'PRE_TRAFFIC' | 'POST_TRAFFIC';

export interface Deployment {
  id: string;
  ttl: number;
  deploymentId: string;
  lifecycleEventHookExecutionId: string;
  applicationName: string;
  deploymentGroupName: string;
  stage: DeploymentStage;
}
