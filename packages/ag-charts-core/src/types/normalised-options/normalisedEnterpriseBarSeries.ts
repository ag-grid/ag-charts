import type {
    AgBoxPlotCapOptions,
    AgBoxPlotSeriesItemStylerParams,
    AgBoxPlotSeriesOptions,
    AgBoxPlotSeriesStyle,
    AgBoxPlotSeriesStylerParams,
    AgBoxPlotWhiskerOptions,
    AgCandlestickSeriesItemOptions,
    AgCandlestickSeriesItemStylerParams,
    AgCandlestickSeriesOptions,
    AgCandlestickSeriesTooltipRendererParams,
    AgCandlestickWickOptions,
    AgConeFunnelSeriesLabelFormatterParams,
    AgConeFunnelSeriesLabelPlacement,
    AgConeFunnelSeriesLabelPlacementAlias,
    AgConeFunnelSeriesOptions,
    AgConeFunnelSeriesTooltipRendererParams,
    AgFunnelSeriesDropOff,
    AgFunnelSeriesItemStylerParams,
    AgFunnelSeriesLabelFormatterParams,
    AgFunnelSeriesLabelPlacement,
    AgFunnelSeriesOptions,
    AgFunnelSeriesStyle,
    AgFunnelSeriesTooltipRendererParams,
    AgOhlcSeriesItemOptions,
    AgOhlcSeriesItemStylerParams,
    AgOhlcSeriesOptions,
    AgOhlcSeriesTooltipRendererParams,
    AgRangeBarSeriesItemStylerParams,
    AgRangeBarSeriesLabelFormatterParams,
    AgRangeBarSeriesLabelPlacement,
    AgRangeBarSeriesOptions,
    AgRangeBarSeriesStyle,
    AgRangeBarSeriesStylerParams,
    AgSeriesTooltip,
    AgWaterfallSeriesItemOptions,
    AgWaterfallSeriesItemStylerParams,
    AgWaterfallSeriesLabelFormatterParams,
    AgWaterfallSeriesLabelPlacement,
    AgWaterfallSeriesLineOptions,
    AgWaterfallSeriesOptions,
    AgWaterfallSeriesStyle,
    CssColor,
    Styler,
} from 'ag-charts-types';

import type { BivariantCallback, Normalised } from './normalise';
import type {
    NormalisedBarSeriesLabelOptions,
    NormalisedCartesianSeriesOptionsCommon,
    NormalisedSeriesSegmentation,
} from './normalisedCartesianSeries';
import type { NormalisedColorType, NormalisedDropShadowOptions } from './normalisedCommonOptions';
import type { NormalisedChartLabelPlacementStyleOptions, NormalisedSeriesLabelOptions } from './normalisedLabelOptions';
import type { NormalisedSeriesOptions } from './normalisedSeriesOptions';

type BarStyleRequiredKeys =
    | 'fill'
    | 'fillOpacity'
    | 'stroke'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'lineDash'
    | 'lineDashOffset'
    | 'cornerRadius';

/** Range bar options the series owns, before the common series keys are layered on. */
export type NormalisedRangeBarSeriesOwnOptions = Normalised<
    AgRangeBarSeriesOptions,
    'xKey' | 'yLowKey' | 'yHighKey' | 'direction' | BarStyleRequiredKeys | 'label' | 'segmentation',
    {
        fill: NormalisedColorType;
        stroke: CssColor;
        shadow?: NormalisedDropShadowOptions;
        label: NormalisedBarSeriesLabelOptions<AgRangeBarSeriesLabelFormatterParams, AgRangeBarSeriesLabelPlacement>;
        styler?: Styler<AgRangeBarSeriesStylerParams<unknown, unknown>, AgRangeBarSeriesStyle>;
        itemStyler?: Styler<AgRangeBarSeriesItemStylerParams<unknown>, AgRangeBarSeriesStyle>;
        segmentation: NormalisedSeriesSegmentation;
    }
>;

export type NormalisedRangeBarSeriesOptions = NormalisedSeriesOptions<NormalisedRangeBarSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;

/** One waterfall item type (positive, negative or total) after the theme resolves its style and label. */
export type NormalisedWaterfallSeriesItemOptions = Normalised<
    AgWaterfallSeriesItemOptions<unknown, unknown>,
    BarStyleRequiredKeys | 'label',
    {
        fill: NormalisedColorType;
        stroke: CssColor;
        shadow?: NormalisedDropShadowOptions;
        label: NormalisedBarSeriesLabelOptions<AgWaterfallSeriesLabelFormatterParams, AgWaterfallSeriesLabelPlacement>;
        itemStyler?: Styler<AgWaterfallSeriesItemStylerParams<unknown>, AgWaterfallSeriesStyle>;
    }
