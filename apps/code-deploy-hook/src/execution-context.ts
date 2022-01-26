import { singleton } from 'tsyringe';
import { CodeDeployHookEvent } from './code-deploy-hook-event';
import pino from 'pino';

@singleton()
export default class ExecutionContext {
  private logger = pino();

  init(deployment: CodeDeployHookEvent): this {
    this.logger = pino().child({ deployment });
    return this;
  }

  get log(): pino.Logger {
    return this.logger;
  }
}
