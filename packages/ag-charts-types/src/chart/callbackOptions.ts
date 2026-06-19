import type { ImageSegment, TextSegment, TextValue } from '../series/cartesian/commonOptions';
import type { ContextDefault, CssColor, DatumDefault } from './types';

export type AgItemType = 'positive' | 'negative' | 'total' | 'subtotal' | 'up' | 'down' | 'low' | 'high';

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

export type SelectionState = 'selected-item' | 'unselected-item' | 'unselected-series' | 'none';

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
    /** The specific candidate state of the element. Undefined if the selection module is disabled or if no drag motion is in progress. */
    candidateState?: SelectionState;
}

export interface SeriesCallbackParams<
    THighlightState extends string = HighlightState,
    TSelectionState extends string = SelectionState,
> {
    /** The unique identifier of the series. */
    seriesId: string;
    /** The specific highlight state of the element. */
    highlightState?: THighlightState;
    /** The specific selection state of the element. Undefined if the selection module is disabled. */
    selectionState?: TSelectionState;
    /** The specific candidate state of the element. Undefined if the selection module is disabled or if no drag motion is in progress. */
    candidateState?: SelectionState;
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
export type RichFormatter<P> = (params: P) => NormalisedTextOrSegments | undefined;
export type Styler<P, S> = (params: P) => S | undefined;
export type Renderer<P, R = never> = (params: P) => TextValue | R | undefined;
export type Listener<E> = (event: E) => void;

/**
 * A text segment whose colour has been normalised to a resolved CSS colour string, with theme
 * colour references no longer permitted.
 */
export interface NormalisedTextSegment extends Omit<TextSegment, 'color'> {
    /** Resolved colour for this segment. */
    color?: CssColor;
}

export type NormalisedTextOrSegments = TextValue | (NormalisedTextSegment | ImageSegment)[];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type NormalisedCallbackParams<P, O extends Partial<Record<keyof P, unknown>> = {}> = Omit<
    P,
    keyof O | 'context'
> &
    O;
