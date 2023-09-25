import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgSeriesListeners } from '../../chart/eventOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor, Opacity, PixelSize } from '../../chart/types';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgCartesianSeriesLabelOptions } from './cartesianLabelOptions';

export interface AgHistogramSeriesLabelOptions extends AgCartesianSeriesLabelOptions {}

export interface AgHistogramSeriesTooltipRendererParams extends AgCartesianSeriesTooltipRendererParams {
    datum: AgHistogramBinDatum<any>;
}

export interface AgHistogramBinDatum<DatumType> {
    data: DatumType[];
    aggregatedValue: number;
    frequency: number;
    domain: [number, number];
}

export interface AgHistogramSeriesThemeableOptions<_DatumType = any> extends AgBaseSeriesThemeableOptions {
    /** The colour of the fill for the histogram bars. */
    fill?: CssColor;
    /** The colour of the stroke for the histogram bars. */
    stroke?: CssColor;
    /** The opacity of the fill for the histogram bars. */
    fillOpacity?: Opacity;
    /** The opacity of the stroke for the histogram bars. */
    strokeOpacity?: Opacity;
    /** The width in pixels of the stroke for the histogram bars. */
    strokeWidth?: PixelSize;
    /** Defines how the column strokes are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: PixelSize;
    /** Configuration for the shadow used behind the chart series. */
    shadow?: AgDropShadowOptions;
    /** Configuration for the labels shown on bars. */
    label?: AgHistogramSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgHistogramSeriesTooltipRendererParams>;
}

/** Configuration for histogram series. */
export interface AgHistogramSeriesOptions<DatumType = any>
    extends AgHistogramSeriesThemeableOptions<DatumType>,
        AgBaseSeriesOptions<DatumType> {
    type: 'histogram';
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** The key to use to retrieve y-values from the data. */
    yKey?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** For variable width bins, if true the histogram will represent the aggregated `yKey` values using the area of the bar. Otherwise, the height of the var represents the value as per a normal bar chart. This is useful for keeping an undistorted curve displayed when using variable-width bins. */
    areaPlot?: boolean;
    /** Set the bins explicitly. The bins need not be of equal width. Note that `bins` is ignored if `binCount` is also supplied. */
    bins?: [number, number][];
    /** The number of bins to try to split the x axis into. Clashes with the `bins` setting. */
    binCount?: number;
    /** Dictates how the bins are aggregated. If set to 'sum', the value shown for the bins will be the total of the yKey values. If set to 'mean', it will display the average yKey value of the bin. */
    aggregation?: 'count' | 'sum' | 'mean';
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
}
