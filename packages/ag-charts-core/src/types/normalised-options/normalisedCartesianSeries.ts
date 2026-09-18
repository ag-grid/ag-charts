import type {
    AgAreaSeriesLabelFormatterParams,
    AgAreaSeriesMarkerItemStylerParams,
    AgAreaSeriesOptions,
    AgAreaSeriesStylerParams,
    AgAreaSeriesStylerResult,
    AgBarSeriesStyle,
    AgHistogramSeriesStyle,
    AgLineSeriesLabelFormatterParams,
    AgLineSeriesMarkerItemStylerParams,
    AgLineSeriesOptions,
    AgLineSeriesStylerParams,
    AgLineSeriesStylerResult,
    AgSeriesSegmentation,
    AgSeriesShapeSegmentOptions,
    CssColor,
    Styler,
} from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { FillStrokeMorph, NormalisedColorType, NormalisedDropShadowOptions } from './normalisedCommonOptions';
import type { NormalisedPlacedSeriesLabelOptions } from './normalisedLabelOptions';
import type { NormalisedSeriesMarkerOptions, NormalisedSeriesMarkerStyle } from './normalisedSeriesMarkerOptions';
import type { NormalisedSeriesOptions } from './normalisedSeriesOptions';

export type NormalisedBarSeriesStyle = Normalised<AgBarSeriesStyle, never, FillStrokeMorph>;

export type NormalisedHistogramSeriesStyle = Normalised<AgHistogramSeriesStyle, never, FillStrokeMorph>;

export type NormalisedLineSeriesStylerResult = Normalised<
    AgLineSeriesStylerResult,
    never,
    { stroke?: CssColor; marker?: NormalisedSeriesMarkerStyle }
>;

export type NormalisedSeriesSegmentation = Normalised<
    AgSeriesSegmentation,
    never,
    { segments?: NormalisedSeriesShapeSegmentOptions[] }
>;

export type NormalisedSeriesShapeSegmentOptions = Normalised<AgSeriesShapeSegmentOptions, never, FillStrokeMorph>;

/** Per-type interpolation options; the theme defaults `tension` and `position` for their own type. */
export type NormalisedInterpolationOptions =
    | { type: 'linear' }
    | { type: 'smooth'; tension: number }
    | { type: 'step'; position: 'start' | 'middle' | 'end' };

/** Options every cartesian series reads on top of {@link NormalisedSeriesOptions}; all set outside the theme. */
export interface NormalisedCartesianSeriesOptionsCommon {
    /** Axis id the series binds to in each direction; defaults to the canonical `x`/`y` when unmapped. */
    xKeyAxis?: string;
    yKeyAxis?: string;
    legendItemName?: string;
    /** Undocumented: pick nodes outside the visible range of the minor axis (price-volume preset). */
    pickOutsideVisibleMinorAxis?: boolean;
    /** Undocumented: set by the sparkline preset. */
    sparklineMode?: boolean;
    segmentation?: NormalisedSeriesSegmentation;
}

type LineRequiredKeys =
    | 'xKey'
    | 'yKey'
    | 'stroke'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'lineDash'
    | 'lineDashOffset'
    | 'interpolation'
    | 'marker'
    | 'label'
    | 'connectMissingData'
    | 'segmentation';

/** Line options the series owns, before the common series keys are layered on. */
export type NormalisedLineSeriesOwnOptions = Normalised<
    AgLineSeriesOptions,
    LineRequiredKeys,
    {
        stroke: CssColor;
        interpolation: NormalisedInterpolationOptions;
        marker: NormalisedSeriesMarkerOptions<AgLineSeriesMarkerItemStylerParams>;
        label: NormalisedPlacedSeriesLabelOptions<AgLineSeriesLabelFormatterParams>;
        styler?: Styler<AgLineSeriesStylerParams<unknown, unknown>, AgLineSeriesStylerResult>;
        segmentation: NormalisedSeriesSegmentation;
    }
> & {
    /** Cross-filtering only; unsupported and unrelated to the data selection API. */
    selectedKey?: string;
};

export type NormalisedLineSeriesOptions = NormalisedSeriesOptions<NormalisedLineSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;

type AreaRequiredKeys =
    | 'xKey'
    | 'yKey'
    | 'fill'
    | 'fillOpacity'
    | 'stroke'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'lineDash'
    | 'lineDashOffset'
    | 'interpolation'
    | 'shadow'
    | 'marker'
    | 'label'
    | 'connectMissingData'
    | 'segmentation';

/** Area options the series owns, before the common series keys are layered on. */
export type NormalisedAreaSeriesOwnOptions = Normalised<
    AgAreaSeriesOptions,
    AreaRequiredKeys,
    {
        fill: NormalisedColorType;
        stroke: CssColor;
        interpolation: NormalisedInterpolationOptions;
        shadow: NormalisedDropShadowOptions;
        marker: NormalisedSeriesMarkerOptions<AgAreaSeriesMarkerItemStylerParams>;
        label: NormalisedPlacedSeriesLabelOptions<AgAreaSeriesLabelFormatterParams>;
        styler?: Styler<AgAreaSeriesStylerParams<unknown, unknown>, AgAreaSeriesStylerResult>;
        segmentation: NormalisedSeriesSegmentation;
    }
> & {
    /** Cross-filtering only; unsupported and unrelated to the data selection API. */
    selectedKey?: string;
};

export type NormalisedAreaSeriesOptions = NormalisedSeriesOptions<NormalisedAreaSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;