>;

export type NormalisedWaterfallSeriesLineOptions = Normalised<
    AgWaterfallSeriesLineOptions,
    'enabled' | 'stroke' | 'strokeWidth' | 'strokeOpacity' | 'lineDash' | 'lineDashOffset',
    { stroke: CssColor }
>;

/** Waterfall options the series owns, before the common series keys are layered on. */
export type NormalisedWaterfallSeriesOwnOptions = Normalised<
    AgWaterfallSeriesOptions,
    'xKey' | 'yKey' | 'direction' | 'item' | 'line',
    {
        item: {
            positive: NormalisedWaterfallSeriesItemOptions;
            negative: NormalisedWaterfallSeriesItemOptions;
            total: NormalisedWaterfallSeriesItemOptions;
        };
        line: NormalisedWaterfallSeriesLineOptions;
    }
>;

export type NormalisedWaterfallSeriesOptions = NormalisedSeriesOptions<NormalisedWaterfallSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;

/** Whisker overrides; each absent key falls back to the box stroke at render time. */
export type NormalisedBoxPlotWhiskerOptions = Normalised<AgBoxPlotWhiskerOptions, never, { stroke?: CssColor }>;

/** Box plot options the series owns, before the common series keys are layered on. */
export type NormalisedBoxPlotSeriesOwnOptions = Normalised<
    AgBoxPlotSeriesOptions,
    | 'xKey'
    | 'minKey'
    | 'q1Key'
    | 'medianKey'
    | 'q3Key'
    | 'maxKey'
    | 'direction'
    | BarStyleRequiredKeys
    | 'cap'
    | 'segmentation',
    {
        fill: NormalisedColorType;
        stroke: CssColor;
        cap: Required<AgBoxPlotCapOptions>;
        whisker?: NormalisedBoxPlotWhiskerOptions;
        styler?: Styler<AgBoxPlotSeriesStylerParams<unknown, unknown>, AgBoxPlotSeriesStyle>;
        itemStyler?: Styler<AgBoxPlotSeriesItemStylerParams<unknown>, AgBoxPlotSeriesStyle>;
        segmentation: NormalisedSeriesSegmentation;
    }
>;

export type NormalisedBoxPlotSeriesOptions = NormalisedSeriesOptions<NormalisedBoxPlotSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;

type StrokeStyleRequiredKeys = 'stroke' | 'strokeWidth' | 'strokeOpacity' | 'lineDash' | 'lineDashOffset';

/** One OHLC item type (up or down) after the theme resolves its stroke. */
export type NormalisedOhlcSeriesItemOptions = Normalised<
    AgOhlcSeriesItemOptions,
    StrokeStyleRequiredKeys,
    { stroke: CssColor }
>;

/** Wick overrides; each absent key falls back to the candle body stroke at render time. */
export type NormalisedCandlestickWickOptions = Normalised<AgCandlestickWickOptions, never, { stroke?: CssColor }>;

/** One candlestick item type (up or down) after the theme resolves its fill and stroke. */
export type NormalisedCandlestickSeriesItemOptions = Normalised<
    AgCandlestickSeriesItemOptions,
    BarStyleRequiredKeys,
    { fill: NormalisedColorType; stroke: CssColor; wick?: NormalisedCandlestickWickOptions }
>;

/**
 * The shape the shared OHLC implementation reads: both leaves carry the five value keys and an up/down item
 * pair, candlestick adding fill and wick styling to each item.
 */
export type NormalisedOhlcSeriesBaseOwnOptions = Omit<
    NormalisedOhlcSeriesOwnOptions,
    'type' | 'item' | 'itemStyler' | 'tooltip' | 'highlight'
> & {
    type: 'ohlc' | 'candlestick';
    item: Record<'up' | 'down', NormalisedOhlcSeriesItemOptions & Partial<NormalisedCandlestickSeriesItemOptions>>;
    tooltip?: AgSeriesTooltip<AgOhlcSeriesTooltipRendererParams<any> & AgCandlestickSeriesTooltipRendererParams<any>>;
    itemStyler?: BivariantCallback<
        AgOhlcSeriesItemStylerParams<unknown> | AgCandlestickSeriesItemStylerParams<unknown>,
        AgOhlcSeriesItemOptions | AgCandlestickSeriesItemOptions | undefined
    >;
};

/** OHLC options the series owns, before the common series keys are layered on. */
export type NormalisedOhlcSeriesOwnOptions = Normalised<
    AgOhlcSeriesOptions,
    'item',
    {
        item: Record<'up' | 'down', NormalisedOhlcSeriesItemOptions>;
        itemStyler?: Styler<AgOhlcSeriesItemStylerParams<unknown>, AgOhlcSeriesItemOptions>;
    }
