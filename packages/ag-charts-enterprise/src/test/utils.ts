import { type AgChartOptions, AgCharts, type AgGaugeOptions } from 'ag-charts-community';
import { type Chart, deproxy, prepareTestOptions, waitForChartStability } from 'ag-charts-community-test';

import { setupEnterpriseModules } from '../setup';

setupEnterpriseModules();

export function prepareEnterpriseTestOptions<T extends AgChartOptions<any, any>>(
    options: T,
    container?: HTMLElement
): T;
export function prepareEnterpriseTestOptions<T extends AgGaugeOptions>(options: T, container?: HTMLElement): T;
export function prepareEnterpriseTestOptions<T extends AgChartOptions<any, any> | AgGaugeOptions>(
    options: T,
    container = document.body
) {
    // Default to animation off.
    options.animation ??= { enabled: false };
    return prepareTestOptions(options as any, container);
}

export async function createEnterpriseChart<T extends AgChartOptions<any, any>>(options: T): Promise<Chart> {
    options = prepareEnterpriseTestOptions({ ...options });
    const chart = deproxy(AgCharts.create(options as any));
    await waitForChartStability(chart);
    return chart;
}
