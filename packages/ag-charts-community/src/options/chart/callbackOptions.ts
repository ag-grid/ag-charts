export interface AgChartCallbackParams<TDatum = any> {
    /** The data point associated with the label. */
    datum: TDatum;
    /** The unique identifier of the item. */
    itemId?: string;
    /** The unique identifier of the series. */
    seriesId: string;
}

export type Callback<P, R> = (params: P) => R | undefined;
export type Formatter<P> = Callback<P, string>;
export type Styler<P, S> = Callback<P, S>;
