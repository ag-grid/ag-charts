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

export interface DatumCallbackParams<TDatum> {
    /** The data point associated with the label. */
    datum: TDatum;
    /** The unique identifier of the series. */
    seriesId: string;
    /** Indicates whether the element is highlighted. */
    highlighted: boolean;
    /** The unique identifier of the item. */
    itemId?: string;
}

export type Callback<P, R> = (params: P) => R | undefined;
export type Formatter<P> = Callback<P, string>;
export type Styler<P extends DatumCallbackParams<any>, S> = Callback<P, S>;
