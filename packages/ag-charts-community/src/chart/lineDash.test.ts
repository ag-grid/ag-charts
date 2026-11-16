import { afterEach, describe, it } from 'vitest';

import { LINE_DASH_PATTERNS } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartInstance, AgLineDashName, AgLineSeriesOptions } from 'ag-charts-types';

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

    it('should render every stock dash pattern on series, markers, legend items and axes', async () => {
        chart = await createChart({
            data: MONTHS.map((month, i) => ({
                month,
                ...Object.fromEntries(NAMES.map((name, n) => [name, n * 10 + 10 + i * 2])),
            })),
            series: NAMES.map((name) => ({
                type: 'line',
                xKey: 'month',
                yKey: name,
                strokeWidth: 2,
                lineDash: name,
                marker: { enabled: true, size: 8, strokeWidth: 2, lineDash: name },
            })),
            legend: { item: { line: { length: 60 }, marker: { size: 12 } } },
            axes: {
                x: {
                    type: 'category',
                    position: 'bottom',
                    line: { lineDash: 'dash' },
                    gridLine: { enabled: true, style: [{ lineDash: 'dot' }] },
                },
                y: { type: 'number', position: 'left', gridLine: { style: [{ lineDash: 'long-dash' }] } },
            },
        } satisfies AgCartesianChartOptions);
        await compareImageSnapshot(chart, ctx);
    });

    it('should scale a named dash with strokeWidth, and not an array, on lines, a styler and a bar stroke', async () => {
        const line = (yKey: string, yName: string, options: Partial<AgLineSeriesOptions>): AgLineSeriesOptions => ({
            type: 'line',
            xKey: 'month',
            yKey,
            yName,
            marker: { enabled: false },
            ...options,
        });

        chart = await createChart({
            data: MONTHS.map((month, i) => ({
                month,
                width1: 100 + i * 4,
                width2: 90 + i * 4,
                width4: 80 + i * 4,
                width6: 70 + i * 4,
                array: 60 + i * 4,
                styler: 50 + i * 4,
                bar: 20 + i * 4,
            })),
            series: [
                ...[1, 2, 4, 6].map((strokeWidth) =>
                    line(`width${strokeWidth}`, `dash-dot at ${strokeWidth}`, { strokeWidth, lineDash: 'dash-dot' })
                ),
                line('array', 'array [6, 3, 2, 3] at 6', { strokeWidth: 6, lineDash: [6, 3, 2, 3] }),
                line('styler', 'styler: dot at 5', {
                    strokeWidth: 1,
                    styler: () => ({ strokeWidth: 5, lineDash: 'dot' }),
                }),
                {
                    type: 'bar',
                    xKey: 'month',
                    yKey: 'bar',
                    yName: 'bar: long-dash-dot-dot at 3',
                    fillOpacity: 0.1,
                    stroke: 'black',
                    strokeWidth: 3,
                    lineDash: 'long-dash-dot-dot',
                },
            ],
            legend: { position: 'right' },
            axes: { x: { type: 'category' }, y: { type: 'number' } },
        } satisfies AgCartesianChartOptions);
        await compareImageSnapshot(chart, ctx);
    });
});
