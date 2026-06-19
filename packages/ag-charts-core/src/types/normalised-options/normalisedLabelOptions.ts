import type { AgChartLabelStyleOptions, CssColor } from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { NormalisedBorderOptions, NormalisedColorType } from './normalisedCommonOptions';

export type NormalisedChartLabelStyleOptions = Normalised<
    AgChartLabelStyleOptions,
    never,
    { color?: CssColor; fill?: NormalisedColorType; border?: NormalisedBorderOptions }
>;
