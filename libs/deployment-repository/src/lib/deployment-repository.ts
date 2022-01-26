import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { Deployment } from './deployment';

interface DeploymentRepositoryProps {
  readonly ttl: number;
  readonly hookType: string;
}

export class DeploymentRepository {
  constructor(
    private readonly db: DynamoDBClient,
    private readonly table: string,
    private readonly props?: DeploymentRepositoryProps
  ) {}

  async saveDeployment(deployment: Omit<Deployment, 'id' | 'ttl' | 'stage'>) {
    if (!this.props) {
      throw new Error(
        'The additional properties have to be configured to use this method'
      );
    }
    await this.db.send(
      new PutItemCommand({
        TableName: this.table,
        Item: {
          id: {
            S: `${deployment.applicationName}:${
              deployment.deploymentGroupName
            }:${this.props!.hookType}`,
          },
          ttl: {
            N: String(this.props.ttl + Math.ceil(Date.now() / 1000)),
          },
          stage: {
            S: this.props.hookType,
          },
          deploymentGroupName: { S: deployment.deploymentGroupName },
          deploymentId: { S: deployment.deploymentId },
          lifecycleEventHookExecutionId: {
            S: deployment.lifecycleEventHookExecutionId,
          },
          applicationName: {
            S: deployment.applicationName,
          },
        },
      })
    );
  }
}
