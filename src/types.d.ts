//https://stackoverflow.com/questions/46583883/typescript-pick-properties-with-a-defined-type
type KeysOfType<T, U, B = false> = {
  [P in keyof T]: B extends true
    ? T[P] extends U
      ? (U extends T[P]
        ? P
        : never)
      : never
    : T[P] extends U
      ? P
      : never;
}[keyof T];

export type PickByType<T, U, B = false> = Pick<T, KeysOfType<T, U, B>>;
