import type { NormalisedTextOrSegments } from '../chart/callbackOptions';
import type { ContextDefault, CssColor, DatumDefault } from '../chart/types';

/** A value returned by a series `collector`. */
export interface AgSeriesCollectedValue {
    /** The key identifying the value. */
    key: string;
    /** The display name of the value. */
    label?: string;
    /** The value before formatting. */
    value: unknown;
    /** The value as text. When not set, values for keys bound to an axis are formatted as the axis formats them. */
    formattedValue?: NormalisedTextOrSegments;
    /** The colour of the value. When not set, the colour the series draws the datum with. */
    color?: CssColor;
    /** Whether the value is the datum's category, such as its `xKey` value. Category values are not shown by default. */
    category?: boolean;
}

/** A value collected from a series. */
export interface AgCollectedValue<TDatum = DatumDefault> {
    /** The ID of the series the value was collected from. */
    readonly seriesId: string;
    /** The key the value was read from. */
    readonly key: string;
    /** The display name of the value, such as the series' `yName`. */
    readonly label?: string;
    /** The value before formatting. */
    readonly value: unknown;
    /** The value formatted as the series' axis formats it, when the key is bound to an axis. */
    readonly formattedValue?: NormalisedTextOrSegments;
    /** The colour the series draws the value with, after any `itemStyler`. */
    readonly color?: CssColor;
    /** Whether the value is the datum's category, such as its `xKey` value. Category values are not shown by default. */
    readonly category?: boolean;
    /** The datum the value was collected from. `undefined` for histogram bins and waterfall totals. */
    readonly datum: TDatum;
}

export interface AgSeriesCollectorParams<TDatum = DatumDefault, TContext = ContextDefault> {
    /** The ID of the series. */
    readonly seriesId: string;
    /** The datum to collect values from. `undefined` for histogram bins and waterfall totals. */
    readonly datum: TDatum;
    /** The values the series collects by default. */
    readonly values: readonly AgCollectedValue<TDatum>[];
    /** Context for this callback. */
    readonly context?: TContext;
}

export type AgSeriesCollector<TDatum = DatumDefault, TContext = ContextDefault> = (
    params: AgSeriesCollectorParams<TDatum, TContext>
) => AgSeriesCollectedValue[] | undefined;
