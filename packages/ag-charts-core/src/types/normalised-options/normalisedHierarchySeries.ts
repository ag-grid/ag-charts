import type {
    AgSunburstInnerCircle,
    AgSunburstInnerLabel,
    AgSunburstSeriesHighlightOptions,
    AgSunburstSeriesHighlightStyle,
    AgSunburstSeriesItemStylerParams,
    AgSunburstSeriesLabelFormatterParams,
    AgSunburstSeriesOptions,
    AgSunburstSeriesStyle,
    AgTreemapSeriesGroupHighlightOptions,
    AgTreemapSeriesGroupHighlightStyle,
    AgTreemapSeriesGroupOptions,
    AgTreemapSeriesItemStylerParams,
    AgTreemapSeriesLabelFormatterParams,
    AgTreemapSeriesOptions,
    AgTreemapSeriesStyle,
    AgTreemapSeriesTileHighlightOptions,
    AgTreemapSeriesTileHighlightStyle,
    AgTreemapSeriesTileOptions,
    CssColor,
    Styler,
} from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { FillStrokeMorph, NormalisedColorType, NormalisedTextOrSegments } from './normalisedCommonOptions';
import type {
    NormalisedAutoSizedLabelOptions,
    NormalisedAutoSizedSecondaryLabelOptions,
    NormalisedCollisionFreeSeriesLabelOptions,
} from './normalisedLabelOptions';
import type { NormalisedColorScaleOptions } from './normalisedScatterSeries';
import type { NormalisedSeriesSelectionOptions } from './normalisedSeriesOptions';

/** Keys every hierarchy series reads; each leaf's normalised own-options type satisfies this. */
export interface NormalisedHierarchySeriesKeys {
    childrenKey: string;
    sizeKey?: string;
    colorKey?: string;
    colorName?: string;
    fills: NormalisedColorType[];
    strokes: CssColor[];
    colorScale: NormalisedColorScaleOptions;
}

export type NormalisedTreemapSeriesStyle = Normalised<AgTreemapSeriesStyle, never, FillStrokeMorph>;

export type NormalisedTreemapGroupHighlightStyle = Normalised<
    AgTreemapSeriesGroupHighlightStyle,
    never,
    FillStrokeMorph
>;

export type NormalisedTreemapTileHighlightStyle = Normalised<AgTreemapSeriesTileHighlightStyle, never, FillStrokeMorph>;

export type NormalisedTreemapGroupHighlightOptions = Normalised<
    AgTreemapSeriesGroupHighlightOptions,
    'enabled',
    {
        highlightedItem?: NormalisedTreemapGroupHighlightStyle;
        unhighlightedItem?: NormalisedTreemapGroupHighlightStyle;
    }
>;

export type NormalisedTreemapTileHighlightOptions = Normalised<
    AgTreemapSeriesTileHighlightOptions,
    'enabled',
    {
        highlightedBranch?: NormalisedTreemapTileHighlightStyle;
        highlightedItem?: NormalisedTreemapTileHighlightStyle;
        unhighlightedItem?: NormalisedTreemapTileHighlightStyle;
        unhighlightedBranch?: NormalisedTreemapTileHighlightStyle;
    }
>;

export type NormalisedTreemapGroupLabelOptions =
    NormalisedCollisionFreeSeriesLabelOptions<AgTreemapSeriesLabelFormatterParams> & { spacing: number };

type TreemapGroupRequiredKeys =
    | 'fills'
    | 'fillOpacity'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'cornerRadius'
    | 'textAlign'
    | 'gap'
    | 'padding'
    | 'interactive'
    | 'label'
    | 'highlight';

export type NormalisedTreemapGroupOptions = Normalised<
    AgTreemapSeriesGroupOptions<unknown, unknown>,
    TreemapGroupRequiredKeys,
    {
        fill?: NormalisedColorType;
        fills: NormalisedColorType[];
        stroke?: CssColor;
        label: NormalisedTreemapGroupLabelOptions;
        highlight: NormalisedTreemapGroupHighlightOptions;
    }
>;

