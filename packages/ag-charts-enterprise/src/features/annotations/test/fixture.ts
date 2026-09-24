import { type AgAnnotation, type AgCartesianChartOptions, type AgChartInstance, AgCharts } from 'ag-charts-community';
import { compareImageSnapshot, setupMockCanvas, waitForChartStability } from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../../test/utils';

type MockCanvas = ReturnType<typeof setupMockCanvas>;

export const ANNOTATIONS_EXAMPLE_OPTIONS: AgCartesianChartOptions = {
    data: [
        { x: new Date('2024-01-05'), y: 5 },
        { x: new Date('2024-06-15'), y: 50 },
        { x: new Date('2024-12-25'), y: 95 },
    ],
    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
    axes: { y: { type: 'number' }, x: { type: 'time' } },
    annotations: { enabled: true, toolbar: { enabled: false } },
};

export async function createAnnotationsChart(options: AgCartesianChartOptions) {
    prepareEnterpriseTestOptions(options);
    const chart = AgCharts.create(options);
    await waitForChartStability(chart);
    return chart;
}

/** Restores onto the SAME chart (the mock canvas only tracks the first chart per test); accepts malformed state. */
export async function restoreAnnotations(chart: AgChartInstance, ctx: MockCanvas, annotations: object[]) {
    await chart.setState({ ...chart.getState(), annotations: annotations as AgAnnotation[] });
    await waitForChartStability(chart);
    return ctx.snapshot();
}

export function compareAnnotationsSnapshot(chart: AgChartInstance, ctx: MockCanvas) {
    return compareImageSnapshot(chart, ctx, { failureThreshold: 0, failureThresholdType: 'percent' });
}
