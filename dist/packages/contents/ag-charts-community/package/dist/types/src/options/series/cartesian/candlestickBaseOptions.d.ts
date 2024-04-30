import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgSeriesFormatterParams, AxisOptions, StrokeOptions } from './commonOptions';
export type AgCandlestickSeriesItemType = 'up' | 'down';
export interface AgCandlestickSeriesBaseOptions {
    /** The key to use to retrieve open values from the data. */
    openKey: string;
    /** The key to use to retrieve close values from the data. */
    closeKey: string;
    /** The key to use to retrieve high values from the data. */
    highKey: string;
    /** The key to use to retrieve low values from the data. */
    lowKey: string;
    /** A human-readable description of open values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    openName?: string;
    /** A human-readable description of close values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    closeName?: string;
    /** A human-readable description of high values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    highName?: string;
    /** A human-readable description of low values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    lowName?: string;
}
export type AgCandlestickSeriesBaseFormatterParams<TDatum> = AgSeriesFormatterParams<TDatum> & Readonly<AgCandlestickSeriesBaseOptions & Omit<AxisOptions, 'yKey'> & StrokeOptions & {
    /** Identifier showing whether the data element is rising (`up`) or falling (`down`). */
    itemId: AgCandlestickSeriesItemType;
    highlighted: boolean;
}>;
export interface AgCandlestickSeriesBaseTooltipRendererParams extends Omit<AgCartesianSeriesTooltipRendererParams, 'yKey'> {
}
