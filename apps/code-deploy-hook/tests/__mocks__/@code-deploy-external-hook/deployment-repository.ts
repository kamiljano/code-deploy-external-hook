import { DeploymentRepository } from '@code-deploy-external-hook/deployment-repository';
import { afterEach, beforeEach, jest } from '@jest/globals';

export * from '@code-deploy-external-hook/deployment-repository';

let clientSpy: any;

beforeEach(() => {
  clientSpy = jest
    .spyOn(DeploymentRepository.prototype, 'saveDeployment')
    .mockReturnValue(Promise.resolve());
});

afterEach(() => {
  clientSpy.mockRestore();
});
