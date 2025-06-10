import type { TContextDefault, TDatumDefault } from './types';

export interface AgChartCallbackParams<TDatum = TDatumDefault, TContext = TContextDefault> {
    /** The data point associated with the label. */
    datum: TDatum;
    /** The unique identifier of the item. */
    itemId?: string;
    /** The unique identifier of the series. */
    seriesId: string;
    /** Context for this callback. */
    context?: TContext;
}

export interface SeriesCallbackParams {
    /** The data associated with the series. */
    data: any;
    /** The unique identifier of the series. */
    seriesId: string;
}

export interface DatumCallbackParams<TDatum> {
    /** The data point associated with the label. */
    datum: TDatum;
    /** The unique identifier of the series. */
    seriesId: string;
    /** Indicates whether the element is highlighted. */
    highlighted: boolean;
}

export interface ContextCallbackParams<TContext> {
    /** Context for this callback. */
    context?: TContext;
}

export interface DatumItemCallbackParams<ItemType extends string, TDatum> extends DatumCallbackParams<TDatum> {
    /** The unique identifier of the item. */
    itemId: ItemType;
}

export type Formatter<P> = (params: P) => string | undefined;
export type Styler<P, S> = (params: P) => S | undefined;
export type Renderer<P, R> = (params: P) => string | R;
export type Listener<E> = (event: E) => void;
