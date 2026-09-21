import type {
    AgHeatmapSeriesItemStylerParams,
    AgHeatmapSeriesLabelFormatterParams,
    AgHeatmapSeriesOptions,
    AgHeatmapSeriesStyle,
    CssColor,
    Styler,
    TextAlign,
    VerticalAlign,
} from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { FillStrokeMorph } from './normalisedCommonOptions';
import type { NormalisedAutoSizedSecondaryLabelOptions } from './normalisedLabelOptions';
import type { NormalisedColorScaleOptions } from './normalisedScatterSeries';

export type NormalisedHeatmapSeriesStyle = Normalised<AgHeatmapSeriesStyle, never, FillStrokeMorph>;

/** Cell label; the deprecated top-level `textAlign`/`verticalAlign` forward into it via the theme. */
export type NormalisedHeatmapSeriesLabelOptions =
    NormalisedAutoSizedSecondaryLabelOptions<AgHeatmapSeriesLabelFormatterParams> & {
        textAlign: TextAlign;
        verticalAlign: VerticalAlign;
    };

type HeatmapRequiredKeys =
    | 'xKey'
    | 'yKey'
    | 'stroke'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'itemPadding'
    | 'cornerRadius'
    | 'label'
    | 'colorScale';

/** Heatmap options the series owns, before the common series keys are layered on. */
export type NormalisedHeatmapSeriesOwnOptions = Normalised<
    AgHeatmapSeriesOptions,
    HeatmapRequiredKeys,
    {
        stroke: CssColor;
        label: NormalisedHeatmapSeriesLabelOptions;
        colorScale: NormalisedColorScaleOptions;
        itemStyler?: Styler<AgHeatmapSeriesItemStylerParams<unknown, unknown>, AgHeatmapSeriesStyle>;
    }
>;
