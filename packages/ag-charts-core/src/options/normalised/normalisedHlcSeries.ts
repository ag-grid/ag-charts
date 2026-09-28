import type {
    AgHlcSeriesItemBandThemeableOptions,
    AgHlcSeriesItemLineThemeableOptions,
    AgHlcSeriesItemStylerParams,
    AgHlcSeriesOptions,
    AgHlcSeriesStyle,
    AgHlcSeriesStylerParams,
    CssColor,
    Styler,
} from 'ag-charts-types';

import type { Normalised } from './normalise';
import type {
    NormalisedCartesianSeriesOptionsCommon,
    NormalisedInterpolationOptions,
} from './normalisedCartesianSeries';
import type { NormalisedColorType } from './normalisedCommonOptions';
import type { NormalisedSeriesMarkerOptions } from './normalisedSeriesMarkerOptions';
import type { NormalisedSeriesOptions } from './normalisedSeriesOptions';

export type NormalisedHlcSeriesMarkerOptions = NormalisedSeriesMarkerOptions<
    AgHlcSeriesItemStylerParams<unknown, unknown>
>;

type HlcItemLineRequiredKeys = 'stroke' | 'strokeWidth' | 'strokeOpacity' | 'lineDash' | 'lineDashOffset' | 'marker';

/** The close line after the theme fills its stroke and marker. */
export type NormalisedHlcSeriesItemLineOptions = Normalised<
    AgHlcSeriesItemLineThemeableOptions<unknown, unknown>,
    HlcItemLineRequiredKeys,
    { stroke: CssColor; marker: NormalisedHlcSeriesMarkerOptions }
>;

/** A band (high or low) and its outer edge after the theme fills its fill, stroke and marker. */
export type NormalisedHlcSeriesItemBandOptions = Normalised<
    AgHlcSeriesItemBandThemeableOptions<unknown, unknown>,
    HlcItemLineRequiredKeys | 'fill' | 'fillOpacity',
    { fill: NormalisedColorType; stroke: CssColor; marker: NormalisedHlcSeriesMarkerOptions }
>;

type HlcRequiredKeys =
    'xKey' | 'highKey' | 'lowKey' | 'closeKey' | 'interpolation' | 'item' | 'marker' | 'connectMissingData';

/** HLC options the series owns, before the common series keys are layered on. */
export type NormalisedHlcSeriesOwnOptions = Normalised<
    AgHlcSeriesOptions,
    HlcRequiredKeys,
    {
        interpolation: NormalisedInterpolationOptions;
        item: {
            high: NormalisedHlcSeriesItemBandOptions;
            low: NormalisedHlcSeriesItemBandOptions;
            close: NormalisedHlcSeriesItemLineOptions;
        };
        marker: NormalisedHlcSeriesMarkerOptions;
        styler?: Styler<AgHlcSeriesStylerParams<unknown, unknown>, AgHlcSeriesStyle>;
    }
>;

export type NormalisedHlcSeriesOptions = NormalisedSeriesOptions<NormalisedHlcSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;
