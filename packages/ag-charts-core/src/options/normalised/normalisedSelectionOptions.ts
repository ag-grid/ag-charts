import type { AgChartSelectionOptions } from 'ag-charts-types';

import type { Normalised } from './normalise';

export type NormalisedSelectionOptions = Normalised<
    AgChartSelectionOptions,
    'enabled' | 'enableClick' | 'enableDrag' | 'clickMode'
>;
