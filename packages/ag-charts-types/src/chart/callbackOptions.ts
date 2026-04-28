import type { TextOrSegments, TextValue } from '../series/cartesian/commonOptions';
import type { ContextDefault, DatumDefault } from './types';

type AgItemType = 'positive' | 'negative' | 'total' | 'subtotal' | 'up' | 'down' | 'low' | 'high';

export interface AgChartCallbackParams<TDatum = DatumDefault, TContext = ContextDefault> {
    /** The data point associated with the label. */
    datum: TDatum;
    /** The unique identifier of the item. */
    itemId?: string | number;
    /** The type of datum. */
    itemType?: AgItemType;
    /** The unique identifier of the series. */
    seriesId: string;
    /** Context for this callback. */
    context?: TContext;
}

export type HighlightState =
    | 'highlighted-item'
    | 'unhighlighted-item'
    | 'highlighted-branch'
    | 'unhighlighted-branch'
    | 'highlighted-series'
    | 'unhighlighted-series'
    | 'none';

export type SelectionState = 'selected' | 'unselected';

/**
 * Highlight states for hierarchical series (e.g., treemap, sunburst) that support
 * differentiating between nodes that share a root branch vs. those that don't.
 */
export type HierarchyHighlightState =
    | Exclude<HighlightState, 'highlighted-series' | 'unhighlighted-series'>
    | 'highlighted-branch'
    | 'unhighlighted-branch';

export interface DatumCallbackParams<TDatum, THighlightState extends string = HighlightState> {
    /** The data point associated with the label. */
    datum: TDatum;
    /** The unique identifier of the series. */
    seriesId: string;
    /** The specific highlight state of the element. */
    highlightState?: THighlightState;
    /** The specific selection state of the element. Undefined if the selection module is disabled. */
    selectionState?: SelectionState;
}

export interface SeriesCallbackParams<THighlightState extends string = HighlightState> {
    /** The unique identifier of the series. */
    seriesId: string;
    /** The specific highlight state of the element. */
    highlightState?: THighlightState;
}

export interface ContextCallbackParams<TContext> {
    /** Context for this callback. */
    context?: TContext;
}

export interface DatumItemCallbackParams<
    ItemType extends AgItemType,
    TDatum,
    THighlightState extends string = HighlightState,
> extends DatumCallbackParams<TDatum, THighlightState> {
    /** The typeunique identifier of the item. */
    itemType: ItemType;
}

export type Formatter<P> = (params: P) => TextValue | undefined;
export type RichFormatter<P> = (params: P) => TextOrSegments | undefined;
export type Styler<P, S> = (params: P) => S | undefined;
/**
 * Standard renderer callback for content-producing options (tooltips, crosshair labels, overlays, etc.).
 *
 * Return semantics (consumers must follow this convention):
 * - Return a `TextValue` (string/number/Date) or `R` to provide content.
 * - Return `undefined` (or omit a return value) to fall through to the default content
 *   (e.g. `tooltip.text`, the formatted axis value, or the built-in overlay text).
 * - Return an empty string to render empty content. Whether that suppresses the tooltip/label
 *   entirely is a per-consumer choice — tooltip-style consumers treat empty string as "suppress".
 *
 * All `renderer?:` declarations in `ag-charts-types` MUST use this type so the contract is uniform.
 */
export type Renderer<P, R> = (params: P) => TextValue | R | undefined;
export type Listener<E> = (event: E) => void;
