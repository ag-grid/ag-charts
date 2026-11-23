import { type AgAnnotation, type AgCartesianChartOptions, type AgChartInstance, AgCharts } from 'ag-charts-community';
import {
    type ChartOrProxy,
    clickAction,
    compareImageSnapshot,
    deproxy,
    hoverAction,
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';
import { ContinuousScale, DiscreteTimeScale } from 'ag-charts-core';

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

type AxisOverrides = Partial<Pick<AnnotationAxisContext, 'formatWithLabel' | 'valueTickSize'>>;

/**
 * The axes of an annotation context, which is all the coordinate editing reads; the rest of the interface is unused.
 * An axis has no tick size and no format on its labels unless `overrides` gives one.
 */
export function createAxesContext(
    xScale: AnnotationAxisContext['scale'],
    yScale: AnnotationAxisContext['scale'],
    formatYValue: (value: unknown) => string = String,
    overrides: { x?: AxisOverrides; y?: AxisOverrides } = {}
): AnnotationContext {
    const axis = (
        scale: AnnotationAxisContext['scale'],
        format: (value: unknown) => string,
        axisOverrides?: AxisOverrides
    ) => ({
        scale,
        continuous: ContinuousScale.is(scale) || DiscreteTimeScale.is(scale),
        formatScaleValue: format,
        formatWithLabel: () => undefined,
        valueTickSize: () => undefined,
        ...axisOverrides,
    });
    return {
        xAxis: axis(xScale, String, overrides.x),
        yAxis: axis(yScale, formatYValue, overrides.y),
    } as unknown as AnnotationContext;
}

export async function createAnnotationsChart(options: AgCartesianChartOptions) {
    prepareEnterpriseTestOptions(options);
    const chart = AgCharts.create(options);
    await waitForChartStability(chart);
    return chart;
}

/** Selects the annotation at a point of the canvas and opens its settings dialog; gives the body the dialog is in. */
export async function openAnnotationSettings(chartOrProxy: ChartOrProxy<any>, { x, y }: { x: number; y: number }) {
    const chart = deproxy(chartOrProxy);
    await hoverAction(x, y)(chart);
    await clickAction(x, y)(chart);
    await waitForChartStability(chart);

    const { body } = chart.ctx.agDocument;
    body.querySelector<HTMLElement>('button[title="Settings"]')!.click();
    await waitForChartStability(chart);
    return body;
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
