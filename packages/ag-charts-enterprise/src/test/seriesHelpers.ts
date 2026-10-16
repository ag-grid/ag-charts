import type { AgChartOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

/** The series options as the options pipeline resolves them, with the theme and module defaults applied. */
export function resolveSeries(series: object, theme?: object): Record<string, any> {
    const options = { series: [series], ...(theme == null ? {} : { theme }) } as unknown as AgChartOptions;
    const { processedOptions } = new _ModuleSupport.ChartOptions(
        options,
        {} as AgChartOptions,
        {},
        {},
        {}
    ) as unknown as { processedOptions: { series: Record<string, any>[] } };
    return processedOptions.series[0];
}
