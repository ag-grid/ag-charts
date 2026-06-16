import type { DatumKey } from './types';

// Compile-time type assertions for `DatumKey`. This file has no runtime tests; it exists so that
// `build:types` fails if `DatumKey`'s dot-notation behaviour regresses. Keep it compiled (do not
// rename to `*.test.ts` — that pattern is excluded from the build tsconfig). Datum shapes are
// inlined rather than declared as interfaces to avoid the docs reference generator reading a
// `name` off index-signature members.

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// Each assertion is referenced from the exported tuple below so none is dead under `noUnusedLocals`.
export type _DatumKeyChecks = [
    // Bare key and nested path are both present.
    Expect<Equal<DatumKey<{ x: { date: string } }>, 'x' | 'x.date'>>,

    // Recursion walks several levels deep.
    Expect<Equal<DatumKey<{ a: { b: { c: { d: string } } } }>, 'a' | 'a.b' | 'a.b.c' | 'a.b.c.d'>>,

    // Optional nested properties contribute both the bare key and the nested path.
    Expect<Equal<DatumKey<{ a?: { b: string } }>, 'a' | 'a.b'>>,

    // Array-valued properties are leaves — no `items.name`.
    Expect<Equal<DatumKey<{ items: Array<{ name: string }> }>, 'items'>>,

    // Date-valued properties are leaves — no `d.<method>` expansion.
    Expect<Equal<DatumKey<{ d: Date; label: string }>, 'd' | 'label'>>,

    // Index signatures collapse to `string`.
    Expect<Equal<DatumKey<Record<string, number>>, string>>,

    // Untyped / non-object datums fall back to `string`.
    Expect<Equal<DatumKey<any>, string>>,
    Expect<Equal<DatumKey<number>, string>>,
];
