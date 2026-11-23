import type {
    AgColorRef,
    AgColorRefMixOnto,
    AgColorRefMixOntoColor,
    AgLineDashName,
    AgSolidColor,
} from 'ag-charts-types';

/**
 * Members of the public colour unions that are always resolved away at render time: theme colour references, and a
 * solid colour object, which resolves to its colour string.
 */
type ColorRef = AgColorRef | AgColorRefMixOnto | AgColorRefMixOntoColor | AgSolidColor;

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/**
 * Transforms a public options shape into its post-resolution colour shape: theme colour references
 * (`AgColorRef`/`AgColorRefMixOnto`) and solid colour objects are stripped from every colour union, leaving the
 * resolved `CssColor`/gradient/pattern/image members, recursing through nested objects and arrays.
 *
 * A `lineDash` name (`AgLineDashName`) is likewise replaced by the array of lengths it stands for.
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
          : { [K in keyof T]: Resolved<Exclude<T[K], K extends 'lineDash' ? ColorRef | AgLineDashName : ColorRef>> };
