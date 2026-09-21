import type {
    AgChartLabelCollisionOptions,
    AgChartLabelCollisionPlacement,
    AgChartLabelFormatterParams,
    AgChartLabelOptions,
    AgChartLabelOrientation,
    AgChartLabelPlacementStyleOptions,
    AgChartLabelStyleOptions,
    AgChartLabelStylerParams,
    BorderOptions,
    ContextDefault,
    CssColor,
    OverflowStrategy,
    RichFormatter,
    Styler,
    TextWrap,
} from 'ag-charts-types';

import type { RequireOptional } from '../global';
import type { BivariantCallback, Normalised } from './normalise';
import type { NormalisedColorType } from './normalisedCommonOptions';

// Unlike the strict `NormalisedBorderOptions` (used by the legend), a label border leaves
// `strokeWidth`/`strokeOpacity` optional — they have no theme default on label styles.
export type NormalisedChartLabelStyleOptions = Normalised<
    AgChartLabelStyleOptions,
    never,
    { color?: CssColor; fill?: NormalisedColorType; border?: Normalised<BorderOptions, never, { stroke?: CssColor }> }
>;

/** Undocumented per-category toggle for the obstacles a label avoids. */
export interface NormalisedLabelCollideWithOptions {
    markers?: boolean;
    labels?: boolean;
    seriesItems?: boolean;
    seriesArea?: boolean;
}

export type NormalisedChartLabelCollisionOptions = Normalised<AgChartLabelCollisionOptions, 'alwaysShow'> & {
    collideWith?: NormalisedLabelCollideWithOptions;
};

export type NormalisedChartLabelPlacementStyleOptions = Normalised<
    AgChartLabelPlacementStyleOptions,
    never,
    { color?: CssColor; fill?: NormalisedColorType; border?: Normalised<BorderOptions, never, { stroke?: CssColor }> }
>;

/** Post-theme options of a series label. */
export type NormalisedSeriesLabelOptions<TParams = never, TDatum = any> = Normalised<
    AgChartLabelOptions<TDatum, RequireOptional<TParams>> & {
        collision?: AgChartLabelCollisionOptions;
        orientation?: AgChartLabelOrientation | AgChartLabelOrientation[];
        maxWidth?: number;
        maxHeight?: number;
        wrapping?: TextWrap;
        truncate?: boolean;
        minimumFontSize?: number;
    },
    'enabled' | 'fontSize' | 'fontFamily' | 'collision',
    {
        color?: CssColor;
        fill?: NormalisedColorType;
        border?: Normalised<BorderOptions, never, { stroke?: CssColor }>;
        collision: NormalisedChartLabelCollisionOptions;
        formatter?: BivariantCallback<
            AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>,
            ReturnType<RichFormatter<never>>
        >;
        itemStyler?: Styler<AgChartLabelStylerParams<TDatum, ContextDefault>, AgChartLabelStyleOptions>;
    }
>;

/** A series label whose owner never resolves collisions, so its theme carries no `collision` block. */
export type NormalisedCollisionFreeSeriesLabelOptions<TParams = never, TDatum = any> = Omit<
    NormalisedSeriesLabelOptions<TParams, TDatum>,
    'collision'
>;

/** Label fitted to its container by shrinking the font (treemap tile, sunburst sector, heatmap cell). */
export type NormalisedAutoSizedSecondaryLabelOptions<
    TParams = never,
    TDatum = any,
> = NormalisedCollisionFreeSeriesLabelOptions<TParams, TDatum> & {
    wrapping: TextWrap;
    overflowStrategy: OverflowStrategy;
    lineHeight?: number;
};

/** Primary auto-sized label; `spacing` separates it from the secondary label stacked beneath it. */
export type NormalisedAutoSizedLabelOptions<TParams = never, TDatum = any> = NormalisedAutoSizedSecondaryLabelOptions<
    TParams,
    TDatum
> & {
    spacing: number;
};

/** Label of a point-like series (line, area, scatter, bubble, map-marker) that resolves a directional placement. */
export type NormalisedPlacedSeriesLabelOptions<TParams = never, TDatum = any> = NormalisedSeriesLabelOptions<
    TParams,
    TDatum
> & {
    placement?: AgChartLabelCollisionPlacement | AgChartLabelCollisionPlacement[];
    spacing?: number;
    insideStyle: NormalisedChartLabelPlacementStyleOptions;
    outsideStyle: NormalisedChartLabelPlacementStyleOptions;
};
