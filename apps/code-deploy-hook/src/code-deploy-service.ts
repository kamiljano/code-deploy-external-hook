import {
  CodeDeployClient,
  DeploymentInfo,
  GetDeploymentCommand,
} from '@aws-sdk/client-codedeploy';
import { singleton } from 'tsyringe';
import ExecutionContext from './execution-context';

@singleton()
export default class CodeDeployService {
  constructor(
    private readonly client: CodeDeployClient,
    private readonly ctx: ExecutionContext
  ) {}

  async getDeployment(deploymentId: string): Promise<DeploymentInfo> {
    const result = await this.client.send(
      new GetDeploymentCommand({ deploymentId })
    );
    if (!result.deploymentInfo) {
      throw new Error(`Unable to find the deployment with id ${deploymentId}`);
    }
    this.ctx.log.info(
      { deployment: result.deploymentInfo },
      `Acquired the deployment data for id: ${deploymentId}`
    );
    return result.deploymentInfo as DeploymentInfo;
  }
}
