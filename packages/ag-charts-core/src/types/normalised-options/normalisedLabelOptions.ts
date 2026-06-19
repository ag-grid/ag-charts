import type { AgChartLabelStyleOptions, CssColor } from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { NormalisedPaddingOptions } from './normalisedCommonOptions';

export type NormalisedChartLabelStyleOptions = Normalised<
    AgChartLabelStyleOptions,
    never,
    { color?: CssColor; padding?: NormalisedPaddingOptions }
>;
