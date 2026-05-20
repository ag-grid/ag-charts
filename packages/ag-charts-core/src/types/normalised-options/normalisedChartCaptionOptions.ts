import type { AgChartCaptionOptions, ContextDefault } from 'ag-charts-types';

import type { Normalised } from './normalise';

/**
 * Post-options-module shape for `title`/`subtitle`/`footnote`. `fontFamily` is
 * narrowed from `FontFamilyFull` to `string` because `optionsModule.ts` flattens
 * Google fonts to their CSS family string before normalised options are emitted.
 *
 * `layoutStyle`, `truncate`, and `padding` are undocumented chart-level caption
 * extensions; they have validators in `chartDefaults.ts` and themes in
 * `chartTheme.ts` but are not part of `AgChartCaptionOptions`.
 */
export type NormalisedChartCaptionOptions<TContext = ContextDefault> = Normalised<
    AgChartCaptionOptions<TContext>,
    never,
    { fontFamily?: string }
> & {
    layoutStyle?: 'block' | 'overlay';
    truncate?: boolean;
    padding?: number;
};
