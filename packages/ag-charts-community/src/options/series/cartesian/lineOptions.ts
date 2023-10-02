import type { AgErrorBarOptions } from '../../chart/errorBarOptions';
import type { AgSeriesListeners } from '../../chart/eventOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgCartesianSeriesMarker } from './cartesianSeriesMarkerOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { LineDashOptions, StrokeOptions } from './commonOptions';

export interface AgLineSeriesThemeableOptions<TDatum = any>
    extends StrokeOptions,
        LineDashOptions,
        AgBaseSeriesThemeableOptions {
    marker?: AgCartesianSeriesMarker<TDatum>;
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not. */
    title?: string;
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgCartesianSeriesTooltipRendererParams>;
}

/** Configuration for line series. */
export interface AgLineSeriesOptions<TDatum = any>
    extends AgLineSeriesThemeableOptions<TDatum>,
        AgBaseSeriesOptions<TDatum> {
    type?: 'line';
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** The key to use to retrieve y-values from the data. */
    yKey: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<TDatum>;
    /** Configuration for the series error bars. */
    errorBar?: AgErrorBarOptions;
}
