import type { ContextCallbackParams, DatumItemCallbackParams } from '../../chart/callbackOptions';
import type { AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { LineDashOptions, StrokeOptions } from './commonOptions';

export type AgOhlcSeriesItemType = 'up' | 'down';

export type AgOhlcSeriesBaseOptions<TDatum = TDatumDefault> = AgOhlcSeriesOptionsKeys<TDatum> &
    AgOhlcSeriesOptionsNames;

export interface AgOhlcSeriesOptionsKeys<TDatum = TDatumDefault> {
    /** xKey as specified on series options. */
    xKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve open values from the data. */
    openKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve close values from the data. */
    closeKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve high values from the data. */
    highKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve low values from the data. */
    lowKey: TDatum extends object ? keyof TDatum & string : string;
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

type OhlcItemCallbackParams<TDatum = TDatumDefault> = DatumItemCallbackParams<AgOhlcSeriesItemType, TDatum>;

export type AgOhlcSeriesBaseItemStylerParams<
    TDatum = TDatumDefault,
    TContext = TContextDefault,
> = OhlcItemCallbackParams<TDatum> &
    ContextCallbackParams<TContext> &
    AgOhlcSeriesOptionsKeys<TDatum> &
    StrokeOptions &
    LineDashOptions;

export interface AgOhlcSeriesBaseTooltipRendererParams<TDatum, TContext = TContextDefault>
    extends AgSeriesTooltipRendererParams<TDatum, TContext>,
        AgOhlcSeriesOptionsKeys<TDatum>,
        AgOhlcSeriesOptionsNames,
        StrokeOptions,
        LineDashOptions {
    /** Direction of the datum */
    itemId: 'up' | 'down';
}
