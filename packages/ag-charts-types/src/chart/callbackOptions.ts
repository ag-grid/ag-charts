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
    /** Indicates whether the element is highlighted. */
    highlighted: boolean;
    /** The specific highlight state of the element. */
    highlightState?: THighlightState;
}

export interface SeriesCallbackParams<THighlightState extends string = HighlightState> {
    /** The unique identifier of the series. */
    seriesId: string;
    /** Indicates whether the element is highlighted. */
    highlighted: boolean;
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
export type Renderer<P, R> = (params: P) => TextValue | R;
export type Listener<E> = (event: E) => void;
