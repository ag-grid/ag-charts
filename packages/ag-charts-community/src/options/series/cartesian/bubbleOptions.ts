import type { AgSeriesListeners } from '../../options/eventOptions';
import type { AgChartLabelOptions } from '../../options/labelOptions';
import type { AgSeriesTooltip } from '../../options/tooltipOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgCartesianSeriesMarker } from './cartesianSeriesMarkerOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgCartesianSeriesLabelFormatterParams } from './cartesianLabelOptions';
import type { PixelSize } from '../../options/types';

export interface AgBubbleSeriesTooltipRendererParams extends AgCartesianSeriesTooltipRendererParams {
    /** sizeKey as specified on series options. */
    readonly sizeKey?: string;
    /** sizeName as specified on series options. */
    readonly sizeName?: string;

    /** labelKey as specified on series options. */
    readonly labelKey?: string;
    /** labelName as specified on series options. */
    readonly labelName?: string;
}

export interface AgBubbleSeriesLabelFormatterParams<DatumType> extends AgCartesianSeriesLabelFormatterParams {
    /** Datum from the series data array. */
    datum: DatumType;
}

export interface AgBubbleSeriesLabelOptions<DatumType> extends AgChartLabelOptions {
    /** Function to modify the text displayed by the label. By default the values are simply stringified. */
    formatter?: (params: AgBubbleSeriesLabelFormatterParams<DatumType>) => string;
}

export interface AgBubbleSeriesMarker<DatumType> extends AgCartesianSeriesMarker<DatumType> {
    /** Determines the largest size a marker can be in pixels. */
    maxSize?: PixelSize;
    /** Explicitly specifies the extent of the domain for series sizeKey. */
    domain?: [number, number];
}

export interface AgBubbleSeriesThemeableOptions<DatumType = any> extends AgBaseSeriesThemeableOptions {
    /** Configuration for the markers used in the series.  */
    marker?: AgBubbleSeriesMarker<DatumType>;
    /** Configuration for the labels shown on top of data points.  */
    label?: AgBubbleSeriesLabelOptions<DatumType>;
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not.  */
    title?: string;
    /** Series-specific tooltip configuration.  */
    tooltip?: AgSeriesTooltip<AgBubbleSeriesTooltipRendererParams>;
}

/** Configuration for Bubble/bubble series. */
export interface AgBubbleSeriesOptions<DatumType = any>
    extends AgBubbleSeriesThemeableOptions<DatumType>,
        AgBaseSeriesOptions<DatumType> {
    /** Configuration for the Bubble series.  */
    type: 'bubble';
    /** The key to use to retrieve x-values from the data.  */
    xKey: string;
    /** The key to use to retrieve y-values from the data.  */
    yKey: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    yName?: string;
    /** The key to use to retrieve size values from the data, used to control the size of the markers.  */
    sizeKey: string;
    /** A human-readable description of the size values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    sizeName?: string;
    /** The key to use to retrieve values from the data to use as labels for the markers.  */
    labelKey?: string;
    /** A human-readable description of the label values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    labelName?: string;
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
}
