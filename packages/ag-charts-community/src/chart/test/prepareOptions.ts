import type { AgChartOptions } from 'ag-charts-types';

import { ChartOptions } from '../../module/optionsModule';

/** Resolves user options through the options graph without constructing a chart. */
export function prepareProcessedOptions(options: unknown) {
    return new ChartOptions(options as AgChartOptions, {} as AgChartOptions, {}, {}, {}).processedOptions;
}
