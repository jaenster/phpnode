import {SyntaxKind} from "./syntax.kind.js";


export const KeywordsBySyntax = {
  [SyntaxKind.HaltCompilerKeyword]: '__halt_compiler',
  [SyntaxKind.AbstractKeyword]: 'abstract',
  [SyntaxKind.AndKeyword]: 'and',
  [SyntaxKind.ArrayKeyword]: 'array',
  [SyntaxKind.AsKeyword]: 'as',
  [SyntaxKind.BreakKeyword]: 'break',
  [SyntaxKind.CallableKeyword]: 'callable',
  [SyntaxKind.CaseKeyword]: 'case',
  [SyntaxKind.CatchKeyword]: 'catch',
  [SyntaxKind.ClassKeyword]: 'class',
  [SyntaxKind.CloneKeyword]: 'clone',
  [SyntaxKind.ConstKeyword]: 'const',
  [SyntaxKind.ContinueKeyword]: 'continue',
  [SyntaxKind.DeclareKeyword]: 'declare',
  [SyntaxKind.DefaultKeyword]: 'default',
  [SyntaxKind.DieKeyword]: 'die',
  [SyntaxKind.DoKeyword]: 'do',
  [SyntaxKind.EchoKeyword]: 'echo',
  [SyntaxKind.ElseKeyword]: 'else',
  [SyntaxKind.ElseifKeyword]: 'elseif',
  [SyntaxKind.EmptyKeyword]: 'empty',
  [SyntaxKind.EndDeclareKeyword]: 'enddeclare',
  [SyntaxKind.EndForKeyword]: 'endfor',
  [SyntaxKind.EndForEachKeyword]: 'endforeach',
  [SyntaxKind.EndIfKeyword]: 'endif',
  [SyntaxKind.EndWwitchKeyword]: 'endswitch',
  [SyntaxKind.EndWhileKeyword]: 'endwhile',
  [SyntaxKind.EvalKeyword]: 'eval',
  [SyntaxKind.ExitKeyword]: 'exit',
  [SyntaxKind.ExtendsKeyword]: 'extends',
  [SyntaxKind.FinalKeyword]: 'final',
  [SyntaxKind.FinallyKeyword]: 'finally',
  [SyntaxKind.FnKeyword]: 'fn',
  [SyntaxKind.ForKeyword]: 'for',
  [SyntaxKind.ForEachKeyword]: 'foreach',
  [SyntaxKind.FunctionKeyword]: 'function',
  [SyntaxKind.GlobalKeyword]: 'global',
  [SyntaxKind.GotoKeyword]: 'goto',
  [SyntaxKind.IfKeyword]: 'if',
  [SyntaxKind.ImplementsKeyword]: 'implements',
  [SyntaxKind.IncludeKeyword]: 'include',
  [SyntaxKind.IncludeOnceKeyword]: 'include_once',
  [SyntaxKind.InstanceofKeyword]: 'instanceof',
  [SyntaxKind.InsteadofKeyword]: 'insteadof',
  [SyntaxKind.InterfaceKeyword]: 'interface',
  [SyntaxKind.IssetKeyword]: 'isset',
  [SyntaxKind.ListKeyword]: 'list',
  [SyntaxKind.MatchKeyword]: 'match',
  [SyntaxKind.NamespaceKeyword]: 'namespace',
  [SyntaxKind.NewKeyword]: 'new',
  [SyntaxKind.OrKeyword]: 'or',
  [SyntaxKind.PrintKeyword]: 'print',
  [SyntaxKind.PrivateKeyword]: 'private',
  [SyntaxKind.ProtectedKeyword]: 'protected',
  [SyntaxKind.PublicKeyword]: 'public',
  [SyntaxKind.ReadonlyKeyword]: 'readonly',
  [SyntaxKind.RequireKeyword]: 'require',
  [SyntaxKind.RequireOnceKeyword]: 'require_once',
  [SyntaxKind.ReturnKeyword]: 'return',
  [SyntaxKind.StaticKeyword]: 'static',
  [SyntaxKind.SwitchKeyword]: 'switch',
  [SyntaxKind.ThrowKeyword]: 'throw',
  [SyntaxKind.TraitKeyword]: 'trait',
  [SyntaxKind.TryKeyword]: 'try',
  [SyntaxKind.UnsetKeyword]: 'unset',
  [SyntaxKind.UseKeyword]: 'use',
  [SyntaxKind.VarKeyword]: 'var',
  [SyntaxKind.WhileKeyword]: 'while',
  [SyntaxKind.XorKeyword]: 'xor',
  [SyntaxKind.YieldKeyword]: 'yield',

  // From for yield from
  [SyntaxKind.FromKeyword]: 'from',
  [SyntaxKind.TrueKeyword]: 'true',
  [SyntaxKind.FalseKeyword]: 'false',
} as const

type Values<T> = T[keyof T];

export const KeywordsByName = {} as Record<Values<typeof KeywordsBySyntax>, SyntaxKind>

Object.entries(KeywordsBySyntax).forEach((([v, k]) => KeywordsByName[k] = Number(v)))