>;

export type NormalisedOhlcSeriesOptions = NormalisedSeriesOptions<NormalisedOhlcSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;

/** Candlestick options the series owns, before the common series keys are layered on. */
export type NormalisedCandlestickSeriesOwnOptions = Normalised<
    AgCandlestickSeriesOptions,
    'item',
    {
        item: Record<'up' | 'down', NormalisedCandlestickSeriesItemOptions>;
        itemStyler?: Styler<AgCandlestickSeriesItemStylerParams<unknown>, AgCandlestickSeriesItemOptions>;
    }
>;

export type NormalisedCandlestickSeriesOptions = NormalisedSeriesOptions<NormalisedCandlestickSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;

type FunnelStyleRequiredKeys =
    'fills' | 'strokes' | 'fillOpacity' | 'strokeWidth' | 'strokeOpacity' | 'lineDash' | 'lineDashOffset';

/** Label shape the shared funnel implementation reads; only the funnel leaf exposes placement styles. */
export type NormalisedBaseFunnelSeriesLabelOptions =
    NormalisedSeriesLabelOptions<AgFunnelSeriesLabelFormatterParams> & {
        placement?: string | string[];
        spacing: number;
        insideStyle?: NormalisedChartLabelPlacementStyleOptions;
        outsideStyle?: NormalisedChartLabelPlacementStyleOptions;
    };

/**
 * The shape the shared funnel implementation reads: the stage/value keys, cycled fills and strokes, the bar
 * direction and a value label; the leaves add their own drop-off, spacing and label placement vocabulary.
 */
export type NormalisedBaseFunnelSeriesOwnOptions = Omit<
    NormalisedFunnelSeriesOwnOptions,
    'type' | 'label' | 'itemStyler' | 'tooltip' | 'highlight' | 'spacingRatio' | 'cornerRadius' | 'dropOff' | 'shadow'
> & {
    type: 'funnel' | 'cone-funnel';
    label: NormalisedBaseFunnelSeriesLabelOptions;
    tooltip?: AgSeriesTooltip<
        AgFunnelSeriesTooltipRendererParams<unknown> & AgConeFunnelSeriesTooltipRendererParams<unknown>
    >;
    itemStyler?: Styler<AgFunnelSeriesItemStylerParams<unknown>, AgFunnelSeriesStyle>;
};

/** Drop-off connector between adjacent funnel bars; `fill`/`stroke` fall back to the bar's own at render time. */
export type NormalisedFunnelSeriesDropOffOptions = Normalised<
    AgFunnelSeriesDropOff,
    'enabled' | 'fillOpacity' | 'strokeWidth' | 'strokeOpacity' | 'lineDash' | 'lineDashOffset',
    { fill?: NormalisedColorType; stroke?: CssColor }
>;

/** Funnel options the series owns, before the common series keys are layered on. */
export type NormalisedFunnelSeriesOwnOptions = Normalised<
    AgFunnelSeriesOptions,
    FunnelStyleRequiredKeys | 'direction' | 'spacingRatio' | 'cornerRadius' | 'dropOff' | 'shadow' | 'label',
    {
        fills: NormalisedColorType[];
        strokes: CssColor[];
        dropOff: NormalisedFunnelSeriesDropOffOptions;
        shadow: NormalisedDropShadowOptions;
        label: NormalisedBarSeriesLabelOptions<AgFunnelSeriesLabelFormatterParams, AgFunnelSeriesLabelPlacement>;
        itemStyler?: Styler<AgFunnelSeriesItemStylerParams<unknown>, AgFunnelSeriesStyle>;
    }
>;

export type NormalisedFunnelSeriesOptions = NormalisedSeriesOptions<NormalisedFunnelSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;

type ConeFunnelLabelPlacement = AgConeFunnelSeriesLabelPlacement | AgConeFunnelSeriesLabelPlacementAlias;

/** Cone funnel options the series owns, before the common series keys are layered on. */
export type NormalisedConeFunnelSeriesOwnOptions = Normalised<
    AgConeFunnelSeriesOptions,
    FunnelStyleRequiredKeys | 'direction' | 'label',
    {
        fills: NormalisedColorType[];
        strokes: CssColor[];
        label: NormalisedSeriesLabelOptions<AgConeFunnelSeriesLabelFormatterParams> & {
            placement?: ConeFunnelLabelPlacement | ConeFunnelLabelPlacement[];
            spacing: number;
        };
    }
>;

export type NormalisedConeFunnelSeriesOptions = NormalisedSeriesOptions<NormalisedConeFunnelSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;
