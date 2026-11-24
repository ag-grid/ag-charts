import { afterEach, describe, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, AgColorType, AgPatternColor } from 'ag-charts-types';

import { type Fill, expectSolidMatchesPlain, plainFill, solidFill } from '../test/solidFills';
import {
    PATTERN_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    createChart,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
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
            // A styler's opacity replaces one set outside its result, as a plain `fillOpacity` does.
            {
                type: 'bar',
                xKey: 'month',
                yKey: 'a',
                fillOpacity: 0.8,
                itemStyler: ({ datum }) => fill('red', datum.a / 10),
            },
            {
                type: 'line',
                xKey: 'month',
                yKey: 'c',
                marker: { size: 16, fillOpacity: 0.8, itemStyler: () => fill('blue', 0.5) },
            },
        ],
    }),
    'a donut styler': (fill) => ({
        data: DATA,
        series: [
            {
                type: 'donut',
                angleKey: 'a',
                innerRadiusRatio: 0.6,
                fillOpacity: 0.8,
                itemStyler: ({ datum }) => fill('red', datum.a / 10),
            },
        ],
    }),
    'axis label stylers': (fill) => ({
        data: DATA,
        series: [{ type: 'bar', xKey: 'month', yKey: 'a' }],
        axes: {
            // A styler's opacity replaces the label's own, as a plain `fillOpacity` does.
            x: { type: 'category', label: { fillOpacity: 0.5, itemStyler: () => fill('red', 0.5) } },
            y: { type: 'number', label: { itemStyler: () => fill('blue', 0.5) } },
        },
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

const PALETTE = ['#aa0000', '#00aa00'];

const paletteChart = (first: AgColorType): AgChartOptions => ({
    data: DATA,
    theme: { palette: { fills: [first, 'green'] } },
    series: [
        { type: 'bar', xKey: 'month', yKey: 'a' },
        { type: 'line', xKey: 'month', yKey: 'c' },
    ],
});

const donutChart = (fill: AgColorType): AgChartOptions => ({
    data: DATA,
    theme: { palette: { fills: PALETTE } },
    series: [{ type: 'donut', angleKey: 'a', innerRadiusRatio: 0.6, innerCircle: { fill } }],
});

const axisChart = (itemStyler: () => { fill?: AgColorType }): AgChartOptions => ({
    data: DATA,
    series: [{ type: 'bar', xKey: 'month', yKey: 'a' }],
    axes: { x: { type: 'category', label: { fill: 'orange', itemStyler } }, y: { type: 'number' } },
});

const STRIPES = ['#aa0000', '#00aa00', '#0000aa'];

const stripedDonutChart = (fills: AgColorType[], itemStyler?: () => { fill: AgColorType }): AgChartOptions => ({
    data: DATA,
    legend: { enabled: false },
    theme: { palette: { fills } },
    series: [{ type: 'donut', angleKey: 'a', innerRadiusRatio: 0.6, itemStyler }],
});

/** Charts that no `Fill` can express, as the options with a solid colour and the plain ones it stands for. */
const EXPLICIT_PAIRS: Record<string, [solid: AgChartOptions, plain: AgChartOptions]> = {
    'a palette solid with an opacity': [
        paletteChart({ type: 'solid', fill: 'red', fillOpacity: 0.5 }),
        paletteChart('rgba(255, 0, 0, 0.5)'),
    ],
    'a donut inner circle with no colour': [donutChart({ type: 'solid' }), donutChart(PALETTE[0])],
    // A plain colour from a styler is not applied over a pattern palette, so the stroke colours stand in for it.
    'a donut styler with no colour on a pattern palette': [
        stripedDonutChart(
            STRIPES.map((stroke) => pattern('crosshatch', stroke)),
            () => ({ fill: { type: 'solid' } })
        ),
        stripedDonutChart(STRIPES),
    ],
    'an axis label styler with no colour': [axisChart(() => ({ fill: { type: 'solid' } })), axisChart(() => ({}))],
};

const EQUIVALENT_PAIRS: Record<string, [solid: AgChartOptions, plain: AgChartOptions]> = {
    ...Object.fromEntries(
        Object.entries(EQUIVALENT_CHARTS).map(([name, chart]) => [name, [chart(solidFill), chart(plainFill)]])
    ),
    ...EXPLICIT_PAIRS,
};

describe('solid fill', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it.each(Object.keys(EQUIVALENT_PAIRS))('renders %s as the colours they stand for', (name) =>
        expectSolidMatchesPlain(ctx, { create: createChart, prepare: prepareTestOptions }, ...EQUIVALENT_PAIRS[name])
    );

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
