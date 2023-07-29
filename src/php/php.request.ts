import {AsyncLocalStorage} from 'node:async_hooks'
import {IncomingMessage as Request, ServerResponse as Response} from 'http'

declare global {
  const __php__current__request: PhpRequest
}

const storage = new AsyncLocalStorage<PhpRequest>();

export class PhpRequest {
  request: Request;
  response: Response;

  out: string[] = [];

  flush() {
    return this.out.splice(0, this.out.length).join('');
  }

  static startContext(request: Request, response: Response, cb: ()=>Promise<void>) {
    const context = new this();
    context.request = request;
    context.response = response;

    return storage.run(context, () => cb());
  }
}

Object.defineProperty(globalThis, '__php__current__request', {
  get() {
    return storage.getStore();
  }
})