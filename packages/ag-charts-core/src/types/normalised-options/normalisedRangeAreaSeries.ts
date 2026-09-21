import type {
    AgRangeAreaSeriesInvertedStyle,
    AgRangeAreaSeriesItemLineThemeableOptions,
    AgRangeAreaSeriesItemStylerParams,
    AgRangeAreaSeriesLabelFormatterParams,
    AgRangeAreaSeriesLabelPlacement,
    AgRangeAreaSeriesOptions,
    AgRangeAreaSeriesStyle,
    AgRangeAreaSeriesStylerParams,
    CssColor,
    Styler,
} from 'ag-charts-types';

import type { Normalised } from './normalise';
import type {
    NormalisedBarSeriesLabelOptions,
    NormalisedCartesianSeriesOptionsCommon,
    NormalisedInterpolationOptions,
    NormalisedSeriesSegmentation,
} from './normalisedCartesianSeries';
import type { NormalisedColorType, NormalisedDropShadowOptions } from './normalisedCommonOptions';
import type { NormalisedSeriesMarkerOptions } from './normalisedSeriesMarkerOptions';
import type { NormalisedSeriesOptions } from './normalisedSeriesOptions';

export type NormalisedRangeAreaSeriesMarkerOptions = NormalisedSeriesMarkerOptions<
    AgRangeAreaSeriesItemStylerParams<unknown, unknown>
>;

/** One band edge (low or high) after the theme fills its stroke and marker from the series level. */
export type NormalisedRangeAreaSeriesItemLineOptions = Normalised<
    AgRangeAreaSeriesItemLineThemeableOptions<unknown, unknown>,
    'stroke' | 'strokeWidth' | 'strokeOpacity' | 'lineDash' | 'lineDashOffset' | 'marker',
    { stroke: CssColor; marker: NormalisedRangeAreaSeriesMarkerOptions }
>;

export type NormalisedRangeAreaSeriesInvertedStyle = Normalised<
    AgRangeAreaSeriesInvertedStyle,
    'enabled' | 'fillOpacity',
    { fill?: NormalisedColorType }
>;

type RangeAreaRequiredKeys =
    | 'xKey'
    | 'yLowKey'
    | 'yHighKey'
    | 'fill'
    | 'fillOpacity'
    | 'stroke'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'lineDash'
    | 'lineDashOffset'
    | 'interpolation'
    | 'item'
    | 'invertedStyle'
    | 'shadow'
    | 'marker'
    | 'label'
    | 'connectMissingData'
    | 'segmentation';

/** Range area options the series owns, before the common series keys are layered on. */
export type NormalisedRangeAreaSeriesOwnOptions = Normalised<
    AgRangeAreaSeriesOptions,
    RangeAreaRequiredKeys,
    {
        fill: NormalisedColorType;
        stroke: CssColor;
        interpolation: NormalisedInterpolationOptions;
        item: { low: NormalisedRangeAreaSeriesItemLineOptions; high: NormalisedRangeAreaSeriesItemLineOptions };
        invertedStyle: NormalisedRangeAreaSeriesInvertedStyle;
        shadow: NormalisedDropShadowOptions;
        marker: NormalisedRangeAreaSeriesMarkerOptions;
        label: NormalisedBarSeriesLabelOptions<AgRangeAreaSeriesLabelFormatterParams, AgRangeAreaSeriesLabelPlacement>;
        styler?: Styler<AgRangeAreaSeriesStylerParams<unknown, unknown>, AgRangeAreaSeriesStyle>;
        segmentation: NormalisedSeriesSegmentation;
    }
>;

export type NormalisedRangeAreaSeriesOptions = NormalisedSeriesOptions<NormalisedRangeAreaSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;
