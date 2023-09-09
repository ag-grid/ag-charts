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
}

export interface AgBoxPlotCapOptions {
    lengthRatio?: Ratio;
}

export type AgBoxPlotWhiskerOptions = StrokeOptions & LineDashOptions;

export type AgBoxPlotSeriesFormatterParams<DatumType> = AgSeriesFormatterParams<DatumType> &
    Readonly<BoxPlotUniqueOptions> &
    Readonly<Omit<AxisOptions, 'yKey'>> &
    Readonly<FillOptions> &
    Readonly<StrokeOptions>;

export type AgBoxPlotSeriesFormat = FillOptions & StrokeOptions;

export interface AgBoxPlotSeriesThemeableOptions<DatumType = any>
    extends AgBaseSeriesThemeableOptions,
        FillOptions,
        StrokeOptions,
        LineDashOptions {
    /** Bar rendering direction.
     * <br/>
     * **NOTE**: This option affects the layout direction of X and Y data values.
     */
    direction?: 'horizontal' | 'vertical';
    /** Options to style chart's caps **/
    cap?: AgBoxPlotCapOptions;
    /** Options to style chart's whiskers **/
    whisker?: AgBoxPlotWhiskerOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgCartesianSeriesTooltipRendererParams>;
    /** Function used to return formatting for individual columns, based on the given parameters. If the current column is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgBoxPlotSeriesFormatterParams<DatumType>) => AgBoxPlotSeriesFormat;
}

export interface AgBoxPlotSeriesOptions<DatumType = any>
    extends AgBoxPlotSeriesThemeableOptions<DatumType>,
        AgBaseSeriesOptions<DatumType>,
        BoxPlotUniqueOptions,
        Omit<AxisOptions, 'yKey'> {
    type: 'box-plot';

    /** Whether to group together (adjacently) separate columns. */
    grouped?: boolean;
}
