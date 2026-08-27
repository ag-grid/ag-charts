export type FontStyle = 'normal' | 'italic' | 'oblique';
export type FontWeight = 'normal' | 'bold' | 'bolder' | 'lighter' | number;
export type FontFamily = string;
export type FontFamilyFull = FontFamily | GoogleFontFamily | Array<FontFamily | GoogleFontFamily>;
export type FontSize = number;

export interface GoogleFontFamily {
    /** The name of the Google font family, e.g. 'Roboto' */
    googleFont: FontFamily;
}

export type AgMarkerShape =
    | 'circle'
    | 'cross'
    | 'diamond'
    | 'heart'
    | 'plus'
    | 'pin'
    | 'square'
    | 'star'
    | 'triangle'
    | AgMarkerShapeFn;

export interface AgPath {
    readonly moveTo: (x: number, y: number) => void;
    readonly lineTo: (x: number, y: number) => void;
    readonly rect: (x: number, y: number, width: number, height: number) => void;
    readonly roundRect: (x: number, y: number, width: number, height: number, radii: number) => void;
    readonly arc: (x: number, y: number, r: number, sAngle: number, eAngle: number, counterClockwise?: boolean) => void;
    readonly cubicCurveTo: (cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number) => void;
    readonly closePath: () => void;
    readonly clear: (trackChanges?: boolean) => void;
}

export interface AgMarkerShapeFnParams {
    path: AgPath;
    x: number;
    y: number;
    size: number;
    pixelRatio: number;
}

export type AgMarkerShapeFn = (params: AgMarkerShapeFnParams) => void;

export type LabelPlacement = 'top' | 'bottom' | 'left' | 'right';

/** Alias to denote that a value should be a colour string in one of the supported formats: hex, `rgb()`/`rgba()`, `hsl()`/`hsla()`, `oklch()`, or a CSS colour name. */
export type CssColor = string;

/** Alias to denote that a value should be a CSS-compliant shadow string, such as `10px 5px 5px black`. */
export type CssShadow = string;

/** Alias to denote that a value reflects an alpha opacity in the range [0, 1]. */
export type Opacity = number;

/** Alias to denote that a value is a measurement in pixels. */
export type PixelSize = number;

/** Alias to denote that a value is a ratio, usually in the range [0, 1]. */
export type Ratio = number;

/** Alias to denote that a value is a duration in milliseconds */
export type DurationMs = number;

/** Alias to denote that a value is an angle in degrees */
export type Degree = number;

/** Alias to denote that a value is an axis value. */
export type AxisValue = any;

/**
 * Horizontal text alignment. `'start'` and `'end'` are direction-relative: they resolve to
 * `'left'`/`'right'` for a left-to-right chart, and to `'right'`/`'left'` for a right-to-left one.
 */
export type TextAlign = 'left' | 'center' | 'right' | 'start' | 'end';

/**
 * Text wrapping strategy for labels.
 * - `'always'` will always wrap text to fit within the tile.
 * - `'hyphenate'` is similar to `'always'`, but inserts a hyphen (`-`) if forced to wrap in the middle of a word.
 * - `'on-space'` will only wrap on white space. If there is no possibility to wrap a line on space and satisfy the tile dimensions, the text will be truncated.
 * - `'never'` disables text wrapping.
 *
 * Default: `'on-space'`
 */
export type TextWrap = 'never' | 'always' | 'hyphenate' | 'on-space';

/**
 * Adjusts the behaviour of labels when they overflow
 * - `'ellipsis'` will truncate the text to fit, appending an ellipsis (...)
 * - `'hide'` only displays the label if it completely fits within its bounds, and removes it if it would overflow
 */
export type OverflowStrategy = 'ellipsis' | 'hide';

/**
 * Define a range within which an interaction can trigger on a point with one of:
 * A distance in pixels from a point within which the event can be triggered.
 * - `'exact'` triggers when the event occurs directly over a point.
 * - `'nearest'` always tracks the nearest point anywhere on the chart.
 * - `'area'` (area series only) triggers only when inside the filled area boundary.
 */
export type InteractionRange = PixelSize | 'exact' | 'nearest' | 'area';

export type VerticalAlign = 'top' | 'middle' | 'bottom';

export type Direction = 'vertical' | 'horizontal';

export type GeoJSON = any;

export type DatumDefault = any;

export type ContextDefault = unknown;

// Depth counter: index N yields N-1; index 0 yields `never`, terminating recursion.
type DatumKeyDepth = [never, 0, 1, 2, 3];

// A value is traversable only if it is a plain nested object. Arrays are excluded because runtime
// dot-notation does not index into arrays; Date and functions are leaves, not paths to walk.
type DatumKeyTraversable<T> = T extends ReadonlyArray<any> | Date | ((...args: any[]) => any)
    ? false
    : T extends object
      ? true
      : false;

type DatumKeyPaths<T, Depth extends number> = [Depth] extends [never]
    ? never
    : {
          [K in keyof T & string]: DatumKeyTraversable<NonNullable<T[K]>> extends true
              ? K | `${K}.${DatumKeyPaths<NonNullable<T[K]>, DatumKeyDepth[Depth]>}`
              : K;
      }[keyof T & string];

// Accepts dot-notation paths for nested data. Use for option inputs (e.g. series `xKey`).
export type DatumKey<TDatum> = TDatum extends object ? DatumKeyPaths<TDatum, 4> & string : string;

// Top-level keys only. Use where a key is echoed back to the user and indexed against the datum
// (event payloads, formatter and renderer params) — `datum[key]` must stay type-safe there.
export type ResolvedDatumKey<TDatum> = TDatum extends object ? keyof TDatum & string : string;
