export async function __php_invoke__spl(namespace: string[]): Promise<boolean> {
  throw new Error('ToDo; implement')
}

// Functions needed to deal with php's stuff
export async function __php__use(namespaceString, context, invoke = true) {
  // Check current namespace first
  if (context) {
    const local = __php__use(context, undefined, false);
    if (local) return local;
  }
  // deal with cache
  if (__php__use[namespaceString]) return __php__use[namespaceString];

  const namespace = namespaceString.split('\\').filter(Boolean) as string[];

  // upsert the namespace object so it atleast is there
  const key = namespace.pop();
  const obj = __php__upsert__namespace(...namespace); // Last key is already gone

  if (!obj[key]) {
    // call the php native spl_autoload_register. Returns false if not succeeded
    if (invoke && !await __php_invoke__spl(namespace)) {
      throw new Error('Cant find ' + namespace.join('\\') + key)
    }
  }
  return obj[key];
}

export function __php__upsert__namespace(...namespace) {
  let obj = globalThis.php ??= {};
  // Global namespace
  if (namespace.length === 0) return obj;
  let key = namespace.shift();
  do {
    obj = obj[key] ??= {};
  } while (namespace.length)
  return obj;
}

export async function __php__namespace(namespaceString: string, key: string, cb) {
  const namespace = namespaceString.split('\\').filter(Boolean);
  const obj = __php__upsert__namespace(...namespace.slice(0, -1));

  const result = await cb(namespaceString);
  if (key) {
    obj[key] = result;
  }
  return result;
}


export function __php__print(string: string) {
  __php__current__request.out.push(string);
}

export async function __php__file(path: string, callback: () => Promise<void>) {
  __php__file[path] = callback;
  return callback;
}