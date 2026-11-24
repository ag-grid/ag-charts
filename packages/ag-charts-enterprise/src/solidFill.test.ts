import { describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import {
    type Fill,
    expectSolidMatchesPlain,
    optionAt,
    plainFill,
    prepareProcessedOptions,
    setupMockCanvas,
    setupMockConsole,
    solidFill,
} from 'ag-charts-community-test';

import { WATERFALL_DATA, createEnterpriseChart, prepareEnterpriseTestOptions } from './test/utils';

const RANGE_DATA = [
    { x: 'a', low: 2, high: 8, open: 4, close: 6 },
    { x: 'b', low: 3, high: 9, open: 7, close: 5 },
    { x: 'c', low: 1, high: 7, open: 3, close: 6 },
];

const OHLC = { xKey: 'x', openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' };

/** Enterprise series whose theme resolves a fill through a `$path` or `$applySwitch` of its own. */
const EQUIVALENT_CHARTS: Record<string, (fill: Fill) => AgChartOptions> = {
    'range area and its markers': (fill) => ({
        data: RANGE_DATA,
        series: [
            {
                type: 'range-area',
                xKey: 'x',
                yLowKey: 'low',
                yHighKey: 'high',
                fillOpacity: 1,
                ...fill('green', 0.5),
                marker: { enabled: true, size: 14, ...fill('purple') },
            },
        ],
    }),
    'a range bar': (fill) => ({
        data: RANGE_DATA,
        series: [{ type: 'range-bar', xKey: 'x', yLowKey: 'low', yHighKey: 'high', ...fill('orange', 0.5) }],
    }),
    'waterfall items': (fill) => ({
        data: WATERFALL_DATA,
        series: [
            {
                type: 'waterfall',
                xKey: 'x',
                yKey: 'y',
                item: { positive: fill('green', 0.5), negative: fill('red'), total: fill('grey') },
            },
        ],
    }),
    'candlestick items': (fill) => ({
        data: RANGE_DATA,
        series: [{ type: 'candlestick', ...OHLC, item: { up: fill('green', 0.5), down: fill('red') } }],
    }),
};

const scrollbarChart = (fill: ReturnType<Fill>): AgChartOptions => ({
    data: RANGE_DATA,
    series: [{ type: 'bar', xKey: 'x', yKey: 'high' }],
    scrollbar: { enabled: true, thumb: fill },
});

describe('solid fill', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    it.each(Object.keys(EQUIVALENT_CHARTS))('renders %s as the colours they stand for', (name) =>
        expectSolidMatchesPlain(
            ctx,
            { create: createEnterpriseChart, prepare: prepareEnterpriseTestOptions },
            EQUIVALENT_CHARTS[name](solidFill),
            EQUIVALENT_CHARTS[name](plainFill)
        )
    );

    it('mixes the hover colour of a scrollbar thumb from a solid colour', () => {
        const resolve = (fill: ReturnType<Fill>) =>
            prepareProcessedOptions(prepareEnterpriseTestOptions(scrollbarChart(fill))).processedOptions;
        const solid = resolve(solidFill('blue', 0.5));
        const plain = resolve(plainFill('blue', 0.5));

        const hover = optionAt(solid, 'scrollbar.thumb.hoverStyle.fill');
        const plainHover = optionAt(plain, 'scrollbar.thumb.hoverStyle.fill');
        expect(plainHover).toBeDefined();
        expect(hover).toStrictEqual({ type: 'solid', fill: plainHover, fillOpacity: 0.5 });
    });
});
