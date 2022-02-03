#!/usr/bin/env node
import 'source-map-support/register';
import { TestInfraStack } from '../lib/test-infra-stack';
import { App } from '@aws-cdk/core';

const app = new App();
new TestInfraStack(app, 'TestInfraStack', {
  stackName: 'code-deploy-external-hook-test',
  description:
    'The stack uses CodeDeploy behind the scenes and effectively allows you to manually test if the code-deploy-hook did what it was supposed to',
});
