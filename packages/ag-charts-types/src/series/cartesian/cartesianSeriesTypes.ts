import type { AgAreaSeriesOptions } from './areaOptions';
import type { AgBarSeriesOptions } from './barOptions';
import type { AgBoxPlotSeriesOptions } from './boxPlotOptions';
import type { AgBubbleSeriesOptions } from './bubbleOptions';
import type { AgCandlestickSeriesOptions } from './candlestickOptions';
import type { AgConeFunnelSeriesOptions } from './coneFunnelOptions';
import type { AgFunnelSeriesOptions } from './funnelOptions';
import type { AgHeatmapSeriesOptions } from './heatmapOptions';
import type { AgHistogramSeriesOptions } from './histogramOptions';
import type { AgLineSeriesOptions } from './lineOptions';
import type { AgOhlcSeriesOptions } from './ohlcOptions';
import type { AgRangeAreaSeriesOptions } from './rangeAreaOptions';
import type { AgRangeBarSeriesOptions } from './rangeBarOptions';
import type { AgScatterSeriesOptions } from './scatterOptions';
import type { AgWaterfallSeriesOptions } from './waterfallOptions';

export type AgCartesianSeriesOptions<TDatum> =
    | AgAreaSeriesOptions<TDatum>
    | AgBarSeriesOptions<TDatum>
    | AgBoxPlotSeriesOptions<TDatum>
    | AgBubbleSeriesOptions<TDatum>
    | AgCandlestickSeriesOptions<TDatum>
    | AgConeFunnelSeriesOptions<TDatum>
    | AgFunnelSeriesOptions<TDatum>
    | AgHeatmapSeriesOptions<TDatum>
    | AgHistogramSeriesOptions<TDatum>
    | AgLineSeriesOptions<TDatum>
    | AgOhlcSeriesOptions<TDatum>
    | AgRangeAreaSeriesOptions<TDatum>
    | AgRangeBarSeriesOptions<TDatum>
    | AgScatterSeriesOptions<TDatum>
    | AgWaterfallSeriesOptions<TDatum>;
