import { CodeDeployClient } from '@aws-sdk/client-codedeploy';
import { afterEach, beforeEach, jest } from '@jest/globals';

export * from '@aws-sdk/client-codedeploy';

let clientSpy: any;

beforeEach(() => {
  clientSpy = jest.spyOn(CodeDeployClient.prototype, 'send').mockResolvedValue({
    // @ts-ignore
    deploymentInfo: {
      applicationName: 'WordPress_App',
      status: 'Succeeded',
      deploymentOverview: {
        Failed: 0,
        InProgress: 0,
        Skipped: 0,
        Succeeded: 1,
        Pending: 0,
      },
      deploymentConfigName: 'CodeDeployDefault.OneAtATime',
      creator: 'user',
      description: 'My WordPress app deployment',
      revision: {
        revisionType: 'S3',
        s3Location: {
          bundleType: 'zip',
          eTag: '"dd56cfdEXAMPLE8e768f9d77fEXAMPLE"',
          bucket: 'CodeDeployDemoBucket',
          key: 'WordPressApp.zip',
        },
      },
      deploymentId: 'd-A1B2C3123',
      deploymentGroupName: 'WordPress_DG',
      createTime: 1409764576.589,
      completeTime: 1409764596.101,
      ignoreApplicationStopFailures: false,
    } as any,
  });
});

afterEach(() => {
  clientSpy.mockRestore();
});
