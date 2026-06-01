import type { AgChartLabelStyleOptions, CssColor } from 'ag-charts-types';

import type { Normalised } from './normalise';

export type NormalisedChartLabelStyleOptions = Normalised<AgChartLabelStyleOptions, never, { color?: CssColor }>;
