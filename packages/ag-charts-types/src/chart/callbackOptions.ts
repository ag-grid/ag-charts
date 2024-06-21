export interface AgChartCallbackParams<TDatum = any> {
    /** The data point associated with the label. */
    datum: TDatum;
    /** The unique identifier of the item. */
    itemId?: string;
    /** The unique identifier of the series. */
    seriesId: string;
}

export interface SeriesCallbackParams {
    /** The data associated with the series. */
    data: any;
    /** The unique identifier of the series. */
    seriesId: string;
}

export interface DatumCallbackParams<TDatum, TItemId extends string = string> {
    /** The data point associated with the label. */
    datum: TDatum;
    /** The unique identifier of the series. */
    seriesId: string;
    /** Indicates whether the element is highlighted. */
    highlighted: boolean;
    /** The unique identifier of the item. */
    itemId?: TItemId;
}

export type Formatter<P> = (params: P) => string | undefined;
export type Styler<P extends DatumCallbackParams<any>, S> = (params: P) => S | undefined;
