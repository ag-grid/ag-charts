import type { AgErrorBarOptions } from '../../chart/errorBarOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgCartesianSeriesMarker } from './cartesianSeriesMarkerOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';

export interface AgScatterSeriesTooltipRendererParams extends AgCartesianSeriesTooltipRendererParams {
    /** labelKey as specified on series options. */
    readonly labelKey?: string;
    /** labelName as specified on series options. */
    readonly labelName?: string;
}

export interface AgScatterSeriesThemeableOptions<TDatum = any> extends AgBaseSeriesThemeableOptions {
    /** Configuration for the markers used in the series.  */
    marker?: AgCartesianSeriesMarker<TDatum>;
    /** Configuration for the labels shown on top of data points.  */
    label?: AgChartLabelOptions;
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not.  */
    title?: string;
    /** Series-specific tooltip configuration.  */
    tooltip?: AgSeriesTooltip<AgScatterSeriesTooltipRendererParams>;
}

/** Configuration for scatter/bubble series. */
export interface AgScatterSeriesOptions<TDatum = any>
    extends AgScatterSeriesThemeableOptions<TDatum>,
        AgBaseSeriesOptions<TDatum> {
    /** Configuration for the scatter series.  */
    type: 'scatter';
    /** The key to use to retrieve x-values from the data.  */
    xKey: string;
    /** The key to use to retrieve y-values from the data.  */
    yKey: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    yName?: string;
    /** The key to use to retrieve values from the data to use as labels for the markers.  */
    labelKey?: string;
    /** A human-readable description of the label values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    labelName?: string;
    /** Configuration for the series error bars. */
    errorBar?: AgErrorBarOptions;
}
