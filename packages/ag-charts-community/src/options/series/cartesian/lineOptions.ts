import type { AgErrorBarOptions } from '../../chart/errorBarOptions';
import type { AgSeriesListeners } from '../../chart/eventOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgCartesianSeriesLabelOptions } from './cartesianLabelOptions';
import type { AgCartesianSeriesMarker } from './cartesianSeriesMarkerOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { LineDashOptions, StrokeOptions } from './commonOptions';

export interface AgLineSeriesThemeableOptions<DatumType = any>
    extends StrokeOptions,
        LineDashOptions,
        AgBaseSeriesThemeableOptions {
    marker?: AgCartesianSeriesMarker<DatumType>;
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not. */
    title?: string;
    /** Configuration for the labels shown on top of data points. */
    label?: AgCartesianSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgCartesianSeriesTooltipRendererParams>;
}

/** Configuration for line series. */
export interface AgLineSeriesOptions<DatumType = any>
    extends AgLineSeriesThemeableOptions<DatumType>,
        AgBaseSeriesOptions<DatumType> {
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
    listeners?: AgSeriesListeners<DatumType>;
    /** Configuration for the series error bars. */
    errorBar?: AgErrorBarOptions;
}
