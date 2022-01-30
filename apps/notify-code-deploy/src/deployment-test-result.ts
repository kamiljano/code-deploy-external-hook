export type TestResult = 'SUCCESS' | 'FAILURE';

export type DeploymentTestResult = {
  readonly [deploymentGroupName: string]: TestResult;
};
