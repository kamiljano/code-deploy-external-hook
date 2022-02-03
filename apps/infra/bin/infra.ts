#!/usr/bin/env node
import { App } from '@aws-cdk/core';
import 'source-map-support/register';
import { InfraStack } from '../lib/infra-stack';

const app = new App();
new InfraStack(app, 'InfraStack', {
  stackName: 'code-deploy-external-hook',
  description:
    'The stack contains tools allowing to verify the deployment from outside of AWS.',
  extraDescription:
    'More info on https://github.com/kamiljano/code-deploy-external-hook',
});
