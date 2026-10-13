import type { AgChartCaptionOptions, BorderOptions, ContextDefault, CssColor } from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { NormalisedColorType, NormalisedTextOrSegments } from './normalisedCommonOptions';

/**
 * Post-options-module shape for `title`/`subtitle`/`footnote`. `fontFamily` is
 * narrowed from `FontFamilyFull` to `string` because `optionsModule.ts` flattens
 * Google fonts to their CSS family string before normalised options are emitted.
 *
 * The box-styling members (`fill`/`fillOpacity`/`border`/`cornerRadius`/`padding`)
 * flow through from `AgChartCaptionOptions`. `layoutStyle` and `truncate` are
 * undocumented chart-level caption extensions; they have validators in
 * `chartDefaults.ts` and themes in `chartTheme.ts` but are not part of
 * `AgChartCaptionOptions`.
 */
export type NormalisedChartCaptionOptions<TContext = ContextDefault> = Normalised<
    AgChartCaptionOptions<TContext>,
    never,
    {
        color?: CssColor;
        fontFamily?: string;
        text?: NormalisedTextOrSegments;
        fill?: NormalisedColorType;
        border?: Normalised<BorderOptions, never, { stroke?: CssColor }>;
    }
> & {
    layoutStyle?: 'block' | 'overlay';
    truncate?: boolean;
};
