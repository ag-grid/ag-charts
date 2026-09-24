import type {
    AgBubbleSeriesLabelFormatterParams,
    AgBubbleSeriesOptions,
    AgBubbleSeriesOptionsKeys,
    AgBubbleSeriesStylerParams,
    AgBubbleSeriesStylerResult,
    AgColorScale,
    AgColorScaleColorStop,
    AgNumericValue,
    AgScatterSeriesLabelFormatterParams,
    AgScatterSeriesOptions,
    AgScatterSeriesOptionsKeys,
    AgScatterSeriesStylerParams,
    AgScatterSeriesStylerResult,
    AgSeriesMarkerStyle,
    CssColor,
    Styler,
} from 'ag-charts-types';

import type { RequireOptional } from '../global';
import type { BivariantCallback, Normalised } from './normalise';
import type { NormalisedCartesianSeriesOptionsCommon } from './normalisedCartesianSeries';
import type { NormalisedColorType } from './normalisedCommonOptions';
import type { NormalisedPlacedSeriesLabelOptions } from './normalisedLabelOptions';
import type { NormalisedSeriesMarkerStylerParams } from './normalisedSeriesMarkerOptions';
import type { NormalisedSeriesOptions } from './normalisedSeriesOptions';

/** `stop` stays `number`: the colour-bin maths narrows the domain to Number before positioning stops. */
export type NormalisedColorScaleColorStop = Normalised<
    AgColorScaleColorStop,
    never,
    { color: CssColor; stop?: number }
>;

/** Colour scale of a `colorKey` series; the theme supplies `fills` and `mode` under enterprise only. */
export type NormalisedColorScaleOptions = Normalised<
    AgColorScale,
    'fills' | 'mode',
    { fills: NormalisedColorScaleColorStop[]; domain?: [AgNumericValue, AgNumericValue] }
>;

type BubbleScatterRequiredKeys =
    | 'xKey'
    | 'yKey'
    | 'shape'
    | 'fill'
    | 'fillOpacity'
    | 'stroke'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'lineDash'
    | 'lineDashOffset'
    | 'label'
    | 'maxRenderedItems';

interface BubbleScatterOverrides<TKeys> {
    fill: NormalisedColorType;
    stroke: CssColor;
    colorScale?: NormalisedColorScaleOptions;
    itemStyler?: BivariantCallback<
        NormalisedSeriesMarkerStylerParams<unknown, unknown> & RequireOptional<Omit<TKeys, 'context'>>,
        AgSeriesMarkerStyle | undefined
    >;
}

/** Bubble options the series owns, before the common series keys are layered on. */
export type NormalisedBubbleSeriesOwnOptions = Normalised<
    AgBubbleSeriesOptions,
    BubbleScatterRequiredKeys | 'sizeKey' | 'minSize' | 'maxSize',
    BubbleScatterOverrides<AgBubbleSeriesOptionsKeys> & {
        label: NormalisedPlacedSeriesLabelOptions<AgBubbleSeriesLabelFormatterParams>;
        styler?: Styler<AgBubbleSeriesStylerParams<unknown, unknown>, AgBubbleSeriesStylerResult>;
    }
> & {
    /** Cross-filtering only; unsupported and unrelated to the data selection API. */
    selectedKey?: string;
};

export type NormalisedBubbleSeriesOptions = NormalisedSeriesOptions<NormalisedBubbleSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;

/** Scatter options the series owns, before the common series keys are layered on. */
export type NormalisedScatterSeriesOwnOptions = Normalised<
    AgScatterSeriesOptions,
    BubbleScatterRequiredKeys | 'size',
    BubbleScatterOverrides<AgScatterSeriesOptionsKeys> & {
        label: NormalisedPlacedSeriesLabelOptions<AgScatterSeriesLabelFormatterParams>;
        styler?: Styler<AgScatterSeriesStylerParams<unknown, unknown>, AgScatterSeriesStylerResult>;
    }
> & {
    /** Cross-filtering only; unsupported and unrelated to the data selection API. */
    selectedKey?: string;
};

export type NormalisedScatterSeriesOptions = NormalisedSeriesOptions<NormalisedScatterSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;

/**
 * The shape the shared bubble/scatter implementation reads: bubble sizes markers over `[minSize, maxSize]`
 * from `sizeKey`, scatter draws a fixed `size`, so each series type carries only its own size keys.
 */
export type NormalisedBubbleScatterSeriesOwnOptions = Omit<
    NormalisedBubbleSeriesOwnOptions,
    'type' | 'sizeKey' | 'sizeDomain' | 'minSize' | 'maxSize' | 'styler' | 'itemStyler'
> & {
    type: 'bubble' | 'scatter';
    sizeKey?: string;
    sizeDomain?: [AgNumericValue, AgNumericValue];
    minSize?: number;
    maxSize?: number;
    size?: number;
    styler?: BivariantCallback<
        AgBubbleSeriesStylerParams<unknown, unknown> | AgScatterSeriesStylerParams<unknown, unknown>,
        AgBubbleSeriesStylerResult | AgScatterSeriesStylerResult | undefined
    >;
    itemStyler?: BubbleScatterOverrides<AgBubbleSeriesOptionsKeys | AgScatterSeriesOptionsKeys>['itemStyler'];
};

export type NormalisedBubbleScatterSeriesOptions = NormalisedSeriesOptions<NormalisedBubbleScatterSeriesOwnOptions> &
    NormalisedCartesianSeriesOptionsCommon;
