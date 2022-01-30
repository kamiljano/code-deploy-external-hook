# About

The project aims to make it simpler to execute blue-green deployments in AWS using a proper
CI/CD tool, rather than a lambda to validate the deployment.

AWS uses CodeDeploy to run the blue-green deployments. Depending on how you set up your
CI/CD, CodeDeploy may be triggered by CodeBuild, CodePipeline or CloudFormation. Now matter how it
is started however, it ends up working in pretty much the same way. In order to validate the blue-green
deployment a user may choose to set up pre-traffic and/or post-traffic hooks in their CodeDeploy deployments.
Those hooks are essentially lambdas that are responsible for running basic tests on the ongoing deployment
and send a notification back to CodeDeploy letting it know whether the tests were successful or not.
CodeDeploy will the either proceed with the follow-up deployment steps or roll-back the deployment.

The issue with this standard approach is that the user is limited to what lambda can really do.
The tests have to finish within 15 minutes (maximum lambda execution time) and there are no test reports.
There are lambda logs available, but those are less than optimal for a long chain of logs produced by tests.

Introducing code-deploy-external-hook!

![architecture](./docs/architecture.png)

The approach allows to execute the tests directly from the CI/CD machine that is running the original pipeline.

1. The pipeline keeps polling the API Gateway to see if all deployments it is interested in are in the desired state
   (like for instance until all lambdas on your CloudFormation stack are ready for the pre-traffic tests)

2. The pipeline executes the tests.

3. The pipeline sends a follow-up request to API Gateway stating whether the tests were successful or not. That
   then triggers appropriate follow-up steps in CodeDeploy

# Usage

In order to deploy, clone the project, go to its root directory and execute

```shell
$ yarn install
$ yarn build
$ yarn deploy
```
