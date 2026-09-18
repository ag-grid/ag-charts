import type {
    AgChartLabelFormatterParams,
    AgGaugeColorStop,
    AgGaugeSegmentation,
    AgGaugeSegmentationInterval,
    AgLinearGaugeBarStyle,
    AgLinearGaugeLabelOptions,
    AgLinearGaugePreset,
    AgLinearGaugeScale,
    AgLinearGaugeScaleInterval,
    AgLinearGaugeScaleLabel,
    AgLinearGaugeTarget,
    AgRadialGaugeBarStyle,
    AgRadialGaugeLabelFormatterParams,
    AgRadialGaugeLabelOptions,
    AgRadialGaugeNeedleStyle,
    AgRadialGaugePreset,
    AgRadialGaugeScale,
    AgRadialGaugeScaleInterval,
    AgRadialGaugeScaleLabel,
    AgRadialGaugeSecondaryLabelOptions,
    AgRadialGaugeTarget,
    AgRadialGaugeTargetLabelOptions,
    CssColor,
    FillOptions,
    LineDashOptions,
    RichFormatter,
    StrokeOptions,
} from 'ag-charts-types';

import type { RequireOptional } from '../global';
import type { Normalised } from './normalise';
import type { FillStrokeMorph } from './normalisedCommonOptions';

/** Fill, stroke and dash style shared by every gauge shape; `fill` may be a resolved gradient. */
export type NormalisedGaugeSeriesStyle = Normalised<
    FillOptions & StrokeOptions & LineDashOptions,
    never,
    FillStrokeMorph
>;

type GaugeStyleRequiredKeys =
    | 'fillOpacity'
    | 'stroke'
    | 'strokeWidth'
    | 'strokeOpacity'
    | 'lineDash'
    | 'lineDashOffset';

export type NormalisedGaugeColorStop = Normalised<AgGaugeColorStop, never, { color?: CssColor }>;

type GaugeFillsOverrides = FillStrokeMorph & { fills?: NormalisedGaugeColorStop[] };

export type NormalisedGaugeSegmentationIntervalOptions = AgGaugeSegmentationInterval;

export type NormalisedGaugeSegmentationOptions = Normalised<AgGaugeSegmentation, 'enabled' | 'spacing'>;

/** Undocumented tick-count bounds on the radial scale interval, in pixels of arc length. */
export type NormalisedRadialGaugeScaleIntervalOptions = AgRadialGaugeScaleInterval & {
    minSpacing: number;
    maxSpacing: number;
};

export type NormalisedRadialGaugeScaleLabelOptions = Normalised<
    AgRadialGaugeScaleLabel,
    'enabled' | 'fontSize' | 'fontFamily' | 'spacing' | 'avoidCollisions',
    { color?: CssColor }
>;

export type NormalisedRadialGaugeScaleOptions = Normalised<
    AgRadialGaugeScale,
    'min' | 'max' | 'fillMode' | 'label' | 'interval' | GaugeStyleRequiredKeys,
    GaugeFillsOverrides & {
        label: NormalisedRadialGaugeScaleLabelOptions;
        interval: NormalisedRadialGaugeScaleIntervalOptions;
    }
> & {
    /** Undocumented: scale fill used while the bar is enabled and no scale fills are configured. */
    defaultFill: CssColor;
};

export type NormalisedRadialGaugeBarOptions = Normalised<
    AgRadialGaugeBarStyle,
    'enabled' | 'fillMode' | GaugeStyleRequiredKeys,
    GaugeFillsOverrides
>;

export type NormalisedRadialGaugeNeedleOptions = Normalised<
    AgRadialGaugeNeedleStyle,
    'enabled' | 'spacing' | 'fill' | GaugeStyleRequiredKeys,
    FillStrokeMorph
>;

type GaugeLabelFormatter<TParams> = RichFormatter<AgChartLabelFormatterParams<unknown> & RequireOptional<TParams>>;

export type NormalisedRadialGaugeLabelOptions = Normalised<
    AgRadialGaugeLabelOptions,
    'enabled' | 'fontSize' | 'fontFamily' | 'wrapping' | 'overflowStrategy' | 'spacing',
    { color?: CssColor; formatter?: GaugeLabelFormatter<AgRadialGaugeLabelFormatterParams> }
>;

export type NormalisedRadialGaugeSecondaryLabelOptions = Normalised<
    AgRadialGaugeSecondaryLabelOptions,
    'enabled' | 'fontSize' | 'fontFamily' | 'wrapping' | 'overflowStrategy',
    { color?: CssColor; formatter?: GaugeLabelFormatter<AgRadialGaugeLabelFormatterParams> }
>;

/** A user-configured radial target; anything left unset falls back to the themed `defaultTarget`. */
export type NormalisedRadialGaugeTargetOptions = Normalised<
    AgRadialGaugeTarget,
    never,
    FillStrokeMorph & { label?: Normalised<AgRadialGaugeTargetLabelOptions, never, { color?: CssColor }> }
>;

export type NormalisedRadialGaugeDefaultTargetOptions = Normalised<
    AgRadialGaugeTarget,
    'shape' | 'placement' | 'spacing' | 'size' | 'rotation' | 'label',
    FillStrokeMorph & {
        value?: never;
        label: Normalised<
            AgRadialGaugeTargetLabelOptions,
            'enabled' | 'fontStyle' | 'fontWeight' | 'fontSize' | 'fontFamily' | 'spacing',
            { color: CssColor }
        >;
    }
