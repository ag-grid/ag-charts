import { describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { getSeriesOptions, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { HIERARCHY_SHADOW_DATA, createEnterpriseChart } from '../test/utils';

const FLOW = [
    { from: 'A', to: 'C', size: 8 },
    { from: 'B', to: 'C', size: 5 },
];
const WATERFALL = [
    { x: 'a', y: 5 },
    { x: 'b', y: -2 },
];
const OHLC = [{ x: 1, open: 1, high: 3, low: 0, close: 2 }];
const HEATMAP = [{ x: 'a', y: 'p', value: 1 }];
const ON = { enabled: true };
const MARKER = { enabled: true, glow: ON };

const ITEM = ['highlightedItem', 'unhighlightedItem'];
const BRANCH = ['highlightedBranch', 'unhighlightedBranch'];
const SERIES = ['highlightedSeries', 'unhighlightedSeries'];

// Each series' buckets take their `enabled` from the series-level `glow`, wherever the series keeps it.
const CASES: Array<[string, object, object[], (options: any) => any, string[]]> = [
    [
        'treemap tile',
        { type: 'treemap', labelKey: 'name', sizeKey: 'size', tile: { glow: ON } },
        HIERARCHY_SHADOW_DATA,
        (o) => o.tile.highlight,
        [...ITEM, ...BRANCH],
    ],
    [
        'treemap group',
        { type: 'treemap', labelKey: 'name', sizeKey: 'size', group: { glow: ON } },
        HIERARCHY_SHADOW_DATA,
        (o) => o.group.highlight,
        ITEM,
    ],
    [
        'sunburst',
        { type: 'sunburst', labelKey: 'name', sizeKey: 'size', glow: ON },
        HIERARCHY_SHADOW_DATA,
        (o) => o.highlight,
        [...ITEM, ...BRANCH],
    ],
    [
        'sankey node',
        { type: 'sankey', fromKey: 'from', toKey: 'to', sizeKey: 'size', node: { glow: ON } },
        FLOW,
        (o) => o.highlight,
        ITEM,
    ],
    [
        'sankey link',
        { type: 'sankey', fromKey: 'from', toKey: 'to', sizeKey: 'size', link: { glow: ON } },
        FLOW,
        (o) => o.highlight,
        ITEM,
    ],
    [
        'chord node',
        { type: 'chord', fromKey: 'from', toKey: 'to', sizeKey: 'size', node: { glow: ON } },
        FLOW,
        (o) => o.highlight,
        ITEM,
    ],
    [
        'chord link',
        { type: 'chord', fromKey: 'from', toKey: 'to', sizeKey: 'size', link: { glow: ON } },
        FLOW,
        (o) => o.highlight,
        ITEM,
    ],
    [
        'waterfall positive',
        { type: 'waterfall', xKey: 'x', yKey: 'y', item: { positive: { glow: ON } } },
        WATERFALL,
        (o) => o.highlight,
        ITEM,
    ],
    [
        'waterfall total',
        { type: 'waterfall', xKey: 'x', yKey: 'y', item: { total: { glow: ON } } },
        WATERFALL,
        (o) => o.highlight,
        ITEM,
    ],
    [
        'candlestick',
        {
            type: 'candlestick',
            xKey: 'x',
            openKey: 'open',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            glow: ON,
        },
        OHLC,
        (o) => o.highlight,
        [...ITEM, ...SERIES],
    ],
    [
        'heatmap',
        { type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'value', glow: ON },
        HEATMAP,
        (o) => o.highlight,
        ITEM,
    ],
    [
        'hlc marker',
        { type: 'hlc', xKey: 'x', highKey: 'high', lowKey: 'low', closeKey: 'close', marker: MARKER },
        OHLC,
        (o) => o.highlight,
        [...ITEM, ...SERIES],
    ],
    [
        'range-area marker',
        { type: 'range-area', xKey: 'x', yLowKey: 'low', yHighKey: 'high', marker: MARKER },
        OHLC,
        (o) => o.highlight,
        [...ITEM, ...SERIES],
    ],
    [
        'radar-area marker',
        { type: 'radar-area', angleKey: 'x', radiusKey: 'high', marker: MARKER },
        OHLC,
        (o) => o.highlight,
        [...ITEM, ...SERIES],
    ],
    [
        'radar-line marker',
        { type: 'radar-line', angleKey: 'x', radiusKey: 'high', marker: MARKER },
        OHLC,
        (o) => o.highlight,
        [...ITEM, ...SERIES],
    ],
];

// The series with a `glow` on more than one part.
const PER_PART = new Set([
    'sankey node',
    'sankey link',
    'chord node',
    'chord link',
    'waterfall positive',
    'waterfall total',
    'hlc marker',
    'range-area marker',
]);

describe('series glow theme', () => {
    setupMockConsole();
    setupMockCanvas();

    const create = (series: object, data: object[]) =>
        createEnterpriseChart({
            data,
            animation: { enabled: false },
            legend: { enabled: false },
            series: [series],
        } as AgChartOptions);

    const SINGLE_PART = CASES.filter(([name]) => !PER_PART.has(name));
    const MULTI_PART = CASES.filter(([name]) => PER_PART.has(name));

    it.each(SINGLE_PART)(
        '%s turns on the buckets it falls back to',
        async (_name, series, data, highlightOf, buckets) => {
            const chart: any = await create(series, data);
            const highlight = highlightOf(getSeriesOptions<any>(chart));
            expect(buckets.map((bucket) => [bucket, highlight[bucket].glow.enabled])).toEqual(
                buckets.map((bucket) => [bucket, true])
            );
            chart.destroy();
        }
    );

    // A bucket that has no `glow` of its own has no one value to follow, so it leaves each part to its own `glow`.
    it.each(MULTI_PART)(
        '%s leaves a bucket with no glow to each part',
        async (_name, series, data, highlightOf, buckets) => {
            const chart: any = await create(series, data);
            const highlight = highlightOf(getSeriesOptions<any>(chart));
            expect(buckets.map((bucket) => [bucket, highlight[bucket]?.glow?.enabled])).toEqual(
                buckets.map((bucket) => [bucket, undefined])
            );
            chart.destroy();
        }
    );

    // The theme cannot tell a user's `enabled` from its own, so it is left to the options graph to enable a bucket that
    // the user gave a `glow`, whatever the parts do.
    it.each(MULTI_PART)(
        '%s turns on a bucket that the user gives a glow, and only that one',
        async (_name, series, data, highlightOf, buckets) => {
            const chart: any = await create(
                { ...series, highlight: { [buckets[0]]: { glow: { fill: 'red' } } } },
                data
            );
            const highlight = highlightOf(getSeriesOptions<any>(chart));
            expect(buckets.map((bucket) => [bucket, highlight[bucket]?.glow?.enabled])).toEqual(
                buckets.map((bucket, index) => [bucket, index === 0 ? true : undefined])
            );
            chart.destroy();
        }
    );

    it('keeps the explicit enabled of a bucket glow', async () => {
        const [, series, data, highlightOf] = MULTI_PART[0];
        const chart: any = await create(
            { ...series, highlight: { highlightedItem: { glow: { enabled: false, fill: 'red' } } } },
            data
        );
        expect(highlightOf(getSeriesOptions<any>(chart)).highlightedItem.glow.enabled).toBe(false);
        chart.destroy();
    });

    it('turns the buckets off when nothing glows', async () => {
        const base = { type: 'sankey', fromKey: 'from', toKey: 'to', sizeKey: 'size' };
        const chart: any = await create(base, FLOW);
        const { highlight } = getSeriesOptions<any>(chart);
        expect(ITEM.map((bucket) => highlight[bucket]?.glow?.enabled === true)).toEqual([false, false]);
        chart.destroy();
    });
});
