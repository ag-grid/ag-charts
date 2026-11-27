import { afterEach, describe, expectTypeOf, it } from 'vitest';

import { LINE_DASH_PATTERNS } from 'ag-charts-core';
import type {
    AgBarSeriesStylerParams,
    AgCartesianChartOptions,
    AgChartInstance,
    AgLineDashName,
    AgLineSeriesOptions,
    AgLineSeriesStylerParams,
} from 'ag-charts-types';

import { compareImageSnapshot, createChart, setupMockCanvas, setupMockConsole } from './test/utils';

const NAMES = Object.keys(LINE_DASH_PATTERNS) as AgLineDashName[];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr'];

const line = (yKey: string, yName: string, options: Partial<AgLineSeriesOptions>): AgLineSeriesOptions => ({
    type: 'line',
    xKey: 'month',
    yKey,
    yName,
    marker: { enabled: false },
    ...options,
});

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
        chart = await createChart({
            data: MONTHS.map((month, i) => ({
                month,
                width1: 100 + i * 4,
                width2: 90 + i * 4,
                width4: 80 + i * 4,
                width6: 70 + i * 4,
                dot10: 110 + i * 4,
                array: 60 + i * 4,
                styler: 50 + i * 4,
                stylerArray: 40 + i * 4,
                bar: 20 + i * 4,
            })),
            series: [
                line('dot10', 'dot at 10', { strokeWidth: 10, lineDash: 'dot' }),
                ...[1, 2, 4, 6].map((strokeWidth) =>
                    line(`width${strokeWidth}`, `dash-dot at ${strokeWidth}`, { strokeWidth, lineDash: 'dash-dot' })
                ),
                line('array', 'array [6, 3, 2, 3] at 6', { strokeWidth: 6, lineDash: [6, 3, 2, 3] }),
                line('styler', 'styler: dot at 5', {
                    strokeWidth: 1,
                    styler: () => ({ strokeWidth: 5, lineDash: 'dot' }),
                }),
                line('stylerArray', 'styler: [16, 6] over dash at 6', {
                    strokeWidth: 6,
                    lineDash: 'dash',
                    styler: () => ({ lineDash: [16, 6] }),
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

    it('should draw a user or styler array as it is over a theme dash name, never merged with it', async () => {
        chart = await createChart({
            data: MONTHS.map((month, i) => ({
                month,
                theme: 100 + i * 4,
                array: 80 + i * 4,
                short: 60 + i * 4,
                empty: 40 + i * 4,
                styler: 20 + i * 4,
            })),
            theme: { overrides: { line: { series: { lineDash: 'dash-dot' } } } },
            series: [
                line('theme', 'theme: dash-dot', {}),
                line('array', 'array [10, 4] over dash-dot', { lineDash: [10, 4] }),
                line('short', 'array [2] over dash-dot', { lineDash: [2] }),
                line('empty', 'array [] over dash-dot', { lineDash: [] }),
                line('styler', 'styler [16, 6] over dash-dot', { styler: () => ({ lineDash: [16, 6] }) }),
            ],
            legend: { position: 'right' },
            axes: { x: { type: 'category' }, y: { type: 'number' } },
        } satisfies AgCartesianChartOptions);
        await compareImageSnapshot(chart, ctx);
    });

    it('should give a styler the resolved array of lengths, never a name', () => {
        expectTypeOf<AgLineSeriesStylerParams<unknown, unknown>['lineDash']>().toEqualTypeOf<number[]>();
        expectTypeOf<AgBarSeriesStylerParams<unknown, unknown>['lineDash']>().toEqualTypeOf<number[]>();
        expectTypeOf<AgLineSeriesOptions['lineDash']>().toEqualTypeOf<number[] | AgLineDashName | undefined>();
    });
});
