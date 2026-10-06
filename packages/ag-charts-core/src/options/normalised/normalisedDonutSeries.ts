import type {
    AgDonutInnerCircle,
    AgDonutInnerLabel,
    AgDonutSeriesCalloutOptions,
    AgDonutSeriesItemStylerParams,
    AgDonutSeriesLabelFormatterParams,
    AgDonutSeriesOptions,
    AgDonutSeriesStyle,
    AgDonutSeriesTooltipRendererParams,
    AgDonutTitleOptions,
    CssColor,
    Styler,
} from 'ag-charts-types';

import type { Normalised } from './normalise';
import type {
    FillStrokeMorph,
    NormalisedColorType,
    NormalisedDropShadowOptions,
    NormalisedTextOrSegments,
} from './normalisedCommonOptions';
import type { NormalisedCollisionFreeSeriesLabelOptions } from './normalisedLabelOptions';

export type NormalisedDonutSeriesStyle = Normalised<AgDonutSeriesStyle, never, FillStrokeMorph>;

export type NormalisedDonutSeriesTooltipRendererParams<T> = Normalised<
    AgDonutSeriesTooltipRendererParams<T>,
    never,
    FillStrokeMorph
>;

export type NormalisedDonutSeriesCalloutLabelOptions =
    NormalisedCollisionFreeSeriesLabelOptions<AgDonutSeriesLabelFormatterParams> & {
        offset: number;
        minAngle: number;
        avoidCollisions: boolean;
    };

export type NormalisedDonutSeriesSectorLabelOptions =
    NormalisedCollisionFreeSeriesLabelOptions<AgDonutSeriesLabelFormatterParams> & {
        positionOffset: number;
        positionRatio: number;
    };

export type NormalisedDonutInnerLabelOptions = Normalised<
    AgDonutInnerLabel,
    'fontSize' | 'fontFamily' | 'spacing',
    { text: NormalisedTextOrSegments; color?: CssColor }
>;

export type NormalisedDonutInnerCircleOptions = Normalised<AgDonutInnerCircle, never, { fill: NormalisedColorType }>;

export type NormalisedDonutTitleOptions = Normalised<
    AgDonutTitleOptions,
    'enabled' | 'fontSize' | 'fontFamily' | 'spacing' | 'showInLegend',
    { color?: CssColor }
>;

export type NormalisedDonutSeriesCalloutLineOptions = Normalised<
    AgDonutSeriesCalloutOptions<unknown, unknown>,
    'length' | 'strokeWidth'
>;

type DonutRequiredKeys =
    | 'angleKey'
    | 'fills'
    | 'strokes'
    | 'fillOpacity'
    | 'strokeOpacity'
    | 'strokeWidth'
    | 'lineDash'
    | 'lineDashOffset'
    | 'cornerRadius'
    | 'rotation'
    | 'outerRadiusOffset'
    | 'outerRadiusRatio'
    | 'sectorSpacing'
    | 'hideZeroValueSectorsInLegend'
    | 'title'
    | 'calloutLabel'
    | 'sectorLabel'
    | 'calloutLine'
    | 'shadow';

/** Donut and pie options the series owns, before the common series keys are layered on. */
export type NormalisedDonutSeriesOwnOptions = Normalised<
    AgDonutSeriesOptions,
    DonutRequiredKeys,
    {
        fills: NormalisedColorType[];
        strokes: CssColor[];
        title: NormalisedDonutTitleOptions;
        calloutLabel: NormalisedDonutSeriesCalloutLabelOptions;
        sectorLabel: NormalisedDonutSeriesSectorLabelOptions;
        calloutLine: NormalisedDonutSeriesCalloutLineOptions;
        innerLabels?: NormalisedDonutInnerLabelOptions[];
        innerCircle?: NormalisedDonutInnerCircleOptions;
        shadow: NormalisedDropShadowOptions;
        itemStyler?: Styler<AgDonutSeriesItemStylerParams<unknown, unknown>, AgDonutSeriesStyle>;
    }
> & {
    /** Undocumented: `angleKey` column the sectors are filtered against (cross-filtering). */
    angleFilterKey?: string;
    angleKeyAxis?: string;
    radiusKeyAxis?: string;
};
