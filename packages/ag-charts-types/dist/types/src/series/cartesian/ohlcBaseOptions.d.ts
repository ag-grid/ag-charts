import type { DatumItemCallbackParams } from '../../chart/callbackOptions';
import type { LineDashOptions, StrokeOptions } from './commonOptions';
export type AgOhlcSeriesItemType = 'up' | 'down';
export type AgOhlcSeriesBaseOptions = AgOhlcSeriesOptionsKeys & AgOhlcSeriesOptionsNames;
export interface AgOhlcSeriesOptionsKeys {
    /** xKey as specified on series options. */
    xKey: string;
    /** The key to use to retrieve open values from the data. */
    openKey: string;
    /** The key to use to retrieve close values from the data. */
    closeKey: string;
    /** The key to use to retrieve high values from the data. */
    highKey: string;
    /** The key to use to retrieve low values from the data. */
    lowKey: string;
}
export interface AgOhlcSeriesOptionsNames {
    /** xName as specified on series options. */
    xName?: string;
    /** yName as specified on series options. */
    yName?: string;
    /** A human-readable description of open values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    openName?: string;
    /** A human-readable description of close values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    closeName?: string;
    /** A human-readable description of high values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    highName?: string;
    /** A human-readable description of low values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    lowName?: string;
}
type OhlcItemCallbackParams<TDatum> = DatumItemCallbackParams<AgOhlcSeriesItemType, TDatum>;
export type AgOhlcSeriesBaseItemStylerParams<TDatum> = OhlcItemCallbackParams<TDatum> & AgOhlcSeriesOptionsKeys & Required<StrokeOptions & LineDashOptions>;
export type AgOhlcSeriesBaseTooltipRendererParams<TDatum> = OhlcItemCallbackParams<TDatum> & AgOhlcSeriesOptionsKeys & AgOhlcSeriesOptionsNames;
export {};
