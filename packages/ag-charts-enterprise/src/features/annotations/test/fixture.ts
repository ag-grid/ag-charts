import { type AgAnnotation, type AgCartesianChartOptions, type AgChartInstance, AgCharts } from 'ag-charts-community';
import { compareImageSnapshot, setupMockCanvas, waitForChartStability } from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../../test/utils';
import type { AnnotationAxisContext, AnnotationContext } from '../annotationTypes';

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

/** The axes of an annotation context, which is all the coordinate editing reads; the rest of the interface is unused. */
export function createAxesContext(
    xScale: AnnotationAxisContext['scale'],
    yScale: AnnotationAxisContext['scale']
): AnnotationContext {
    return {
        xAxis: { scale: xScale, continuous: true },
        yAxis: { scale: yScale, continuous: true },
    } as unknown as AnnotationContext;
}

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
