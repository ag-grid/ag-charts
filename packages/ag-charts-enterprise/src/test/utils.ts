import { type AgChartOptions, AgCharts, type AgGaugeOptions } from 'ag-charts-community';
import {
    type Chart,
    deproxy,
    extractImageData,
    prepareTestOptions,
    waitForChartStability,
} from 'ag-charts-community-test';

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

/**
 * Render an enterprise chart, extract its canvas as a PNG buffer, then destroy it. Used by the
 * per-series `bigint values` / `ISO datetime` sub-suites so the assertion (`toMatchImageSnapshot`)
 * stays in the test file — `src/test/utils.ts` is cruised as production code and must not depend on
 * the test runner. `ctx` is the suite's `setupMockCanvas()` handle.
 */
export async function renderEnterpriseChartImage(
    ctx: Parameters<typeof extractImageData>[0],
    options: AgChartOptions
): Promise<ReturnType<typeof extractImageData>> {
    const chart = await createEnterpriseChart(options);
    const image = extractImageData(ctx);
    chart.destroy();
    return image;
}
