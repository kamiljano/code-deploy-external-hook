import {
  BatchGetItemCommand,
  BatchWriteItemCommand,
  DynamoDBClient,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Deployment, DeploymentStage } from './deployment';

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

  async getDeployments(
    applicationName: string,
    hookType: DeploymentStage,
    deploymentGroupNames: string[]
  ): Promise<Deployment[]> {
    if (!deploymentGroupNames.length) return [];

    const result = await this.db.send(
      new BatchGetItemCommand({
        RequestItems: {
          [this.table]: {
            Keys: deploymentGroupNames.map((deploymentGroupName) => ({
              id: {
                S: `${applicationName}:${deploymentGroupName}:${hookType}`,
              },
            })),
          },
        },
      })
    );

    if (!result.Responses) return [];

    return result.Responses[this.table].map((item) =>
      unmarshall(item)
    ) as Deployment[];
  }

  async deleteDeployments(
    applicationName: string,
    hookType: DeploymentStage,
    deploymentGroupNames: string[]
  ) {
    if (!deploymentGroupNames.length) {
      return;
    }

    await this.db.send(
      new BatchWriteItemCommand({
        RequestItems: {
          [this.table]: deploymentGroupNames.map((deploymentGroupName) => ({
            DeleteRequest: {
              Key: {
                id: {
                  S: `${applicationName}:${deploymentGroupName}:${hookType}`,
                },
              },
            },
          })),
        },
      })
    );
  }
}
