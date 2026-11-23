import { afterEach, describe, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, AgColorType, AgPatternColor } from 'ag-charts-types';

import { expectSamePixels } from '../test/expectSamePixels';
import {
    PATTERN_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    createChart,
    expectNonBlank,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

const DATA = [
    { month: 'Jan', a: 4, b: 7, c: 9, d: 12 },
    { month: 'Feb', a: 6, b: 5, c: 11, d: 14 },
    { month: 'Mar', a: 5, b: 8, c: 10, d: 13 },
];

const pattern = (name: AgPatternColor['pattern'], stroke: string): AgPatternColor => ({
    type: 'pattern',
    pattern: name,
    stroke,
});

/** A fill and the opacity beside it, given either as a solid colour object or as the plain options it stands for. */
type Fill = (colour: string, fillOpacity?: number) => { fill: AgColorType; fillOpacity?: number };

const solidFill: Fill = (fill, fillOpacity) => ({ fill: { type: 'solid', fill, fillOpacity } });
const plainFill: Fill = (fill, fillOpacity) => (fillOpacity == null ? { fill } : { fill, fillOpacity });

/** Charts that must render the same whichever way `fill` writes their colours. */
const EQUIVALENT_CHARTS: Record<string, (fill: Fill) => AgChartOptions> = {
    'series and marker fills': (fill) => ({
        data: DATA,
        series: [
            { type: 'bar', xKey: 'month', yKey: 'a', ...fill('red', 0.5) },
            // An area's fill opacity defaults to 0.8, which the solid colour's own opacity must replace.
            { type: 'area', xKey: 'month', yKey: 'b', ...fill('green', 0.5), marker: { ...fill('purple') } },
            { type: 'line', xKey: 'month', yKey: 'c', marker: { size: 16, ...fill('blue', 0.5) } },
            { type: 'scatter', xKey: 'month', yKey: 'd', size: 16, ...fill('orange') },
        ],
    }),
    'a list of fills': (fill) => ({
        data: DATA,
        series: [{ type: 'pie', angleKey: 'a', fills: [fill('red').fill, fill('green').fill, fill('blue').fill] }],
    }),
    'styler results': (fill) => ({
        data: DATA,
        series: [
            { type: 'bar', xKey: 'month', yKey: 'a', itemStyler: ({ datum }) => fill('red', datum.a / 10) },
            { type: 'line', xKey: 'month', yKey: 'c', marker: { size: 16, itemStyler: () => fill('blue', 0.5) } },
        ],
    }),
    'highlight and legend styles': (fill) => ({
        data: DATA,
        series: [
            { type: 'bar', xKey: 'month', yKey: 'a', visible: false },
            { type: 'bar', xKey: 'month', yKey: 'b', id: 'b' },
        ],
        legend: { item: { marker: { disabledStyle: { ...fill('grey', 0.5) } } } },
        initialState: { active: { activeItem: { type: 'series-node', seriesId: 'b', itemId: 1 } } },
        theme: { overrides: { bar: { series: { highlight: { highlightedItem: { ...fill('red', 0.5) } } } } } },
    }),
    'a theme palette': (fill) => ({
        data: DATA,
        theme: { palette: { fills: [fill('red').fill, fill('green').fill] } },
        series: [
            { type: 'bar', xKey: 'month', yKey: 'a' },
            { type: 'line', xKey: 'month', yKey: 'c' },
        ],
    }),
};

describe('solid fill', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it.each(Object.keys(EQUIVALENT_CHARTS))('renders %s as the colours they stand for', async (name) => {
        const options = (fill: Fill) => ({ ...EQUIVALENT_CHARTS[name](fill), animation: { enabled: false } });

        chart = await createChart(options(solidFill));
        const solid = ctx.snapshot();
        expectNonBlank(solid);

        await chart.update(prepareTestOptions(options(plainFill)));
        await waitForChartStability(chart);

        // `expectPixelIdenticalAcrossUpdate` lets through a difference the size of a legend marker.
        expectSamePixels(ctx.snapshot(), solid);
    });

    it('takes a solid colour from each pattern of the palette', async () => {
        const fill: AgColorType = { type: 'solid' };
        chart = await createChart({
            data: DATA,
            theme: {
                palette: {
                    fills: [
                        pattern('forward-slanted-lines', '#2b5c95'),
                        pattern('crosshatch', '#c84164'),
                        pattern('stars', '#3d803d'),
                        pattern('polka-dots', '#b07513'),
                    ],
                },
            },
            series: [
                { type: 'bar', xKey: 'month', yKey: 'a' },
                { type: 'area', xKey: 'month', yKey: 'b', marker: { enabled: true, size: 16, fill } },
                { type: 'line', xKey: 'month', yKey: 'c', marker: { size: 16, fill } },
                { type: 'scatter', xKey: 'month', yKey: 'd', size: 16, fill },
            ],
        });

        await compareImageSnapshot(chart, ctx, PATTERN_SNAPSHOT_DEFAULTS);
    });
});
