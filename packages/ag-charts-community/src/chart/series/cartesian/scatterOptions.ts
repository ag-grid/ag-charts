import type { AgSeriesListeners } from '../../options/eventOptions';
import type { AgChartLabelOptions } from '../../options/labelOptions';
import type { AgSeriesTooltip } from '../../options/tooltipOptions';
import type { AgBaseSeriesOptions } from '../seriesOptions';
import type { AgCartesianSeriesMarker } from './cartesianSeriesMarkerOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgCartesianSeriesLabelFormatterParams } from './cartesianLabelOptions';

export interface AgScatterSeriesTooltipRendererParams extends AgCartesianSeriesTooltipRendererParams {
    /** sizeKey as specified on series options. */
    readonly sizeKey?: string;
    /** sizeName as specified on series options. */
    readonly sizeName?: string;

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

export interface AgScatterSeriesMarker<DatumType> extends AgCartesianSeriesMarker<DatumType> {
    /** If sizeKey is used, explicitly specifies the extent of the domain of it's values. */
    domain?: [number, number];
}

/** Configuration for scatter/bubble series. */
export interface AgScatterSeriesOptions<DatumType = any> extends AgBaseSeriesOptions<DatumType> {
    /** Configuration for the scatter series.  */
    type?: 'scatter';
    /** Configuration for the markers used in the series.  */
    marker?: AgScatterSeriesMarker<DatumType>;
    /** Configuration for the labels shown on top of data points.  */
    label?: AgScatterSeriesLabelOptions<DatumType>;
    /** The key to use to retrieve x-values from the data.  */
    xKey?: string;
    /** The key to use to retrieve y-values from the data.  */
    yKey?: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    yName?: string;
    /** The key to use to retrieve size values from the data, used to control the size of the markers in bubble charts.  */
    sizeKey?: string;
    /** A human-readable description of the size values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    sizeName?: string;
    /** The key to use to retrieve values from the data to use as labels for the markers.  */
    labelKey?: string;
    /** A human-readable description of the label values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    labelName?: string;
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not.  */
    title?: string;
    /** Series-specific tooltip configuration.  */
    tooltip?: AgSeriesTooltip<AgScatterSeriesTooltipRendererParams>;
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
}
