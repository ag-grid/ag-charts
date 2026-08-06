import type {
    ContextCallbackParams,
    DatumCallbackParams,
    HighlightState,
    Listener,
    SelectionState,
    SeriesCallbackParams,
    Styler,
} from '../../chart/callbackOptions';
import type { AgChartLabelOrientation } from '../../chart/collisionAvoidanceOptions';
import type { AgNumericValue } from '../../chart/dataValues';
import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgNodeClickEvent } from '../../chart/eventOptions';
import type {
    AgChartLabelAutoFontSizeOptions,
    AgChartLabelCollisionFitOptions,
    AgChartLabelOptions,
    AgSeriesLabelPlacementStyleOptions,
} from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { ContextDefault, DatumDefault, DatumKey, PixelSize } from '../../chart/types';
import type {
    AgBaseCartesianThemeableOptions,
    AgBaseSeriesOptions,
    AgHighlightStyleOptions,
    AgMultiSeriesHighlightOptions,
} from '../seriesOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgBaseCartesianSeriesAxisOptions, FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

/**
 * The standard set of bin data exposed to every histogram callback (tooltip, label formatter,
 * node click/double-click, context menu and `getItemId`).
 */
export interface AgHistogramSeriesBinParams<TDatum = DatumDefault> {
    /** Always `undefined` for a bin, which aggregates many rows; use `datums` for the source rows. */
    readonly datum: undefined;
    /** Every source row grouped into the bin. */
    readonly datums: TDatum[];
    /** Zero-based positional index of the bin within the series. Defined for every bin, including empty ones. */
    readonly binIndex: number;
    /** The bin's start and end bounds on the x-axis. `bigint` values for a bigint `xKey` column. */
    readonly binRange: [AgNumericValue, AgNumericValue];
    /** The aggregated `yKey` value for the bin. A `bigint` when a bigint `yKey` column is summed (`aggregation: 'sum'`). */
    readonly aggregatedValue: AgNumericValue;
    /** The number of source rows within the bin. */
    readonly frequency: number;
}

export interface AgHistogramSeriesTooltipRendererParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        Omit<AgCartesianSeriesTooltipRendererParams<TDatum, TContext>, 'xKey' | 'yKey' | 'datum'>,
        AgHistogramSeriesBinParams<TDatum>,
        FillOptions,
        StrokeOptions {
    /** xKey as specified on series options. */
    readonly xKey: DatumKey<TDatum>;
    /** yKey as specified on series options. */
    readonly yKey?: DatumKey<TDatum>;
}

export interface AgHistogramSeriesLabelFormatterParams<TDatum = DatumDefault>
    extends AgHistogramSeriesOptionsKeys<TDatum>, AgHistogramSeriesOptionsNames, AgHistogramSeriesBinParams<TDatum> {
    /** The default label value that would have been used without a formatter. */
    readonly value: any;
}

export interface AgHistogramSeriesGetItemIdParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends ContextCallbackParams<TContext>, AgHistogramSeriesBinParams<TDatum> {}

export type AgHistogramSeriesLabelPlacement =
    | 'inside-center'
    | 'inside-start'
    | 'inside-end'
    | 'outside-start'
    | 'outside-end';

export interface AgHistogramSeriesLabelOptions<TDatum, TParams, TContext = ContextDefault>
    extends
        AgChartLabelOptions<TDatum, TParams, TContext>,
        AgChartLabelCollisionFitOptions,
        AgChartLabelAutoFontSizeOptions,
        AgSeriesLabelPlacementStyleOptions {
    /**
     * Where to render series labels relative to the bars. Either a single placement or an ordered
     * fallback list tried in turn until one fits.
     */
    placement?: AgHistogramSeriesLabelPlacement | AgHistogramSeriesLabelPlacement[];
    /** Distance between the bar edges and the text. */
    spacing?: PixelSize;
    /**
     * Orientation of the label within the bar. `horizontal` reads upright; the two `vertical`
     * variants rotate it a quarter-turn in opposite directions. Either a single orientation or an
     * ordered fallback list tried in turn until one fits.
     *
     * Default: `horizontal`
     */
    orientation?: AgChartLabelOrientation | AgChartLabelOrientation[];
}

export interface AgHistogramSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Apply rounded corners to each bar. */
    cornerRadius?: PixelSize;
}

export interface AgHistogramSeriesItemStylerParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        Omit<DatumCallbackParams<TDatum, HighlightState>, 'datum'>,
        ContextCallbackParams<TContext>,
        AgHistogramSeriesOptionsKeys<TDatum>,
        AgHistogramSeriesBinParams<TDatum>,
        Required<AgHistogramSeriesStyle> {}

export interface AgHistogramSeriesStylerParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        SeriesCallbackParams<HighlightState, SelectionState>,
        ContextCallbackParams<TContext>,
        AgHistogramSeriesOptionsKeys<TDatum>,
        Required<AgHistogramSeriesStyle> {}

export interface AgHistogramSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends Omit<AgBaseCartesianThemeableOptions<TDatum, TContext>, 'selection'>, AgHistogramSeriesStyle {
    /** A callback function for adjusting the styles of the whole series based on the highlight or selection state. */
    styler?: Styler<AgHistogramSeriesStylerParams<TDatum, TContext>, AgHistogramSeriesStyle>;
    /** A callback function for adjusting the styles of each bin individually, based on its range, frequency and aggregated value. */
    itemStyler?: Styler<AgHistogramSeriesItemStylerParams<TDatum, TContext>, AgHistogramSeriesStyle>;
    /** Configuration for the shadow used behind the chart series. */
    shadow?: AgDropShadowOptions;
    /** Configuration for the labels shown on bars. */
    label?: AgHistogramSeriesLabelOptions<undefined, AgHistogramSeriesLabelFormatterParams<TDatum>, TContext>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgHistogramSeriesTooltipRendererParams<TDatum, TContext>>;
    /** Configuration for highlighting when a series or legend item is hovered over. */
    highlight?: AgMultiSeriesHighlightOptions<AgHighlightStyleOptions, AgHighlightStyleOptions>;
    /**
     * If `true`, the aggregated `yKey` values will be represented using the area of the bar, instead of just the height.
     */
    areaPlot?: boolean;
    /** Set the bin sizes explicitly.
     *
     * __Note:__ `bins` is ignored if `binCount` is also supplied.
     */
    bins?: [number, number][];
    /** The number of bins to try to split the x-axis into.  */
    binCount?: number;
    /** Dictates how the `yKey` values are aggregated within each bin.
     *
     * Default: `sum`
     */
    aggregation?: 'count' | 'sum' | 'mean';
}

export interface AgHistogramSeriesOptionsKeys<TDatum = DatumDefault> {
    /** The key to use to retrieve x-values from the data. */
    xKey: DatumKey<TDatum>;
    /** The key to use to retrieve y-values from the data. */
    yKey?: DatumKey<TDatum>;
}

export interface AgHistogramSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
}

interface AgBaseHistogramClickEvent<TType extends string, TDatum, TContext>
    extends
        Omit<AgNodeClickEvent<TType, TDatum, TContext>, keyof AgHistogramSeriesBinParams<TDatum>>,
        AgHistogramSeriesBinParams<TDatum> {}

/** Node click/double-click event fired for a histogram bin. */
export interface AgHistogramSeriesNodeClickEvent<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgBaseHistogramClickEvent<'seriesNodeClick', TDatum, TContext> {}

export interface AgHistogramSeriesNodeDoubleClickEvent<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgBaseHistogramClickEvent<'seriesNodeDoubleClick', TDatum, TContext> {}

export interface AgHistogramSeriesListeners<TDatum = DatumDefault, TContext = ContextDefault> {
    /** The listener to call when a histogram bin is clicked. */
    seriesNodeClick?: Listener<AgHistogramSeriesNodeClickEvent<TDatum, TContext>>;
    /** The listener to call when a histogram bin is double-clicked. */
    seriesNodeDoubleClick?: Listener<AgHistogramSeriesNodeDoubleClickEvent<TDatum, TContext>>;
}

export interface AgHistogramSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        Omit<AgBaseSeriesOptions<TDatum, TContext>, 'highlight' | 'selection' | 'listeners'>,
        AgBaseCartesianSeriesAxisOptions,
        AgHistogramSeriesOptionsKeys<TDatum>,
        AgHistogramSeriesOptionsNames,
        Omit<AgHistogramSeriesThemeableOptions<TDatum, TContext>, 'listeners'> {
    /** Configuration for Histogram Series. */
    type: 'histogram';
    /** A map of event names to event listeners. */
    listeners?: AgHistogramSeriesListeners<TDatum, TContext>;
    /**
     * A callback to provide a stable identifier for each bin, exposed as `itemId` in events and active state.
     *
     * The returned identifier must be unique across all bins in the series.
     *
     * If not supplied, an identifier is generated from the bin boundaries.
     */
    getItemId?: (params: AgHistogramSeriesGetItemIdParams<TDatum, TContext>) => string;
}
