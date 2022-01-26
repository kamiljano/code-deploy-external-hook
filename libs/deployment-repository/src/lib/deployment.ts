export interface Deployment {
  id: string;
  ttl: number;
  deploymentId: string;
  lifecycleEventHookExecutionId: string;
  applicationName: string;
  deploymentGroupName: string;
  stage: 'PRE_TRAFFIC' | 'POST_TRAFFIC';
}
