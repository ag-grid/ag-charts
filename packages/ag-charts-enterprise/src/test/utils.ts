import type { AgChartOptions } from 'ag-charts-community';
import { prepareTestOptions } from 'ag-charts-community-test';

export function prepareEnterpriseTestOptions<T extends AgChartOptions>(options: T, container = document.body) {
    if (!options.animation && !options.series?.some(({ type }) => type === 'treemap')) {
        // Default to animation off.
        options.animation ??= { enabled: false };
    }
    return prepareTestOptions(options, container);
}
