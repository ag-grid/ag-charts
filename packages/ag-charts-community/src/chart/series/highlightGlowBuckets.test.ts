import { afterEach, describe, expect, it } from 'vitest';

import { Rect, Sector, Transformable } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { Chart } from '../chart';
import { Marker } from '../marker/marker';
import {
    getLegendItemNodes,
    getSeriesAt,
    getSeriesHasChangesOnHighlight,
    getSeriesNodeData,
} from '../test/seriesAccessors';
import { HIGHLIGHT_GLOW, HIGHLIGHT_SHADOW, SERIES_SHADOW, XY_DATA, glowShadow, shapesOf } from '../test/shadowFixtures';
import {
    createChart,
    deproxy,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

const GLOW_SHADOW = glowShadow(HIGHLIGHT_GLOW);

interface SeriesCase {
    name: string;
    /** The options of one series over the shared data, with `shadow` where the series reads it from. */
    series: (key: 'v' | 'w', shadow: object | undefined, highlight: object) => object;
    kind: abstract new (...args: any[]) => Shape;
}

// The bar rects go through the item style path, the markers through `applyMarkerStyle`.
const SERIES: SeriesCase[] = [
    {
        name: 'bar',
        kind: Rect,
        series: (key, shadow, highlight) => ({ type: 'bar', xKey: 'x', yKey: key, shadow, highlight }),
    },
    {
        name: 'scatter',
        kind: Marker,
        series: (key, shadow, highlight) => ({ type: 'scatter', xKey: 'x', yKey: key, shadow, highlight }),
    },
    {
        name: 'line markers',
        kind: Marker,
        series: (key, shadow, highlight) => ({
            type: 'line',
            xKey: 'x',
            yKey: key,
            marker: { enabled: true, shadow },
            highlight,
        }),
    },
];

const DATA = XY_DATA.map(({ x, y }, i) => ({ x, v: y, w: i + 2 }));

describe.each(SERIES)(
    'glow on the buckets other than highlightedItem ($name, two series, first item of the first hovered)',
    ({ series, kind }) => {
        setupMockConsole();
        setupMockCanvas();
        let chart: Chart;
        afterEach(() => chart?.destroy());

        const hover = async (highlight: object, shadow?: object) => {
            chart = deproxy(
                await createChart({
                    data: DATA,
                    animation: { enabled: false },
                    legend: { enabled: false },
                    series: [series('v', shadow, highlight), series('w', shadow, highlight)],
                } as AgChartOptions)
            );
            chart.ctx.highlightManager.updateHighlight(chart.id, getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
            await waitForChartStability(chart);
            const inPlace = (i: number) => shapesOf(getSeriesAt(chart, i).contentGroup, kind);
            const highlighted = (i: number) =>
                shapesOf(getSeriesAt(chart, i).highlightNodeGroup, kind).filter((r) => r.visible);
            const moveTo = async (datumIndex: number) => {
                chart.ctx.highlightManager.updateHighlight(
                    chart.id,
                    getSeriesNodeData<HighlightNodeDatum>(chart)[datumIndex]
                );
                await waitForChartStability(chart);
            };
            return { inPlace, highlighted, moveTo };
        };

        it('casts highlightedSeries.glow from the hovered item when highlightedItem sets none', async () => {
            const { highlighted } = await hover({ highlightedSeries: { glow: HIGHLIGHT_GLOW } });
            expect(highlighted(0)[0].fillGlow).toMatchObject(GLOW_SHADOW);
        });

        it('casts highlightedSeries.glow from the other items of the hovered series, in the base pass', async () => {
            const { inPlace } = await hover({ highlightedSeries: { glow: HIGHLIGHT_GLOW } });
            const [hovered, ...others] = inPlace(0);
            expect(hovered).toBeDefined();
            for (const rect of others) expect(rect.fillGlow).toMatchObject(GLOW_SHADOW);
        });

        it('casts unhighlightedItem.glow from the other items of the hovered series, in the base pass', async () => {
            const { inPlace } = await hover({ unhighlightedItem: { glow: HIGHLIGHT_GLOW } });
            const [, ...others] = inPlace(0);
            for (const rect of others) expect(rect.fillGlow).toMatchObject(GLOW_SHADOW);
        });

        it('casts unhighlightedSeries.glow from every item of the other series, in the base pass', async () => {
            const { inPlace } = await hover({ unhighlightedSeries: { glow: HIGHLIGHT_GLOW } });
            expect(inPlace(1).length).toBeGreaterThan(0);
            for (const rect of inPlace(1)) expect(rect.fillGlow).toMatchObject(GLOW_SHADOW);
        });

        // An item has two slots: a state's glow never replaces or merges with the base shadow, which every item keeps.
        describe('two slots', () => {
            it('casts unhighlightedItem.glow from the other items of the hovered series, beside the base shadow', async () => {
                const { inPlace } = await hover({ unhighlightedItem: { glow: HIGHLIGHT_GLOW } }, SERIES_SHADOW);
                const [hovered, ...others] = inPlace(0);

                // The hovered item is not among the others, so its in-place copy casts no glow.
                expect(hovered.fillShadow).toMatchObject(SERIES_SHADOW);
                expect(hovered.fillGlow?.enabled).not.toBe(true);
                expect(others.length).toBeGreaterThan(0);
                for (const rect of others) {
                    expect(rect.fillShadow).toMatchObject(SERIES_SHADOW);
                    expect(rect.fillGlow).toMatchObject(GLOW_SHADOW);
                }
                // The other series is in no glowing state, so it casts its shadow alone.
                for (const rect of inPlace(1)) {
                    expect(rect.fillShadow).toMatchObject(SERIES_SHADOW);
                    expect(rect.fillGlow?.enabled).not.toBe(true);
                }
            });

            it('moves the glow between the two items when the hover moves from one to the next', async () => {
                const { inPlace, moveTo } = await hover({ unhighlightedItem: { glow: HIGHLIGHT_GLOW } }, SERIES_SHADOW);
                const [first, second, third] = inPlace(0);
                expect(first.fillGlow?.enabled).not.toBe(true);
                expect(second.fillGlow).toMatchObject(GLOW_SHADOW);

                await moveTo(1);

                // The item the hover left now glows as one of the others, and the item it reached casts no glow.
                expect(first.fillGlow).toMatchObject(GLOW_SHADOW);
                expect(second.fillGlow?.enabled).not.toBe(true);
                expect(third.fillGlow).toMatchObject(GLOW_SHADOW);
                for (const rect of [first, second, third]) expect(rect.fillShadow).toMatchObject(SERIES_SHADOW);
            });

            it('casts unhighlightedSeries.glow from every item of the other series, beside the base shadow', async () => {
                const { inPlace } = await hover({ unhighlightedSeries: { glow: HIGHLIGHT_GLOW } }, SERIES_SHADOW);

                for (const rect of inPlace(1)) expect(rect.fillGlow).toMatchObject(GLOW_SHADOW);
                for (const rect of inPlace(0)) expect(rect.fillGlow?.enabled).not.toBe(true);
                for (const rect of [...inPlace(0), ...inPlace(1)]) expect(rect.fillShadow).toMatchObject(SERIES_SHADOW);
            });

            it('keeps the base shadow where the state glow is disabled', async () => {
                const { inPlace, highlighted } = await hover(
                    { highlightedSeries: { glow: { ...HIGHLIGHT_GLOW, enabled: false } } },
                    SERIES_SHADOW
                );

                for (const rect of [...inPlace(0), ...inPlace(1)]) {
                    expect(rect.fillShadow).toMatchObject(SERIES_SHADOW);
                    expect(rect.fillGlow?.enabled).not.toBe(true);
                }
                expect(highlighted(0)[0].fillGlow?.enabled).not.toBe(true);
            });

            it("keeps the hovered item's in-place shadow beneath the glowing copy of the highlight layer", async () => {
                const { inPlace, highlighted } = await hover(
                    { highlightedSeries: { glow: HIGHLIGHT_GLOW } },
                    SERIES_SHADOW
                );

                expect(inPlace(0)[0].fillShadow).toMatchObject(SERIES_SHADOW);
                expect(highlighted(0)[0].fillGlow).toMatchObject(GLOW_SHADOW);
                expect(highlighted(0)[0].fillShadow?.enabled).not.toBe(true);
            });
        });
    }
);

describe('glow when the hover moves between series', () => {
    setupMockConsole();
    setupMockCanvas();
    let chart: Chart;
    afterEach(() => chart?.destroy());

    const create = async (seriesOptions: object[]) => {
        chart = deproxy(
            await createChart({
                data: DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                series: seriesOptions,
            } as AgChartOptions)
        );
    };

    const hoverDatum = async (seriesIndex: number, datumIndex: number) => {
        chart.ctx.highlightManager.updateHighlight(
            chart.id,
            getSeriesNodeData<HighlightNodeDatum>(chart, seriesIndex)[datumIndex]
        );
        await waitForChartStability(chart);
    };

    it('redraws only the series whose redrawn item changes when the hover moves between items', async () => {
        const highlight = { unhighlightedItem: { glow: HIGHLIGHT_GLOW } };
        await create(
            ['v', 'w', 'x'].map((yKey) => ({ type: 'bar', xKey: 'x', yKey, shadow: SERIES_SHADOW, highlight }))
        );
        await hoverDatum(0, 0);
        await hoverDatum(0, 1);

        expect(getSeriesHasChangesOnHighlight(chart, 0)).toBe(true);
        expect(getSeriesHasChangesOnHighlight(chart, 1)).toBe(false);
        expect(getSeriesHasChangesOnHighlight(chart, 2)).toBe(false);
    });

    it('redraws the two series involved when the hover moves from one to the other', async () => {
        const highlight = { unhighlightedItem: { glow: HIGHLIGHT_GLOW } };
        await create(
            ['v', 'w', 'x'].map((yKey) => ({ type: 'bar', xKey: 'x', yKey, shadow: SERIES_SHADOW, highlight }))
        );
        await hoverDatum(0, 0);
        await hoverDatum(1, 0);

        expect(getSeriesHasChangesOnHighlight(chart, 0)).toBe(true);
        expect(getSeriesHasChangesOnHighlight(chart, 1)).toBe(true);
        expect(getSeriesHasChangesOnHighlight(chart, 2)).toBe(false);
    });
});

describe('glow on rings linked through legendItemKey', () => {
    setupMockConsole();
    setupMockCanvas();
    let chart: Chart;
    afterEach(() => chart?.destroy());

    const RING_DATA = [
        { browser: 'Chrome', share: 0.6 },
        { browser: 'Safari', share: 0.3 },
        { browser: 'Other', share: 0.1 },
    ];

    const hoverFirstLegendItem = async (highlight: object) => {
        chart = deproxy(
            await createChart({
                animation: { enabled: false },
                series: [
                    {
                        type: 'donut',
                        data: RING_DATA,
                        angleKey: 'share',
                        legendItemKey: 'browser',
                        outerRadiusRatio: 0.5,
                        shadow: SERIES_SHADOW,
                        highlight,
                    },
                    {
                        type: 'donut',
                        data: RING_DATA,
                        angleKey: 'share',
                        legendItemKey: 'browser',
                        innerRadiusRatio: 0.6,
                        shadow: SERIES_SHADOW,
                        showInLegend: false,
                        highlight,
                    },
                ],
            } as AgChartOptions)
        );
        const { x, y } = Transformable.toCanvas(getLegendItemNodes(chart)[0]).computeCenter();
        await hoverAction(x, y)(chart);
        await waitForChartStability(chart);
    };

    const sector = (seriesIndex: number, group: 'contentGroup' | 'highlightNodeGroup', datumIndex: number) =>
        shapesOf(getSeriesAt(chart, seriesIndex)[group], Sector).find(
            (candidate) => (candidate.datum as { datumIndex: number } | undefined)?.datumIndex === datumIndex
        );

    // The highlight layer's copy casts the glow of the `Item` state, which `highlightedSeries.glow` falls back to.
    it.each([
        ['highlightedSeries', { highlightedSeries: { glow: HIGHLIGHT_GLOW } }, GLOW_SHADOW],
        ['unhighlightedItem', { unhighlightedItem: { glow: HIGHLIGHT_GLOW } }, undefined],
    ])(
        "keeps the linked ring's in-place sector shadow beneath its highlight copy with %s.glow",
        async (_name, highlight, copyGlow) => {
            await hoverFirstLegendItem(highlight);

            // Both rings redraw their sector 0 on the highlight layer, so neither in-place copy gives up its shadow.
            for (const seriesIndex of [0, 1]) {
                expect(sector(seriesIndex, 'contentGroup', 0)?.fillShadow).toMatchObject(SERIES_SHADOW);
                const copy = sector(seriesIndex, 'highlightNodeGroup', 0);
                expect(copy?.fillShadow?.enabled).not.toBe(true);
                if (copyGlow) {
                    expect(copy?.fillGlow).toMatchObject(copyGlow);
                } else {
                    expect(copy?.fillGlow?.enabled).not.toBe(true);
                }
            }
        }
    );

    it("casts highlightedItem.shadow from the linked ring's matching sector, as the glow follows it", async () => {
        await hoverFirstLegendItem({ highlightedItem: { shadow: HIGHLIGHT_SHADOW, glow: HIGHLIGHT_GLOW } });

        for (const seriesIndex of [0, 1]) {
            // The in-place sector that the highlight layer redraws swaps its shadow, and gives up its glow to the copy.
            expect(sector(seriesIndex, 'contentGroup', 0)?.fillShadow).toMatchObject(HIGHLIGHT_SHADOW);
            expect(sector(seriesIndex, 'contentGroup', 0)?.fillGlow?.enabled).not.toBe(true);
            expect(sector(seriesIndex, 'highlightNodeGroup', 0)?.fillGlow).toMatchObject(GLOW_SHADOW);
            for (const datumIndex of [1, 2]) {
                expect(sector(seriesIndex, 'contentGroup', datumIndex)?.fillShadow).toMatchObject(SERIES_SHADOW);
            }
        }
    });
});

describe('highlightedItem.shadow with highlight.mode: shared', () => {
    setupMockConsole();
    setupMockCanvas();
    let chart: Chart;
    afterEach(() => chart?.destroy());

    const CATEGORIES = [
        { x: 1, v: 5, w: 7 },
        { x: 2, v: 8, w: 4 },
    ];

    const createShared = async () => {
        chart = deproxy(
            await createChart({
                data: CATEGORIES,
                animation: { enabled: false },
                legend: { enabled: false },
                highlight: { mode: 'shared' },
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                series: (['v', 'w'] as const).map((yKey) => ({
                    type: 'bar',
                    xKey: 'x',
                    yKey,
                    shadow: SERIES_SHADOW,
                    highlight: { highlightedItem: { shadow: HIGHLIGHT_SHADOW } },
                })),
            } as AgChartOptions)
        );
    };

    /**
     * Options cannot clear the opacity that the theme gives the dimmed items, so it is dropped from the resolved options,
     * as a theme with none would leave them.
     */
    const dropDimming = () => {
        for (const series of chart.series) {
            const { unhighlightedItem, unhighlightedSeries } = (series as any).options.highlight;
            delete unhighlightedItem.opacity;
            delete unhighlightedSeries.opacity;
        }
    };

    const hover = async (datumIndex?: number) => {
        const datum = datumIndex == null ? undefined : getSeriesNodeData<HighlightNodeDatum>(chart, 0)[datumIndex];
        chart.ctx.highlightManager.updateHighlight(chart.id, datum);
        await waitForChartStability(chart);
    };

    /** The shadow that each bar of each series casts: the bucket's (`'item'`) or the series' own (`'series'`). */
    const castsOf = () =>
        [0, 1].map((seriesIndex) =>
            shapesOf(getSeriesAt(chart, seriesIndex).contentGroup, Rect).map((rect) =>
                rect.fillShadow?.fill === HIGHLIGHT_SHADOW.fill ? 'item' : 'series'
            )
        );

    it('casts the shadow from the items that share the hovered category, and from them alone', async () => {
        await createShared();
        await hover(0);

        // Series 0 holds the hovered bar; series 1 holds the bar that shares its category.
        expect(castsOf()).toEqual([
            ['item', 'series'],
            ['item', 'series'],
        ]);
        for (const seriesIndex of [0, 1]) {
            const [first, second] = shapesOf(getSeriesAt(chart, seriesIndex).contentGroup, Rect);
            expect(first.fillShadow).toMatchObject(HIGHLIGHT_SHADOW);
            expect(second.fillShadow).toMatchObject(SERIES_SHADOW);
        }
    });

    // With no state style on the dimmed items, only the cast itself tells the in-place nodes to redraw.
    it.each([
        ['with the theme dimming', { clearDimming: false }],
        ['with the dimming cleared', { clearDimming: true }],
    ])(
        'moves the shadow to the items of the next category, and takes it off when the hover ends, %s',
        async (_name, { clearDimming }) => {
            await createShared();
            if (clearDimming) dropDimming();
            await hover(0);
            await hover(1);
            expect(castsOf()).toEqual([
                ['series', 'item'],
                ['series', 'item'],
            ]);

            await hover();
            expect(castsOf()).toEqual([
                ['series', 'series'],
                ['series', 'series'],
            ]);
        }
    );
});
