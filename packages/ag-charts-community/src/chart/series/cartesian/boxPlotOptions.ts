import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgBaseSeriesOptions } from '../seriesOptions';
import type {
    AgSeriesFormatterParams,
    AxisOptions,
    FillOptions,
    LineDashOptions,
    StrokeOptions,
} from './commonOptions';
import type { AgSeriesTooltip } from '../../options/tooltipOptions';
import type { Ratio } from '../../options/types';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';

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

export interface BoxPlotNodeDatum
    extends Omit<CartesianSeriesNodeDatum, 'yKey'>,
        Readonly<Required<FillOptions>>,
        Readonly<Required<StrokeOptions>>,
        Readonly<Required<LineDashOptions>> {
    readonly xValue: number;
    readonly minValue: number;
    readonly q1Value: number;
    readonly medianValue: number;
    readonly q3Value: number;
    readonly maxValue: number;
    readonly bandwidth: number;

    readonly cap: {
        lengthRatio: Ratio;
    };
    readonly whisker: Readonly<Required<StrokeOptions>> & Readonly<Required<LineDashOptions>>;
}

export type AgBoxPlotSeriesFormatterParams<DatumType> = AgSeriesFormatterParams<DatumType> &
    Readonly<BoxPlotUniqueOptions> &
    Readonly<Omit<AxisOptions, 'yKey'>> &
    Readonly<FillOptions> &
    Readonly<StrokeOptions>;

export type AgBoxPlotSeriesFormat = FillOptions & StrokeOptions;

export interface AgBoxPlotSeriesOptions<DatumType = BoxPlotNodeDatum>
    extends AgBaseSeriesOptions<DatumType>,
        BoxPlotUniqueOptions,
        Omit<AxisOptions, 'yKey'>,
        FillOptions,
        StrokeOptions,
        LineDashOptions {
    type?: 'box-plot';

    /** Options to style chart's caps **/
    cap?: AgBoxPlotCapOptions;
    /** Options to style chart's whiskers **/
    whisker?: AgBoxPlotWhiskerOptions;

    /** Whether to group together (adjacently) separate columns. */
    grouped?: boolean;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgCartesianSeriesTooltipRendererParams>;
    /** Function used to return formatting for individual columns, based on the given parameters. If the current column is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgBoxPlotSeriesFormatterParams<DatumType>) => AgBoxPlotSeriesFormat;
}
