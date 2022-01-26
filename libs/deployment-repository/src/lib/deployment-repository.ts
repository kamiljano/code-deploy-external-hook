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
    await this.db.send(
      new PutItemCommand({
        TableName: this.table,
        Item: {
          ...(this.props
            ? {
                ttl: {
                  N: String(this.props.ttl + Math.ceil(Date.now() / 1000)),
                },
                stage: {
                  S: this.props.hookType,
                },
              }
            : {}),
          id: {
            S: `${deployment.deploymentId}:${deployment.lifecycleEventHookExecutionId}`,
          },
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
