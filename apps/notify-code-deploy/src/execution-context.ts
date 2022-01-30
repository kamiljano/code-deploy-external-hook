import pino from 'pino';
import { singleton } from 'tsyringe';

@singleton()
export default class ExecutionContext {
  private logger = pino();

  init(requestId: string): this {
    this.logger = pino().child({ requestId });
    return this;
  }

  get log(): pino.Logger {
    return this.logger;
  }
}
