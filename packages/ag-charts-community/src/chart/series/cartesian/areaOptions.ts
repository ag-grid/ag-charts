import type { AgDropShadowOptions } from '../../options/chartOptions';
import type { AgSeriesTooltip } from '../../options/tooltipOptions';
import type { CssColor, Opacity, PixelSize } from '../../options/types';
import type { AgBaseSeriesOptions } from '../seriesOptions';
import type {
    AgCartesianSeriesLabelOptions,
    AgCartesianSeriesMarker,
    AgCartesianSeriesTooltipRendererParams,
} from './cartesianOptions';

export interface AgAreaSeriesMarker<DatumType> extends AgCartesianSeriesMarker<DatumType> {}

/** Configuration for area series. */
export interface AgAreaSeriesOptions<DatumType = any> extends AgBaseSeriesOptions<DatumType> {
    type?: 'area';
    /** Configuration for the markers used in the series. */
    marker?: AgAreaSeriesMarker<DatumType>;
    /** The number to normalise the area stacks to. For example, if `normalizedTo` is set to `100`, the stacks will all be scaled proportionally so that their total height is always 100. */
    normalizedTo?: number;
    /** The key to use to retrieve x-values from the data. */
    xKey?: string;
    /** The key to use to retrieve y-values from the data. */
    yKey?: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** The colour to use for the fill of the area. */
    fill?: CssColor;
    /** The colours to use for the stroke of the areas. */
    stroke?: CssColor;
    /** The width in pixels of the stroke for the areas. */
    strokeWidth?: PixelSize;
    /** The opacity of the fill for the area. */
    fillOpacity?: Opacity;
    /** The opacity of the stroke for the areas. */
    strokeOpacity?: Opacity;
    /** Defines how the area strokes are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: PixelSize;
    /** Configuration for the shadow used behind the chart series. */
    shadow?: AgDropShadowOptions;
    /** Configuration for the labels shown on top of data points. */
    label?: AgCartesianSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgCartesianSeriesTooltipRendererParams>;
    /** An option indicating if the areas should be stacked. */
    stacked?: boolean;
    /** An ID to be used to group stacked items. */
    stackGroup?: string;
}
