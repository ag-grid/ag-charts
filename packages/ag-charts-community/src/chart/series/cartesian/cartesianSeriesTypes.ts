import type { AgAreaSeriesOptions } from './areaOptions';
import type { AgBarSeriesOptions } from './barOptions';
import type { AgHeatmapSeriesOptions } from './heatmapOptions';
import type { AgHistogramSeriesOptions } from './histogramOptions';
import type { AgLineSeriesOptions } from './lineOptions';
import type { AgRangeBarSeriesOptions } from './rangeBarOptions';
import type { AgScatterSeriesOptions } from './scatterOptions';
import type { AgWaterfallSeriesOptions } from './waterfallOptions';

export type AgCartesianSeriesOptions =
    | AgLineSeriesOptions
    | AgScatterSeriesOptions
    | AgAreaSeriesOptions
    | AgBarSeriesOptions
    | AgHistogramSeriesOptions
    | AgHeatmapSeriesOptions
    | AgWaterfallSeriesOptions
    | AgRangeBarSeriesOptions;
