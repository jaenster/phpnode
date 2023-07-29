import * as fs from "fs";
//@ts-ignore
import {WaitFor, WaitOn} from "../decorator/wait-for.js";
import {Lexer} from "../source/lexer.js";
import {Diagnostics} from "../common/diagnostics.js";
import {Source} from "../source/source.js";
import {Parser} from "../source/parser.js";
import {Binder} from "../binder/binder.js";
import {PhpConcepts} from "../transformer/php-concepts.js";
import {Javascript} from "../transformer/javascript-source.js";
import {parse} from 'node:path'



export class PHPFile {
  public readonly filename: string;
  public readonly source: Source;
  public readonly diagnostic: Diagnostics
  public readonly handler: () => Promise<any>;


  private constructor(data: Partial<PHPFile>) {
    Object.assign(this, data);
  }

  async run(): Promise<string> {
    // Run the php stuff
    await this.handler();

    // Return the output
    return __php__current__request.out.join('');
  }

  @WaitOn()
  async compile() {
    const lexer = new Lexer(this.source, this.diagnostic);
    const parser = new Parser(this.source, [...lexer], this.diagnostic);
    const ast = parser.parseFile();

    const binder = new Binder(this.diagnostic);

    const bound = binder.bindAst(ast);
    const transformer = new PhpConcepts()

    const transformed = transformer.transformFile(bound);
    transformed.prettyPrint();

    const toJs = new Javascript();
    const result = toJs.toSourceFileStatement(transformed);


    return result;
  }

  static async create(path: string) {
    const buffer = await fs.promises.readFile(process.cwd()+path);
    if (!buffer) return false;

    const source = buffer.toString('utf-8');

    const file = new PHPFile({
      source: new Source(source, path),
      diagnostic: new Diagnostics,
    });

    const result = await file.compile();

    const pathInfo = parse(path)

    // Store result
    const target = process.cwd()+globalThis.__PHP__store.transpiled+'/'+pathInfo.name+'.js';
    await fs.promises.writeFile(target, result);

    // es modules are weird with dynamic's. Both the import as the default need to resolve
    const imported = await (await import('file://'+target)).default;

    Object.assign(file, {handler: imported});
    globalThis.__PHP__store.files.set(path, file);
    return file;
  }

}