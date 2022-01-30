export default class HttpError<T = object> extends Error {
  constructor(readonly status: number, readonly response?: T) {
    super(`Request failed with the status ${status}`);
  }
}
