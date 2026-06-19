import type { AgChartLabelStyleOptions, BorderOptions, CssColor } from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { NormalisedColorType } from './normalisedCommonOptions';

// Unlike the strict `NormalisedBorderOptions` (used by the legend), a label border leaves
// `strokeWidth`/`strokeOpacity` optional — they have no theme default on label styles.
export type NormalisedChartLabelStyleOptions = Normalised<
    AgChartLabelStyleOptions,
    never,
    { color?: CssColor; fill?: NormalisedColorType; border?: Normalised<BorderOptions, never, { stroke?: CssColor }> }
>;
