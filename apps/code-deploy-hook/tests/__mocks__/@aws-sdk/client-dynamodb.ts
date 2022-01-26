import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { afterEach, beforeEach, jest } from '@jest/globals';

export * from '@aws-sdk/client-dynamodb';

let clientSpy: any;

beforeEach(() => {
  clientSpy = jest.spyOn(DynamoDBClient.prototype, 'send');
});

afterEach(() => {
  clientSpy.mockRestore();
});