>;

type RadialGaugeRequiredKeys =
    | 'value'
    | 'startAngle'
    | 'endAngle'
    | 'outerRadiusRatio'
    | 'innerRadiusRatio'
    | 'cornerRadius'
    | 'cornerMode'
    | 'spacing'
    | 'segmentation'
    | 'scale'
    | 'bar'
    | 'needle'
    | 'label'
    | 'secondaryLabel';

/** Radial gauge options the series owns, before the common series keys are layered on. */
export type NormalisedRadialGaugeSeriesOwnOptions = Normalised<
    AgRadialGaugePreset,
    RadialGaugeRequiredKeys,
    {
        segmentation: NormalisedGaugeSegmentationOptions;
        scale: NormalisedRadialGaugeScaleOptions;
        bar: NormalisedRadialGaugeBarOptions;
        needle: NormalisedRadialGaugeNeedleOptions;
        label: NormalisedRadialGaugeLabelOptions;
        secondaryLabel: NormalisedRadialGaugeSecondaryLabelOptions;
        targets?: NormalisedRadialGaugeTargetOptions[];
    }
> & {
    /** Undocumented: palette the bar and scale gradients fall back to when no fills are configured. */
    defaultColorRange: CssColor[];
    /** Undocumented: the target every configured target inherits from. */
    defaultTarget: NormalisedRadialGaugeDefaultTargetOptions;
};

export type NormalisedLinearGaugeScaleLabelOptions = Normalised<
    AgLinearGaugeScaleLabel,
    'enabled' | 'spacing' | 'avoidCollisions',
    { color?: CssColor }
>;

export type NormalisedLinearGaugeScaleOptions = Normalised<
    AgLinearGaugeScale,
    'min' | 'max' | 'fillMode' | 'label' | GaugeStyleRequiredKeys,
    GaugeFillsOverrides & {
        label: NormalisedLinearGaugeScaleLabelOptions;
        interval?: AgLinearGaugeScaleInterval;
    }
> & {
    /** Undocumented: scale fill used while the bar is enabled and no scale fills are configured. */
    defaultFill: CssColor;
};

/** Undocumented: the scale label font every linear scale label inherits from. */
export interface NormalisedLinearGaugeDefaultScaleOptions {
    label: Normalised<AgLinearGaugeScaleLabel, 'fontWeight' | 'fontSize' | 'fontFamily', { color: CssColor }>;
}

export type NormalisedLinearGaugeBarOptions = Normalised<
    AgLinearGaugeBarStyle,
    'enabled' | 'thicknessRatio' | 'fillMode' | GaugeStyleRequiredKeys,
    GaugeFillsOverrides
>;

export type NormalisedLinearGaugeLabelOptions = Normalised<
    AgLinearGaugeLabelOptions,
    | 'enabled'
    | 'fontSize'
    | 'fontFamily'
    | 'wrapping'
    | 'overflowStrategy'
    | 'spacing'
    | 'placement'
    | 'avoidCollisions',
    { color?: CssColor; formatter?: GaugeLabelFormatter<unknown> }
>;

/** A user-configured linear target; anything left unset falls back to the themed `defaultTarget`. */
export type NormalisedLinearGaugeTargetOptions = Normalised<AgLinearGaugeTarget, never, FillStrokeMorph> & {
    label?: NormalisedLinearGaugeTargetLabelOptions;
};

/** Undocumented per-target label; the public linear target carries none, so only the default supplies it. */
export type NormalisedLinearGaugeTargetLabelOptions = Normalised<
    AgRadialGaugeTargetLabelOptions,
    never,
    { color?: CssColor }
>;

export type NormalisedLinearGaugeDefaultTargetOptions = Normalised<
    AgLinearGaugeTarget,
    'shape' | 'placement' | 'spacing' | 'size' | 'rotation' | 'fill' | GaugeStyleRequiredKeys,
    FillStrokeMorph & { value?: never }
> & {
    label: Normalised<
        AgRadialGaugeTargetLabelOptions,
        'enabled' | 'fontStyle' | 'fontWeight' | 'fontSize' | 'fontFamily' | 'spacing',
        { color: CssColor }
    >;
};

type LinearGaugeRequiredKeys =
    | 'value'
    | 'direction'
    | 'thickness'
    | 'cornerRadius'
    | 'cornerMode'
    | 'segmentation'
    | 'scale'
    | 'bar'
    | 'label';

/** Linear gauge options the series owns, before the common series keys are layered on. */
export type NormalisedLinearGaugeSeriesOwnOptions = Normalised<
    AgLinearGaugePreset,
    LinearGaugeRequiredKeys,
    {
        segmentation: NormalisedGaugeSegmentationOptions;
        scale: NormalisedLinearGaugeScaleOptions;
        bar: NormalisedLinearGaugeBarOptions;
        label: NormalisedLinearGaugeLabelOptions;
        targets?: NormalisedLinearGaugeTargetOptions[];
    }
> & {
    /** Undocumented: palette the bar and scale gradients fall back to when no fills are configured. */
    defaultColorRange: CssColor[];
    /** Undocumented: the target every configured target inherits from. */
    defaultTarget: NormalisedLinearGaugeDefaultTargetOptions;
    defaultScale: NormalisedLinearGaugeDefaultScaleOptions;
    /** Undocumented: padding between the gauge labels and the edges they are fitted against. */
    margin: number;
};
