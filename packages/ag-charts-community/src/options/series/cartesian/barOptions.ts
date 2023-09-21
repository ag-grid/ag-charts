import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgSeriesListeners } from '../../chart/eventOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor, PixelSize } from '../../chart/types';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgCartesianSeriesLabelOptions } from './cartesianLabelOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

export type AgBarSeriesLabelPlacement = 'inside' | 'outside';

export interface AgBarSeriesLabelOptions extends AgCartesianSeriesLabelOptions {
    /** Where to render series labels relative to the segments. */
    placement?: AgBarSeriesLabelPlacement;
}

export interface AgBarSeriesFormatterParams<DatumType> {
    readonly datum: DatumType;
    readonly fill?: CssColor;
    readonly stroke?: CssColor;
    readonly strokeWidth: PixelSize;
    readonly highlighted: boolean;
    readonly xKey: string;
    readonly yKey: string;
    readonly seriesId: string;
    readonly stackGroup?: string;
}

export interface AgBarSeriesFormat {
    fill?: CssColor;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
}

export interface AgBarSeriesTooltipRendererParams extends AgCartesianSeriesTooltipRendererParams {
    readonly stackGroup?: string;
}

export interface AgBarSeriesThemeableOptions<DatumType = any>
    extends FillOptions,
        StrokeOptions,
        LineDashOptions,
        AgBaseSeriesThemeableOptions {
    /** Bar rendering direction. NOTE: This option affects the layout direction of X and Y data values. */
    direction?: 'horizontal' | 'vertical';
    /** Configuration for the shadow used behind the chart series. */
    shadow?: AgDropShadowOptions;
    /** Configuration for the labels shown on bars. */
    label?: AgBarSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgBarSeriesTooltipRendererParams>;
    /** Function used to return formatting for individual bars, based on the given parameters. If the current bar is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgBarSeriesFormatterParams<DatumType>) => AgBarSeriesFormat;
}

/** Configuration for bar series. */
export interface AgBarSeriesOptions<DatumType = any>
    extends AgBarSeriesThemeableOptions<DatumType>,
        AgBaseSeriesOptions<DatumType> {
    type: 'bar';
    /** Whether to group together (adjacently) separate bars. */
    grouped?: boolean;
    /** An option indicating if the bars should be stacked. */
    stacked?: boolean;
    /** An ID to be used to group stacked items. */
    stackGroup?: string;
    /** The number to normalise the bar stacks to. Has no effect when `grouped` is `true`. For example, if `normalizedTo` is set to `100`, the bar stacks will all be scaled proportionally so that each of their totals is 100. */
    normalizedTo?: number;
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** The key to use to retrieve y-values from the data. */
    yKey: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** Human-readable description of the y-values. If supplied, a corresponding `yName` will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** Human-readable description of the y-values. If supplied, matching items with the same value will be toggled together. */
    legendItemName?: string;
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
}
