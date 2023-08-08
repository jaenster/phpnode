import {PhpArray} from "./php-array.js";
import {PhpClassName, PhpFields, PhpGetField, PhpVarDump} from "./symbols.js";
import {PhpClass} from "./php-class.js";

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

export function __php__file(path: string, callback: () => Promise<void>) {
  __php__file[path] = callback;
  return callback;
}

export function __php__array(v: any) {
  return PhpArray.create(v);
}

class VarDumper {
  ident = '';

  run(data) {
    const lines = [];
    // Ugly mess but its a debug function, whatever
    for (const value of data) {
      if (typeof value === 'boolean') {
        lines.push(this.ident + 'bool(' + value + ')');
      } else if ((value ?? null) === null) {
        lines.push(this.ident + 'NULL');
      } else if (value instanceof PhpClass) {

        lines.push(this.ident + value[PhpClassName] + ' (' + value[PhpFields].length + ') {')
        this.ident += '  '
        const fields = value[PhpFields];
        for (const field of fields) {
          if (typeof field === 'number') {
            lines.push(this.ident + '[' + (field | 0) + '] =>')
          } else {
            lines.push(this.ident + '["' + escape(field) + '"] =>')
          }
          lines.push(this.run([value[PhpGetField](field)]));
        }
        this.ident = this.ident.substring(0, -2);
        lines.push(this.ident + '}');
      } else if (typeof value === 'number') {
        const type = (value | 0) === value ? 'int' : 'float';
        lines.push(this.ident + type + '(' + value + ')');
      } else if (typeof value === 'string') {
        lines.push(this.ident + 'string(' + value.length + ') ' + JSON.stringify(value));
      }
    }
    return lines.join('\n');
  }
}

export function var_dump(...data: any[]) {
  __php__print(new VarDumper().run(data));
}