import type {
    AgAxisContinuousIntervalOptions,
    AgGradientLegendBarOptions,
    AgGradientLegendLabelOptions,
    AgGradientLegendOptions,
    AgGradientLegendScaleOptions,
    BorderOptions,
    ContextDefault,
    Padding,
} from 'ag-charts-types';

import type { Normalised } from './normalise';

/**
 * Post-theme-merge shape for `gradientLegend.scale.label`.
 *
 * Required keys reflect the values populated by `gradientLegendModule.themeTemplate`:
 * `color`, `fontSize`, `fontFamily`, `fontWeight`, `minSpacing`. `fontFamily` is
 * narrowed from `FontFamilyFull` to `string` because `optionsModule.ts` flattens
 * Google fonts to their CSS family string before normalised options are emitted.
 */
export type NormalisedGradientLegendLabelOptions<TContext = ContextDefault> = Normalised<
    AgGradientLegendLabelOptions<TContext>,
    'color' | 'fontSize' | 'fontFamily' | 'fontWeight' | 'minSpacing',
    { fontFamily: string }
>;

/**
 * Post-theme-merge shape for `gradientLegend.scale.interval`. No required keys —
 * `gradientLegendModule.themeTemplate` does not populate any interval fields.
 */
export type NormalisedGradientLegendIntervalOptions = Normalised<AgAxisContinuousIntervalOptions<number>>;

/**
 * Post-theme-merge shape for `gradientLegend.scale`. Required keys reflect values
 * populated by `gradientLegendModule.themeTemplate` (`padding`).
 */
export type NormalisedGradientLegendScaleOptions<TContext = ContextDefault> = Normalised<
    AgGradientLegendScaleOptions<TContext>,
    'padding',
    {
        label?: NormalisedGradientLegendLabelOptions<TContext>;
        interval?: NormalisedGradientLegendIntervalOptions;
    }
>;

/**
 * Post-theme-merge shape for `gradientLegend.border`. Required keys reflect values
 * populated by `LEGEND_CONTAINER_THEME` (`enabled`, `strokeOpacity`, `strokeWidth`).
 */
export type NormalisedGradientLegendBorderOptions = Normalised<
    BorderOptions,
    'enabled' | 'strokeOpacity' | 'strokeWidth'
>;

/**
 * Post-theme-merge shape for `gradientLegend.gradient`. Required keys reflect values
 * populated by `gradientLegendModule.themeTemplate` (`preferredLength`, `thickness`).
 */
export type NormalisedGradientLegendBarOptions = Normalised<
    AgGradientLegendBarOptions,
    'preferredLength' | 'thickness'
>;

/**
 * Post-theme-merge shape for `gradientLegend`. Required keys reflect values
 * populated by `gradientLegendModule.themeTemplate` (which spreads
 * `LEGEND_CONTAINER_THEME` for `cornerRadius`, `fillOpacity`, `padding`,
 * `border`). `border` and `gradient` are narrowed to their normalised forms
 * so consumers can read them without casts.
 */
export type NormalisedGradientLegendOptions<TContext = ContextDefault> = Normalised<
    AgGradientLegendOptions<TContext>,
    | 'enabled'
    | 'position'
    | 'spacing'
    | 'reverseOrder'
    | 'cornerRadius'
    | 'fillOpacity'
    | 'padding'
    | 'border'
    | 'gradient'
    | 'scale',
    {
        scale: NormalisedGradientLegendScaleOptions<TContext>;
        border: NormalisedGradientLegendBorderOptions;
        gradient: NormalisedGradientLegendBarOptions;
        padding: Padding;
    }
>;
