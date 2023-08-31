import type { AgChartLabelOptions } from '../../options/labelOptions';
import type { AgSeriesListeners } from '../../options/eventOptions';
import type {
    AgSeriesTooltip,
    AgSeriesTooltipRendererParams,
    AgTooltipRendererResult,
} from '../../options/tooltipOptions';
import type { CssColor, Opacity, PixelSize } from '../../options/types';
import type { AgBaseSeriesOptions } from '../seriesOptions';

/** Base configuration for Radial Column series. */
export interface AgBaseRadialColumnSeriesOptions<DatumType = any> extends AgBaseSeriesOptions<DatumType> {
    type?: 'radial-column' | 'nightingale';
    /** The key to use to retrieve angle values from the data. */
    angleKey?: string;
    /** A human-readable description of the angle values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    angleName?: string;
    /** The key to use to retrieve radius values from the data. */
    radiusKey?: string;
    /** A human-readable description of the radius values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    radiusName?: string;

    /** Whether to group together (adjacently) separate sectors. */
    grouped?: boolean;
    /** An option indicating if the sectors should be stacked. */
    stacked?: boolean;
    /** An ID to be used to group stacked items. */
    stackGroup?: string;

    /** The colour of the stroke for the lines. */
    stroke?: CssColor;
    /** The width in pixels of the stroke for the lines. */
    strokeWidth?: PixelSize;
    /** The opacity of the stroke for the lines. */
    strokeOpacity?: Opacity;
    /** Defines how the line stroke is rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: PixelSize;
    /** Configuration for the labels shown on top of data points. */
    label?: AgRadialColumnSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgRadialColumnSeriesTooltip;
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
    /** A formatter function for adjusting the styling of the radial columns. */
    formatter?: (params: AgRadialColumnSeriesFormatterParams<DatumType>) => AgRadialColumnSeriesFormat;
}

/** Configuration for Radial Column series. */
export interface AgRadialColumnSeriesOptions<DatumType = any> extends AgBaseRadialColumnSeriesOptions<DatumType> {
    type?: 'radial-column';
    /** The width of columns. If unset it will be calculated based on items count and the radius of the axis hole. */
    columnWidth?: PixelSize;
}

export interface AgRadialColumnSeriesTooltipRendererParams extends AgSeriesTooltipRendererParams {
    /** xKey as specified on series options. */
    readonly angleKey: string;
    /** xValue as read from series data via the xKey property. */
    readonly angleValue?: any;
    /** xName as specified on series options. */
    readonly angleName?: string;

    /** yKey as specified on series options. */
    readonly radiusKey: string;
    /** yValue as read from series data via the yKey property. */
    readonly radiusValue?: any;
    /** yName as specified on series options. */
    readonly radiusName?: string;
}

export interface AgRadialColumnSeriesLabelFormatterParams {
    /** The ID of the series. */
    readonly seriesId: string;
    /** The value of radiusKey as specified on series options. */
    readonly value: number;
}

export interface AgRadialColumnSeriesLabelOptions extends AgChartLabelOptions {
    /** Function used to turn 'yKey' values into text to be displayed by a label. By default the values are simply stringified. */
    formatter?: (params: AgRadialColumnSeriesLabelFormatterParams) => string;
}

export interface AgRadialColumnSeriesTooltip extends AgSeriesTooltip {
    /** Function used to create the content for tooltips. */
    renderer?: (params: AgRadialColumnSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
    format?: string;
}

export interface AgRadialColumnSeriesFormatterParams<DatumType> {
    readonly datum: DatumType;
    readonly fill?: CssColor;
    readonly stroke?: CssColor;
    readonly strokeWidth: PixelSize;
    readonly highlighted: boolean;
    readonly angleKey: string;
    readonly radiusKey: string;
    readonly seriesId: string;
}

export interface AgRadialColumnSeriesFormat {
    fill?: CssColor;
    fillOpacity?: Opacity;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
