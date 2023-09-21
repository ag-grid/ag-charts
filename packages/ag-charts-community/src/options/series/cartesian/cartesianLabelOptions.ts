import type { AgChartLabelOptions } from '../../chart//labelOptions';

export interface AgCartesianSeriesLabelFormatterParams {
    /** The ID of the series. */
    readonly seriesId: string;
    /** The value of yKey as specified on series options. */
    readonly value: any;
}

export interface AgCartesianSeriesLabelOptions extends AgChartLabelOptions {
    /** Function used to turn 'yKey' values into text to be displayed by a label. By default the values are simply stringified. */
    formatter?: (params: AgCartesianSeriesLabelFormatterParams) => string;
}
