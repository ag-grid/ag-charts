import type { AgColorRef, AgColorRefMixOnto, AgColorRefMixOntoColor } from 'ag-charts-types';

/** Theme colour-reference object members of the public colour unions. Always resolved away at render time. */
type ColorRef = AgColorRef | AgColorRefMixOnto | AgColorRefMixOntoColor;

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/**
 * Transforms a public options shape into its post-resolution colour shape: theme colour references
 * (`AgColorRef`/`AgColorRefMixOnto`) are stripped from every colour union, leaving the resolved
 * `CssColor`/gradient/pattern/image members, recursing through nested objects and arrays.
 *
 * Mirrors the runtime guarantee that `optionsGraphService.resolvePartial(...)` (and static
 * options-graph processing) has already resolved all refs by the time a value is consumed.
 */
export type Resolved<T> = T extends Primitive
    ? T
    : // Functions (e.g. marker-shape callbacks) and other non-data values pass through untouched.
      T extends (...args: any[]) => any
      ? T
      : T extends ReadonlyArray<infer E>
        ? Array<Resolved<E>>
        : T extends ColorRef
          ? never
          : { [K in keyof T]: Resolved<Exclude<T[K], ColorRef>> };
