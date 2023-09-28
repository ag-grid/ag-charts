import type { AgErrorBarOptions } from '../../chart/errorBarOptions';
import type { AgSeriesListeners } from '../../chart/eventOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgCartesianSeriesLabelFormatterParams } from './cartesianLabelOptions';
import type { AgCartesianSeriesMarker } from './cartesianSeriesMarkerOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';

export interface AgScatterSeriesTooltipRendererParams extends AgCartesianSeriesTooltipRendererParams {
    /** labelKey as specified on series options. */
    readonly labelKey?: string;
    /** labelName as specified on series options. */
    readonly labelName?: string;
}

export interface AgScatterSeriesLabelFormatterParams<DatumType> extends AgCartesianSeriesLabelFormatterParams {
    /** Datum from the series data array. */
    datum: DatumType;
}

export interface AgScatterSeriesLabelOptions<DatumType> extends AgChartLabelOptions {
    /** Function to modify the text displayed by the label. By default the values are simply stringified. */
    formatter?: (params: AgScatterSeriesLabelFormatterParams<DatumType>) => string;
}

export interface AgScatterSeriesThemeableOptions<DatumType = any> extends AgBaseSeriesThemeableOptions {
    /** Configuration for the markers used in the series.  */
    marker?: AgCartesianSeriesMarker<DatumType>;
    /** Configuration for the labels shown on top of data points.  */
    label?: AgScatterSeriesLabelOptions<DatumType>;
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not.  */
    title?: string;
    /** Series-specific tooltip configuration.  */
    tooltip?: AgSeriesTooltip<AgScatterSeriesTooltipRendererParams>;
}

/** Configuration for scatter/bubble series. */
export interface AgScatterSeriesOptions<DatumType = any>
    extends AgScatterSeriesThemeableOptions<DatumType>,
        AgBaseSeriesOptions<DatumType> {
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
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
    /** Configuration for the series error bars. */
    errorBar?: AgErrorBarOptions;
}
