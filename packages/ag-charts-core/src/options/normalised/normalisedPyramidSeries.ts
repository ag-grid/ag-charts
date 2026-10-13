import type {
    AgFunnelSeriesLabelPlacement,
    AgPyramidSeriesItemStylerParams,
    AgPyramidSeriesLabelFormatterParams,
    AgPyramidSeriesOptions,
    AgPyramidSeriesStyle,
    CssColor,
    Styler,
} from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { NormalisedBarSeriesLabelOptions } from './normalisedCartesianSeries';
import type { FillStrokeMorph, NormalisedColorType, NormalisedDropShadowOptions } from './normalisedCommonOptions';
import type { NormalisedCollisionFreeSeriesLabelOptions } from './normalisedLabelOptions';

export type NormalisedPyramidSeriesStyle = Normalised<AgPyramidSeriesStyle, never, FillStrokeMorph>;

export type NormalisedPyramidSeriesLabelOptions = NormalisedBarSeriesLabelOptions<
    AgPyramidSeriesLabelFormatterParams,
    AgFunnelSeriesLabelPlacement
>;

/** Stage label beside each stage; `placement` stays absent until the user picks a side. */
export type NormalisedPyramidSeriesStageLabelOptions =
    NormalisedCollisionFreeSeriesLabelOptions<AgPyramidSeriesLabelFormatterParams> & {
        spacing: number;
        placement?: 'before' | 'after';
    };

type PyramidRequiredKeys =
    | 'stageKey'
    | 'valueKey'
    | 'fills'
    | 'strokes'
    | 'fillOpacity'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'lineDash'
    | 'lineDashOffset'
    | 'direction'
    | 'spacing'
    | 'label'
    | 'stageLabel'
    | 'shadow';

/** Pyramid options the series owns, before the common series keys are layered on. */
export type NormalisedPyramidSeriesOwnOptions = Normalised<
    AgPyramidSeriesOptions,
    PyramidRequiredKeys,
    {
        fills: NormalisedColorType[];
        strokes: CssColor[];
        label: NormalisedPyramidSeriesLabelOptions;
        stageLabel: NormalisedPyramidSeriesStageLabelOptions;
        shadow: NormalisedDropShadowOptions;
        itemStyler?: Styler<AgPyramidSeriesItemStylerParams<unknown>, AgPyramidSeriesStyle>;
    }
>;
