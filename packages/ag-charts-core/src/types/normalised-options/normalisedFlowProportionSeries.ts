import type {
    AgChordSeriesGetItemIdParams,
    AgChordSeriesLabelFormatterParams,
    AgChordSeriesLinkItemStylerParams,
    AgChordSeriesLinkOptions,
    AgChordSeriesLinkStyle,
    AgChordSeriesNodeItemStylerParams,
    AgChordSeriesNodeOptions,
    AgChordSeriesNodeStyle,
    AgChordSeriesOptions,
    AgSankeySeriesGetItemIdParams,
    AgSankeySeriesLabelFormatterParams,
    AgSankeySeriesLinkItemStylerParams,
    AgSankeySeriesLinkOptions,
    AgSankeySeriesLinkStyle,
    AgSankeySeriesNodeItemStylerParams,
    AgSankeySeriesNodeOptions,
    AgSankeySeriesNodeStyle,
    AgSankeySeriesOptions,
    AgSankeySeriesTooltipRendererParams,
    AgSeriesTooltip,
    CssColor,
    FillOptions,
    LineDashOptions,
    StrokeOptions,
    Styler,
} from 'ag-charts-types';

import type { BivariantCallback, Normalised } from './normalise';
import type {
    FillStrokeMorph,
    NormalisedColorType,
    RequiredInternalAgGradientColor,
    RequiredInternalAgImageFill,
    RequiredInternalAgPatternColor,
} from './normalisedCommonOptions';
import type { NormalisedCollisionFreeSeriesLabelOptions } from './normalisedLabelOptions';

/** Undocumented: the defaults a gradient, pattern or image fill is completed with at render time. */
export interface NormalisedFlowProportionFillDefaults {
    fillGradientDefaults: RequiredInternalAgGradientColor;
    fillPatternDefaults: RequiredInternalAgPatternColor;
    fillImageDefaults: RequiredInternalAgImageFill;
}

/** Undocumented: explicit node data, keyed by `idKey` and labelled by `labelKey`. */
export interface NormalisedFlowProportionNodeKeys {
    nodes?: unknown[];
    idKey?: string;
    idName?: string;
    labelKey?: string;
    labelName?: string;
}

/** The shared tooltip formatter supplies the item style too; each leaf's public renderer params are a subset. */
type FlowProportionTooltipRendererParams = AgSankeySeriesTooltipRendererParams<any, any> &
    FillOptions &
    StrokeOptions &
    LineDashOptions;

/** Keys the shared flow-proportion implementation reads; each leaf's normalised own-options type satisfies this. */
export interface NormalisedFlowProportionSeriesKeys
    extends NormalisedFlowProportionFillDefaults, NormalisedFlowProportionNodeKeys {
    fromKey: string;
    toKey: string;
    sizeKey?: string;
    sizeName?: string;
    fills: NormalisedColorType[];
    strokes: CssColor[];
    tooltip?: AgSeriesTooltip<FlowProportionTooltipRendererParams>;
    getItemId?: BivariantCallback<
        AgSankeySeriesGetItemIdParams<any, any> | AgChordSeriesGetItemIdParams<any, any>,
        string
    >;
}

type FlowStyleRequiredKeys = 'fillOpacity' | 'strokeWidth' | 'strokeOpacity' | 'lineDash' | 'lineDashOffset';

export type NormalisedSankeySeriesNodeStyle = Normalised<AgSankeySeriesNodeStyle, never, FillStrokeMorph>;

export type NormalisedSankeySeriesLabelOptions =
    NormalisedCollisionFreeSeriesLabelOptions<AgSankeySeriesLabelFormatterParams> & {
        spacing: number;
        placement?: 'left' | 'right' | 'center';
        edgePlacement?: 'inside' | 'outside';
    };

