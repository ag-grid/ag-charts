import { afterEach, describe, it } from 'vitest';

import { LINE_DASH_PATTERNS } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartInstance, AgLineDashName } from 'ag-charts-types';

import { expectPixelIdenticalAcrossUpdate } from './test/bigintExamples';
import { compareImageSnapshot, createChart, setupMockCanvas, setupMockConsole } from './test/utils';

const NAMES = Object.keys(LINE_DASH_PATTERNS) as AgLineDashName[];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr'];

/** A stock dash name as the array of pixel lengths it resolves to at a given stroke width. */
const dashAt = (name: AgLineDashName, strokeWidth: number) => LINE_DASH_PATTERNS[name].map((n) => n * strokeWidth);

describe('named line dash patterns', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    /**
     * One stroked line per dash name, each with a marker and a legend line drawn in the same dash. The axis styles set
     * their `strokeWidth` so that an array can stand in for a name at that width.
     */
    const everyDash = (
        dash: (name: AgLineDashName, strokeWidth: number) => AgLineDashName | number[]
    ): AgCartesianChartOptions => ({
        data: MONTHS.map((month, i) => ({
            month,
            ...Object.fromEntries(NAMES.map((name, n) => [name, n * 10 + 10 + i * 2])),
        })),
        series: NAMES.map((name) => ({
            type: 'line',
            xKey: 'month',
            yKey: name,
            strokeWidth: 2,
            lineDash: dash(name, 2),
            marker: { enabled: true, size: 8, strokeWidth: 2, lineDash: dash(name, 2) },
        })),
        legend: { item: { line: { length: 60 }, marker: { size: 12 } } },
        axes: {
            x: {
                type: 'category',
                position: 'bottom',
                line: { strokeWidth: 1, lineDash: dash('dash', 1) },
                gridLine: { enabled: true, style: [{ strokeWidth: 1, lineDash: dash('dot', 1) }] },
            },
            y: {
                type: 'number',
                position: 'left',
                gridLine: { style: [{ strokeWidth: 1, lineDash: dash('long-dash', 1) }] },
            },
        },
    });

    it('should render every stock dash pattern on series, markers and legend items', async () => {
        chart = await createChart(everyDash((name) => name));
        await compareImageSnapshot(chart, ctx);
    });

    it.each(NAMES)('should render %s the same as its array', async (name) => {
        await expectPixelIdenticalAcrossUpdate(
            ctx,
            createChart,
            everyDash((n, width) => (n === name ? name : dashAt(n, width))),
            everyDash(dashAt)
        );
    });

    it.each([1, 2, 6])('should scale a named dash to a strokeWidth of %i', async (strokeWidth) => {
        const dashed = (lineDash: AgLineDashName | number[]): AgCartesianChartOptions => ({
            data: MONTHS.map((month, i) => ({ month, value: 20 + i * 5 })),
            series: [{ type: 'line', xKey: 'month', yKey: 'value', strokeWidth, lineDash }],
        });

        await expectPixelIdenticalAcrossUpdate(
            ctx,
            createChart,
            dashed('dash-dot'),
            dashed(dashAt('dash-dot', strokeWidth))
        );
    });

    it('should render a named dash returned by a styler the same as its array', async () => {
        const styled = (lineDash: AgLineDashName | number[]): AgCartesianChartOptions => ({
            data: MONTHS.map((month, i) => ({ month, value: 20 + i * 5 })),
            series: [{ type: 'line', xKey: 'month', yKey: 'value', strokeWidth: 3, styler: () => ({ lineDash }) }],
        });

        await expectPixelIdenticalAcrossUpdate(ctx, createChart, styled('dash-dot'), styled(dashAt('dash-dot', 3)));
    });

    it('should scale a named dash returned by a styler by the strokeWidth the styler returns', async () => {
        const styled = (lineDash: AgLineDashName | number[]): AgCartesianChartOptions => ({
            data: MONTHS.map((month, i) => ({ month, value: 20 + i * 5 })),
            series: [
                {
                    type: 'line',
                    xKey: 'month',
                    yKey: 'value',
                    strokeWidth: 1,
                    styler: () => ({ strokeWidth: 5, lineDash }),
                },
            ],
        });

        await expectPixelIdenticalAcrossUpdate(ctx, createChart, styled('dash-dot'), styled(dashAt('dash-dot', 5)));
    });

    it('should render a named dash the same on a bar series stroke as its array', async () => {
        const bars = (lineDash: AgLineDashName | number[]): AgCartesianChartOptions => ({
            data: MONTHS.map((month, i) => ({ month, value: 20 + i * 5 })),
            series: [{ type: 'bar', xKey: 'month', yKey: 'value', stroke: 'black', strokeWidth: 3, lineDash }],
        });

        await expectPixelIdenticalAcrossUpdate(
            ctx,
            createChart,
            bars('long-dash-dot-dot'),
            bars(dashAt('long-dash-dot-dot', 3))
        );
    });
});
