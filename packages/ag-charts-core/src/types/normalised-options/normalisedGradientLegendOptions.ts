import type { AgGradientLegendLabelOptions, ContextDefault } from 'ag-charts-types';

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
