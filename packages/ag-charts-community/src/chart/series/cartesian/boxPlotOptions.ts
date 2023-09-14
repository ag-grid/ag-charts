import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
import type {
    AgSeriesFormatterParams,
    AxisOptions,
    FillOptions,
    LineDashOptions,
    StrokeOptions,
} from './commonOptions';
import type { AgSeriesTooltip } from '../../options/tooltipOptions';
import type { Ratio } from '../../options/types';

interface BoxPlotUniqueOptions {
    // required
    minKey?: string;
    q1Key?: string;
    medianKey?: string;
    q3Key?: string;
    maxKey?: string;
    // optional
    minName?: string;
    q1Name?: string;
    medianName?: string;
    q3Name?: string;
    maxName?: string;
}

export interface AgBoxPlotCapOptions {
    lengthRatio?: Ratio;
}

export type AgBoxPlotWhiskerOptions = StrokeOptions & LineDashOptions;

export type AgBoxPlotSeriesFormatterParams<DatumType> = AgSeriesFormatterParams<DatumType> &
    Readonly<BoxPlotUniqueOptions & Omit<AxisOptions, 'yKey'> & FillOptions & StrokeOptions>;

export interface AgBoxPlotSeriesStyles extends FillOptions, StrokeOptions, LineDashOptions {
    /** Options to style chart's caps **/
    cap?: AgBoxPlotCapOptions;
    /** Options to style chart's whiskers **/
    whisker?: AgBoxPlotWhiskerOptions;
}

export interface AgBoxPlotSeriesThemeableOptions<DatumType = any>
    extends AgBaseSeriesThemeableOptions,
        AgBoxPlotSeriesStyles {
    /** Bar rendering direction.
     * <br/>
     * **NOTE**: This option affects the layout direction of X and Y data values.
     */
    direction?: 'horizontal' | 'vertical';
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgCartesianSeriesTooltipRendererParams>;
    /** Function used to return formatting for individual columns, based on the given parameters. If the current column is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgBoxPlotSeriesFormatterParams<DatumType>) => AgBoxPlotSeriesStyles;
}

export interface AgBoxPlotSeriesOptions<DatumType = any>
    extends AgBoxPlotSeriesThemeableOptions<DatumType>,
        AgBaseSeriesOptions<DatumType>,
        BoxPlotUniqueOptions,
        Omit<AxisOptions, 'yKey'> {
    type: 'box-plot';
    /** Whether to group together (adjacently) separate columns. */
    grouped?: boolean;
    /** Human-readable description of the y-values. If supplied, matching items with the same value will be toggled together. */
    legendItemName?: string;
}
