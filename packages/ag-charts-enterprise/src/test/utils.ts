import type { AgChartOptions } from 'ag-charts-community';
import { AgChartProxy, Chart, deproxy, prepareTestOptions, waitForChartStability } from 'ag-charts-community-test';

import { AgCharts } from '../main';

export function prepareEnterpriseTestOptions<T extends AgChartOptions>(options: T, container = document.body) {
    if (!options.animation && !options.series?.some(({ type }) => type === 'treemap')) {
        // Default to animation off.
        options.animation ??= { enabled: false };
    }
    return prepareTestOptions(options, container);
}

export async function createEnterpriseChart<T extends AgChartOptions>(options: T): Promise<Chart> {
    options = prepareEnterpriseTestOptions({ ...options });
    const chart = deproxy(AgCharts.create(options) as AgChartProxy);
    await waitForChartStability(chart);
    return chart;
}
