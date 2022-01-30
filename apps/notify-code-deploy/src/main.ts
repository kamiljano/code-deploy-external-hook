import 'reflect-metadata';
import 'source-map-support/register';
import { container } from 'tsyringe';
import DeploymentService from './deployment-service';
import HttpError from './http-error';
import wrap from './wrap';

export const handle = wrap(async (event) => {
  try {
    await container
      .resolve(DeploymentService)
      .publishTestResult(
        event.applicationName,
        event.hookType,
        event.deploymentTests
      );
  } catch (err) {
    if (err instanceof HttpError) {
      return {
        statusCode: err.status,
        body: err.response ? JSON.stringify(err.response) : undefined,
      };
    }
    throw err;
  }

  return {
    statusCode: 204,
  };
});
