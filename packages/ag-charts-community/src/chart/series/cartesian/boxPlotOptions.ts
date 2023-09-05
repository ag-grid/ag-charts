import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgSeriesListeners } from '../../options/eventOptions';
import type { AgBaseSeriesOptions } from '../seriesOptions';
import type { AxisOptions, FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';
import type { AgSeriesTooltip } from '../../options/tooltipOptions';

export interface AgBoxPlotSeriesOptions<DatumType = any>
    extends AgBaseSeriesOptions<DatumType>,
        AxisOptions,
        FillOptions,
        StrokeOptions,
        LineDashOptions {
    type?: 'box-plot';
    /** Whether to group together (adjacently) separate columns. */
    grouped?: boolean;
    /** An option indicating if the columns should be stacked. */
    stacked?: boolean;
    /** An ID to be used to group stacked items. */
    stackGroup?: string;
    /** The number to normalise the column stacks to. Has no effect when `grouped` is `true`. For example, if `normalizedTo` is set to `100`, the column stacks will all be scaled proportionally so that each of their totals is 100. */
    normalizedTo?: number;
    /** Human-readable description of the y-values. If supplied, matching items with the same value will be toggled together. */
    legendItemName?: string;

    minKey?: string;
    minName?: string;
    q1Key?: string;
    q1Name?: string;
    medianKey?: string;
    medianName?: string;
    q3Key?: string;
    q3Name?: string;
    maxKey?: string;
    maxName?: string;

    /** Configuration for the labels shown on columns. */
    // label?: AgColumnSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgCartesianSeriesTooltipRendererParams>;
    /** Function used to return formatting for individual columns, based on the given parameters. If the current column is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    // formatter?: (params: AgColumnSeriesFormatterParams<DatumType>) => AgColumnSeriesFormat;

    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
}
