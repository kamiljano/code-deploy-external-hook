import { AttributeType, BillingMode, Table } from '@aws-cdk/aws-dynamodb';
import { Construct, RemovalPolicy } from '@aws-cdk/core';

interface DeploymentTableProps {
  readonly tableName: string;
}

export default class DeploymentTable extends Table {
  constructor(scope: Construct, id: string, props: DeploymentTableProps) {
    super(scope, id, {
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      tableName: props.tableName,
      timeToLiveAttribute: 'ttl',
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
    });
  }
}