type TreemapTileRequiredKeys =
    | 'fillOpacity'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'cornerRadius'
    | 'textAlign'
    | 'verticalAlign'
    | 'gap'
    | 'padding'
    | 'label'
    | 'secondaryLabel'
    | 'highlight'
    | 'selection';

export type NormalisedTreemapTileOptions = Normalised<
    AgTreemapSeriesTileOptions<unknown, unknown>,
    TreemapTileRequiredKeys,
    {
        fill?: NormalisedColorType;
        stroke?: CssColor;
        label: NormalisedAutoSizedLabelOptions<AgTreemapSeriesLabelFormatterParams>;
        secondaryLabel: NormalisedAutoSizedSecondaryLabelOptions<AgTreemapSeriesLabelFormatterParams>;
        highlight: NormalisedTreemapTileHighlightOptions;
        selection: NormalisedSeriesSelectionOptions<NormalisedTreemapSeriesStyle>;
    }
>;

/** Treemap options the series owns, before the common series keys are layered on. */
export type NormalisedTreemapSeriesOwnOptions = Normalised<
    AgTreemapSeriesOptions,
    'childrenKey' | 'fills' | 'strokes' | 'colorScale' | 'group' | 'tile',
    {
        fills: NormalisedColorType[];
        strokes: CssColor[];
        colorScale: NormalisedColorScaleOptions;
        group: NormalisedTreemapGroupOptions;
        tile: NormalisedTreemapTileOptions;
        itemStyler?: Styler<AgTreemapSeriesItemStylerParams<unknown, unknown>, AgTreemapSeriesStyle>;
    }
> & {
    /** Undocumented: stroke palette cycled by group depth, so it follows the light/dark theme. */
    undocumentedGroupStrokes: CssColor[];
};

export type NormalisedSunburstSeriesStyle = Normalised<AgSunburstSeriesStyle, never, FillStrokeMorph>;

export type NormalisedSunburstSeriesHighlightStyle = Normalised<AgSunburstSeriesHighlightStyle, never, FillStrokeMorph>;

export type NormalisedSunburstSeriesHighlightOptions = Normalised<
    AgSunburstSeriesHighlightOptions,
    'enabled',
    {
        highlightedBranch?: NormalisedSunburstSeriesHighlightStyle;
        highlightedItem?: NormalisedSunburstSeriesHighlightStyle;
        unhighlightedItem?: NormalisedSunburstSeriesHighlightStyle;
        unhighlightedBranch?: NormalisedSunburstSeriesHighlightStyle;
    }
>;

export type NormalisedSunburstInnerLabelOptions = Normalised<
    AgSunburstInnerLabel,
    'fontSize' | 'fontFamily' | 'spacing',
    { text: NormalisedTextOrSegments; color?: CssColor }
>;

export type NormalisedSunburstInnerCircleOptions = Normalised<
    AgSunburstInnerCircle,
    never,
    { fill: NormalisedColorType }
>;

type SunburstRequiredKeys =
    | 'childrenKey'
    | 'fills'
    | 'strokes'
    | 'colorScale'
    | 'fillOpacity'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'cornerRadius'
    | 'sectorSpacing'
    | 'padding'
    | 'label'
    | 'secondaryLabel'
    | 'highlight';

/** Sunburst options the series owns, before the common series keys are layered on. */
export type NormalisedSunburstSeriesOwnOptions = Normalised<
    AgSunburstSeriesOptions,
    SunburstRequiredKeys,
    {
        fills: NormalisedColorType[];
        strokes: CssColor[];
        colorScale: NormalisedColorScaleOptions;
        label: NormalisedAutoSizedLabelOptions<AgSunburstSeriesLabelFormatterParams>;
        secondaryLabel: NormalisedAutoSizedSecondaryLabelOptions<AgSunburstSeriesLabelFormatterParams>;
        innerLabels?: NormalisedSunburstInnerLabelOptions[];
        /** Stays absent until the user supplies one, so `innerCircle != null` means "user set it". */
        innerCircle?: NormalisedSunburstInnerCircleOptions;
        highlight: NormalisedSunburstSeriesHighlightOptions;
        itemStyler?: Styler<AgSunburstSeriesItemStylerParams<unknown, unknown>, AgSunburstSeriesStyle>;
    }
>;
