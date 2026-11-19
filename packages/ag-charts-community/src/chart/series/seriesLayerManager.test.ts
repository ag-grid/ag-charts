import { afterEach, describe, expect, it } from 'vitest';

import { Group, SeriesZIndexMap } from 'ag-charts-core';
import type { AgCartesianSeriesOptions, AgChartOptions } from 'ag-charts-types';

import type { Chart } from '../chart';
import { getPlacedLabelData } from '../test/communitySeriesAccessors';
import {
    createChart,
    deproxy,
    getSeriesPaintOrder,
    hoverLegendItem,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import { SeriesLayerManager } from './seriesLayerManager';

type SeriesConfig = Parameters<SeriesLayerManager['requestGroup']>[0];

interface SeriesSpec {
    id: string;
    type: string;
    order: number;
    groupIndex?: number;
    raised?: boolean;
    hovered?: boolean;
}

function seriesConfig(spec: SeriesSpec): SeriesConfig {
    const { id, type, order, groupIndex } = spec;
    return {
        internalId: id,
        type,
        declarationOrder: order,
        seriesGrouping: groupIndex == null ? undefined : { groupIndex, groupCount: 1, stackIndex: 0, stackCount: 1 },
        contentGroup: new Group({ name: id, zIndex: [SeriesZIndexMap.ANY_CONTENT, order] }),
        bringToFront: () => spec.raised === true || spec.hovered === true,
        raisedAtRest: () => spec.raised === true,
        renderToOffscreenCanvas: () => false,
    };
}

describe('SeriesLayerManager', () => {
    describe('at-rest paint order', () => {
        it.each<{ case: string; seriesCount?: number; series: SeriesSpec[]; expected: Record<string, number> }>([
            {
                case: 'ranks series in declaration order',
                series: [
                    { id: 'a', type: 'line', order: 0 },
                    { id: 'b', type: 'line', order: 1 },
                    { id: 'c', type: 'line', order: 2 },
                ],
                expected: { a: 0, b: 1, c: 2 },
            },
            {
                case: 'ranks series sharing a layer in declaration order, not registration order',
                series: [
                    { id: 'b', type: 'bar', order: 1, groupIndex: 0 },
                    { id: 'a', type: 'bar', order: 0, groupIndex: 0 },
                ],
                expected: { a: 0, b: 1 },
            },
            {
                case: 'ranks a stacked series under an unrelated one declared before it',
                series: [
                    { id: 'a', type: 'bar', order: 0, groupIndex: 0 },
                    { id: 'b', type: 'line', order: 1 },
                    { id: 'c', type: 'bar', order: 2, groupIndex: 0 },
                ],
                expected: { a: 0, c: 1, b: 2 },
            },
            {
                case: 'ranks a series raised at rest over the others',
                series: [
                    { id: 'a', type: 'line', order: 0, raised: true },
                    { id: 'b', type: 'line', order: 1 },
                    { id: 'c', type: 'line', order: 2 },
                ],
                expected: { b: 0, c: 1, a: 2 },
            },
            {
                case: 'ignores a series raised by a highlight',
                series: [
                    { id: 'a', type: 'line', order: 0, hovered: true },
                    { id: 'b', type: 'line', order: 1 },
                    { id: 'c', type: 'line', order: 2 },
                ],
                expected: { a: 0, b: 1, c: 2 },
            },
            {
                case: 'ranks a highlighted stacked series within its stack',
                series: [
                    { id: 'a', type: 'bar', order: 0, groupIndex: 0 },
                    { id: 'b', type: 'line', order: 1 },
                    { id: 'c', type: 'bar', order: 2, groupIndex: 0, hovered: true },
                ],
                expected: { a: 0, c: 1, b: 2 },
            },
            {
                case: 'gives series raised at rest together a shared rank',
                series: [
                    { id: 'a', type: 'line', order: 0, raised: true },
                    { id: 'b', type: 'line', order: 1, raised: true },
                    { id: 'c', type: 'line', order: 2 },
                ],
                expected: { c: 0, a: 1, b: 1 },
            },
            {
                case: 'ranks by the shared layers of 30 or more series',
                seriesCount: 60,
                series: [
                    { id: 'line-0', type: 'line', order: 0 },
                    { id: 'scatter-1', type: 'scatter', order: 1 },
                    { id: 'line-1', type: 'line', order: 2 },
                ],
                expected: { 'line-0': 0, 'line-1': 1, 'scatter-1': 2 },
            },
        ])('$case', ({ seriesCount, series, expected }) => {
            const manager = new SeriesLayerManager(new Group());
            manager.setSeriesCount(seriesCount ?? series.length);
            for (const spec of series) {
                manager.requestGroup(seriesConfig(spec));
            }
            expect(Object.fromEntries(manager.atRestPaintOrder())).toEqual(expected);
        });

        it.each<{
            case: string;
            seriesCount?: number;
            series: SeriesSpec[];
            change: (series: SeriesSpec[], manager: SeriesLayerManager) => void;
            expected: Record<string, number>;
        }>([
            {
                case: 'a series lowered',
                series: [
                    { id: 'a', type: 'line', order: 0, raised: true },
                    { id: 'b', type: 'line', order: 1 },
                ],
                change: ([a]) => (a.raised = false),
                expected: { b: 0, a: 1 },
            },
            {
                case: 'a series raised',
                series: [
                    { id: 'a', type: 'line', order: 0 },
                    { id: 'b', type: 'line', order: 1 },
                ],
                change: ([a]) => (a.raised = true),
                expected: { a: 0, b: 1 },
            },
            {
                case: 'the series count changed',
                seriesCount: 60,
                series: [
                    { id: 'line-0', type: 'line', order: 0 },
                    { id: 'scatter-1', type: 'scatter', order: 1 },
                    { id: 'line-1', type: 'line', order: 2 },
                ],
                change: (_series, manager) => manager.setSeriesCount(3),
                expected: { 'line-0': 0, 'line-1': 1, 'scatter-1': 2 },
            },
        ])(
            'keeps the layers it assigned when $case without a regrouping',
            ({ seriesCount, series, change, expected }) => {
                const manager = new SeriesLayerManager(new Group());
                manager.setSeriesCount(seriesCount ?? series.length);
                for (const spec of series) {
                    manager.requestGroup(seriesConfig(spec));
                }
                change(series, manager);
                expect(Object.fromEntries(manager.atRestPaintOrder())).toEqual(expected);
            }
        );
    });

    describe('at-rest paint order against the rendered scene', () => {
        setupMockConsole();
        setupMockCanvas();

        let chart: Chart;
        afterEach(() => {
            chart?.destroy();
        });

        const data = [
            { x: 'A', a: 1, b: 2, c: 3 },
            { x: 'B', a: 2, b: 3, c: 1 },
        ].map((row, offset) => ({
            ...row,
            ...Object.fromEntries(Array.from({ length: 60 }, (_, index) => [`v${index}`, index + offset])),
        }));

        const options = (series: AgCartesianSeriesOptions[], legend = false): AgChartOptions => ({
            data,
            animation: { enabled: false },
            legend: { enabled: legend },
            series,
        });

        const lineAndScatter = (count: number) =>
            Array.from({ length: count }, (_, index): AgCartesianSeriesOptions => {
                const type = index % 2 === 0 ? 'line' : 'scatter';
                return { id: `${type}-${index}`, type, xKey: 'x', yKey: `v${index}` };
            });

        const FIXTURES: { name: string; series: AgCartesianSeriesOptions[]; sharesLayer: boolean }[] = [
            {
                name: 'plain series with ids of their own',
                series: [
                    { id: 'first', type: 'line', xKey: 'x', yKey: 'a' },
                    { id: 'second', type: 'line', xKey: 'x', yKey: 'b' },
                    { id: 'third', type: 'line', xKey: 'x', yKey: 'c' },
                ],
                sharesLayer: false,
            },
            {
                name: 'a stacked group with an unrelated series declared between its members',
                series: [
                    { type: 'bar', xKey: 'x', yKey: 'a', stacked: true },
                    { type: 'line', xKey: 'x', yKey: 'b' },
                    { type: 'bar', xKey: 'x', yKey: 'c', stacked: true },
                ],
                sharesLayer: true,
            },
            {
                name: '32 grouped bar series packed into fewer layers',
                series: Array.from({ length: 32 }, (_, index) => ({ type: 'bar', xKey: 'x', yKey: `v${index}` })),
                sharesLayer: true,
            },
        ];

        const rankOrder = () => {
            const { drawn, ranks } = getSeriesPaintOrder(chart);
            return { drawn, drawnRanks: drawn.map((id) => ranks.get(id)), ranks };
        };

        const expectRanksInDrawnOrder = (seriesCount: number) => {
            const { drawn, drawnRanks } = rankOrder();
            expect(drawn).toHaveLength(seriesCount);
            expect(drawnRanks).toEqual(drawn.map((_, index) => index));
            expect(new Set(getSeriesPaintOrder(chart).labelsAfterContent)).toEqual(new Set(drawn));
        };

        it.each(FIXTURES)('ranks $name in the order the scene draws them', async ({ series, sharesLayer }) => {
            chart = deproxy(await createChart(options(series)));

            expect(getSeriesPaintOrder(chart).layers.some((layer) => layer.length > 1)).toBe(sharesLayer);
            expectRanksInDrawnOrder(series.length);
        });

        it('ranks the series kept by an update that removes others in the order the scene draws them', async () => {
            const proxy = await createChart(options(lineAndScatter(60)));
            chart = deproxy(proxy);

            await proxy.update(prepareTestOptions(options(lineAndScatter(40))));
            await waitForChartStability(chart);

            expectRanksInDrawnOrder(40);
        });

        it('keeps the ranks while a highlight raises a series', async () => {
            chart = deproxy(await createChart(options(FIXTURES[1].series, true)));
            const before = rankOrder();

            await hoverLegendItem(chart, 1);
            await waitForChartStability(chart);

            const hovered = rankOrder();
            expect(hovered.drawn).not.toEqual(before.drawn);
            expect(hovered.ranks).toEqual(before.ranks);
        });

        it('keeps a marker drawn over the later of two series sharing a layer as an obstacle to its inside label', async () => {
            const label = { enabled: true, collision: { alwaysShow: false } };
            const marker = { enabled: true, size: 30 };
            // Thirty more series pack layers by internal id, putting `lower` and `upper` in one.
            const filler = (from: number, count: number) =>
                Array.from({ length: count }, (_, index): AgCartesianSeriesOptions => {
                    return { type: 'line', xKey: 'x', yKey: `f${from + index}` };
                });
            const series: AgCartesianSeriesOptions[] = [
                ...filler(0, 10),
                { id: 'lower', type: 'line', xKey: 'x', yKey: 'a', marker },
                {
                    id: 'between',
                    type: 'scatter',
                    xKey: 'x',
                    yKey: 'top',
                    labelKey: 'x',
                    size: 10,
                    label: { ...label, placement: 'bottom' },
                },
                { id: 'upper', type: 'line', xKey: 'x', yKey: 'c', marker, label: { ...label, placement: 'inside' } },
                ...filler(10, 20),
            ];
            chart = deproxy(
                await createChart({
                    ...options(series),
                    data: [
                        { x: 'A', a: 1, c: 4, top: 4 },
                        { x: 'B', a: 2, c: 6 },
                        { x: 'C', ...Object.fromEntries(Array.from({ length: 30 }, (_, index) => [`f${index}`, 0])) },
                    ],
                })
            );

            const { layers, ranks } = getSeriesPaintOrder(chart);
            expect(layers).toContainEqual(['lower', 'upper']);
            expect(['lower', 'upper', 'between'].map((id) => ranks.get(id))).toEqual([10, 11, 12]);
            expectRanksInDrawnOrder(series.length);
            const upper = chart.series.findIndex(({ id }) => id === 'upper');
            expect(getPlacedLabelData(chart, upper).map((placed) => placed.datum.label.text)).toEqual(['6']);
        });
    });
});
