import { afterEach, describe, it } from 'vitest';

import { LINE_DASH_PATTERNS } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartInstance, AgLineDashName } from 'ag-charts-types';

import { expectPixelIdenticalAcrossUpdate } from './test/bigintExamples';
import { compareImageSnapshot, createChart, setupMockCanvas, setupMockConsole } from './test/utils';

const NAMES = Object.keys(LINE_DASH_PATTERNS) as AgLineDashName[];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr'];

describe('named line dash patterns', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    /** One stroked line per dash name, each with a marker and a legend line drawn in the same dash. */
    const everyDash = (dash: (name: AgLineDashName) => AgLineDashName | number[]): AgCartesianChartOptions => ({
        data: MONTHS.map((month, i) => ({
            month,
            ...Object.fromEntries(NAMES.map((name, n) => [name, n * 10 + 10 + i * 2])),
        })),
        series: NAMES.map((name) => ({
            type: 'line',
            xKey: 'month',
            yKey: name,
            strokeWidth: 2,
            lineDash: dash(name),
            marker: { enabled: true, size: 8, strokeWidth: 2, lineDash: dash(name) },
        })),
        legend: { item: { line: { length: 60 }, marker: { size: 12 } } },
        axes: {
            x: {
                type: 'category',
                position: 'bottom',
                line: { lineDash: dash('dash') },
                gridLine: { enabled: true, style: [{ lineDash: dash('dot') }] },
            },
            y: { type: 'number', position: 'left', gridLine: { style: [{ lineDash: dash('long-dash') }] } },
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
            everyDash((n) => (n === name ? name : [...LINE_DASH_PATTERNS[n]])),
            everyDash((n) => [...LINE_DASH_PATTERNS[n]])
        );
    });

    it('should render a named dash the same on a bar series stroke as its array', async () => {
        const bars = (lineDash: AgLineDashName | number[]): AgCartesianChartOptions => ({
            data: MONTHS.map((month, i) => ({ month, value: 20 + i * 5 })),
            series: [{ type: 'bar', xKey: 'month', yKey: 'value', stroke: 'black', strokeWidth: 3, lineDash }],
        });

        await expectPixelIdenticalAcrossUpdate(ctx, createChart, bars('long-dash-dot-dot'), bars([14, 4, 2, 4, 2, 4]));
    });
});
