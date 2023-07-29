import {Diagnostics} from "../common/diagnostics.js";
import chalk from "chalk";

export class Source {
  public lines: [text: string, nmbr: number, start: number, end: number, width: number][] = [];

  constructor(
    public readonly text: string,
    public readonly file: string,
    // Included by which file?
    public readonly parent?: Source,
  ) {
    this.parseLines(text);
  }


  printDiagnostics(diagnostics: Diagnostics) {
    for(const {span, msg} of diagnostics.items) {

      const lineData = this.getLine(span.start);
      if (!lineData) {
        console.log(msg);
        continue
      }
      const [text,line ,start, end, width] = lineData;
      if (span.start < start) {
        throw new Error('Cant happen');
      }

      const relativeStart = span.start-start;
      const relativeEnd = span.end;
      const relativeLength = span.end-span.start;
      const pre = text.substring(0, relativeStart);
      const post = text.substring(relativeStart+relativeLength, relativeEnd);

      const error = this.text.substring(span.start, span.end)
      console.log(msg);

      const idx = this.lines.indexOf(lineData);
      for(let i = idx-2; i<idx+2&& i< this.lines.length; i++) {
        if (i < 0) continue;
        if (this.lines.length <= idx) continue;

        if (i === idx) {
          console.log(chalk.gray(i) + '| ' + chalk.white(pre) + chalk.redBright(error) + chalk.white(post))
        } else {
          const [text] = this.lines[i];
          console.log(chalk.gray(i) + '| ' +chalk.white(text));
        }
      }
    }
  }

  get(start: number, length: number) {
    return this.text.substring(start, start+length);
  }


  getLine(position: number) {
    let i=0;
    for (const line of this.lines) {
      const [, , , end, width] = line;
      if (position < end + width) {
        return line
      }
    }
  }

  getLineNumber(position: number) {
    return this.getLine(position)[1]
  }


  private parseLines(text: string) {
    let position = 0;
    let lineStart = 0;

    while (position < text.length) {
      const width = this.getLineBreakWidth(text, position);
      if (width === 0) {
        position++;
      } else {
        this.lines.push([text.substring(lineStart, position), this.lines.length+1, lineStart, position, width])
        position += width;
        lineStart = position;
      }
    }
    if (position >= lineStart) {
      this.lines.push([text.substring(lineStart, position), this.lines.length+1, lineStart, position, 0])
    }
  }

  private getLineBreakWidth(text: string, position: number) {
    const c = text[position];
    const l = text[position + 1];

    switch (true) {
      case c === '\r' && l === '\n':
        return 2;
      case c == '\r' || c === '\n':
        return 1;
      default:
        return 0;
    }
  }

}