/** Link styling; `fill`/`stroke` fall back to the series palette cycled by source node at render time. */
export type NormalisedSankeySeriesLinkOptions = Normalised<
    AgSankeySeriesLinkOptions<unknown, unknown>,
    FlowStyleRequiredKeys,
    {
        fill?: NormalisedColorType;
        stroke?: CssColor;
        itemStyler?: Styler<AgSankeySeriesLinkItemStylerParams<unknown>, AgSankeySeriesLinkStyle>;
    }
>;

export type NormalisedSankeySeriesNodeOptions = Normalised<
    AgSankeySeriesNodeOptions<unknown, unknown>,
    | FlowStyleRequiredKeys
    | 'spacing'
    | 'minSpacing'
    | 'width'
    | 'cornerRadius'
    | 'alignment'
    | 'verticalAlignment'
    | 'sort',
    {
        fill?: NormalisedColorType;
        stroke?: CssColor;
        itemStyler?: Styler<AgSankeySeriesNodeItemStylerParams<unknown>, AgSankeySeriesNodeStyle>;
    }
>;

/** Sankey options the series owns, before the common series keys are layered on. */
export type NormalisedSankeySeriesOwnOptions = Normalised<
    AgSankeySeriesOptions,
    'fromKey' | 'toKey' | 'fills' | 'strokes' | 'label' | 'link' | 'node',
    {
        fills: NormalisedColorType[];
        strokes: CssColor[];
        label: NormalisedSankeySeriesLabelOptions;
        link: NormalisedSankeySeriesLinkOptions;
        node: NormalisedSankeySeriesNodeOptions;
    }
> &
    NormalisedFlowProportionFillDefaults &
    NormalisedFlowProportionNodeKeys & {
        /** Undocumented: gradient stops a palette-filled node or link defaults to, cycled by source node. */
        defaultColorRange: CssColor[][];
        /** Undocumented: pattern colours a palette-filled node or link defaults to, cycled by source node. */
        defaultPatternFills: CssColor[];
    };

export type NormalisedChordSeriesNodeStyle = Normalised<AgChordSeriesNodeStyle, never, FillStrokeMorph>;

export type NormalisedChordSeriesLinkStyle = Normalised<AgChordSeriesLinkStyle, never, FillStrokeMorph>;

export type NormalisedChordSeriesLabelOptions =
    NormalisedCollisionFreeSeriesLabelOptions<AgChordSeriesLabelFormatterParams> & {
        spacing: number;
        maxWidth: number;
    };

/** Link styling; `fill`/`stroke` fall back to the series palette cycled by source node at render time. */
export type NormalisedChordSeriesLinkOptions = Normalised<
    AgChordSeriesLinkOptions<unknown, unknown>,
    FlowStyleRequiredKeys | 'tension',
    {
        fill?: NormalisedColorType;
        stroke?: CssColor;
        itemStyler?: Styler<AgChordSeriesLinkItemStylerParams<unknown>, AgChordSeriesLinkStyle>;
    }
>;

export type NormalisedChordSeriesNodeOptions = Normalised<
    AgChordSeriesNodeOptions<unknown, unknown>,
    FlowStyleRequiredKeys | 'spacing' | 'width' | 'cornerRadius',
    {
        fill?: NormalisedColorType;
        stroke?: CssColor;
        itemStyler?: Styler<AgChordSeriesNodeItemStylerParams<unknown>, AgChordSeriesNodeStyle>;
    }
>;

/** Chord options the series owns, before the common series keys are layered on. */
export type NormalisedChordSeriesOwnOptions = Normalised<
    AgChordSeriesOptions,
    'fromKey' | 'toKey' | 'fills' | 'strokes' | 'label' | 'link' | 'node',
    {
        fills: NormalisedColorType[];
        strokes: CssColor[];
        label: NormalisedChordSeriesLabelOptions;
        link: NormalisedChordSeriesLinkOptions;
        node: NormalisedChordSeriesNodeOptions;
    }
> &
    NormalisedFlowProportionFillDefaults &
    NormalisedFlowProportionNodeKeys;
