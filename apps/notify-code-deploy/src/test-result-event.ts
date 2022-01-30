import { DeploymentStage } from '@code-deploy-external-hook/deployment-repository';
import { DeploymentTestResult } from './deployment-test-result';

export interface TestResultEvent {
  readonly applicationName: string;
  readonly hookType: DeploymentStage;
  readonly deploymentTests: DeploymentTestResult;
}
