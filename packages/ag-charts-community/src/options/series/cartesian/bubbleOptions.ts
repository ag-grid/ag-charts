import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { PixelSize } from '../../chart/types';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgCartesianSeriesMarker } from './cartesianSeriesMarkerOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';

export interface AgBubbleSeriesTooltipRendererParams extends AgCartesianSeriesTooltipRendererParams {
    /** sizeKey as specified on series options. */
    readonly sizeKey: string;
    /** sizeName as specified on series options. */
    readonly sizeName?: string;

    /** labelKey as specified on series options. */
    readonly labelKey?: string;
    /** labelName as specified on series options. */
    readonly labelName?: string;
}

export interface AgBubbleSeriesMarker<TDatum> extends AgCartesianSeriesMarker<TDatum> {
    /** Determines the largest size a marker can be in pixels. */
    maxSize?: PixelSize;
    /** Explicitly specifies the extent of the domain for series sizeKey. */
    domain?: [number, number];
}

export interface AgBubbleSeriesThemeableOptions<TDatum = any> extends AgBaseSeriesThemeableOptions {
    /** Configuration for the markers used in the series.  */
    marker?: AgBubbleSeriesMarker<TDatum>;
    /** Configuration for the labels shown on top of data points.  */
    label?: AgChartLabelOptions;
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not.  */
    title?: string;
    /** Series-specific tooltip configuration.  */
    tooltip?: AgSeriesTooltip<AgBubbleSeriesTooltipRendererParams>;
}

/** Configuration for Bubble/bubble series. */
export interface AgBubbleSeriesOptions<TDatum = any>
    extends AgBubbleSeriesThemeableOptions<TDatum>,
        AgBaseSeriesOptions<TDatum> {
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
}
