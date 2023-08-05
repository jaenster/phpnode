import {createServer, IncomingMessage as Request, ServerResponse as Response} from 'http'
import {normalize, join} from 'node:path'
import {PHPFile} from "./php/php.file.js";
import fs from "fs";
import {PhpRequest} from "./php/php.request.js";

import * as php from './lib/php-lib.js'

globalThis.php ??= {};

type PHPStore = {
  files: Map<string, PHPFile>
  base: string,
  transpiled: string,
}

globalThis.__PHP__store = {
  files: new Map<string, PHPFile>(),
  base: '/public',
  transpiled: '/bin',
} as PHPStore;

async function newConnection(request: Request, response: Response) {
  console.log('new connection');
  console.log(request.url)
  if (!request.url.endsWith('.php') && request.url !== '/') {
    response.end();
    return;
  }

  const {base, files} = globalThis.__PHP__store as PHPStore;

  // ToDo; support rewrite rules of apache/nginx

  const normalized = normalize(request.url)
  let file = normalize(base + normalized);
  const stats = await fs.promises.stat(process.cwd() + file);
  if (stats.isDirectory) {
    file = join(file, '/index.php');
  }

  await PhpRequest.startContext(request, response, async () => {
    if (!files.get(file)) {
      // Get file
      await PHPFile.create(file);
    }

    const phpfile = files.get(file);
    const result = await phpfile.run()

    response.write(result);
    response.end();
  })
}

createServer(newConnection).listen(3000, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:3000`);
})

// Put php libs in global scope
Object.assign(globalThis, php)