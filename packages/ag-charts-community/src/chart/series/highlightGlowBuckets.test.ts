import { afterEach, describe, expect, it } from 'vitest';

import { Rect, Sector, Transformable } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { Chart } from '../chart';
import { Marker } from '../marker/marker';
import { getLegendItemNodes, getSeriesAt, getSeriesNodeData } from '../test/seriesAccessors';
import { HIGHLIGHT_GLOW, SERIES_SHADOW, XY_DATA, glowShadow, shapesOf } from '../test/shadowFixtures';
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
            expect(highlighted(0)[0].fillShadow).toMatchObject(GLOW_SHADOW);
        });

        it('casts highlightedSeries.glow from the other items of the hovered series, in the base pass', async () => {
            const { inPlace } = await hover({ highlightedSeries: { glow: HIGHLIGHT_GLOW } });
            const [hovered, ...others] = inPlace(0);
            expect(hovered).toBeDefined();
            for (const rect of others) expect(rect.fillShadow).toMatchObject(GLOW_SHADOW);
        });

        it('casts unhighlightedItem.glow from the other items of the hovered series, in the base pass', async () => {
            const { inPlace } = await hover({ unhighlightedItem: { glow: HIGHLIGHT_GLOW } });
            const [, ...others] = inPlace(0);
            for (const rect of others) expect(rect.fillShadow).toMatchObject(GLOW_SHADOW);
        });

        it('casts unhighlightedSeries.glow from every item of the other series, in the base pass', async () => {
            const { inPlace } = await hover({ unhighlightedSeries: { glow: HIGHLIGHT_GLOW } });
            expect(inPlace(1).length).toBeGreaterThan(0);
            for (const rect of inPlace(1)) expect(rect.fillShadow).toMatchObject(GLOW_SHADOW);
        });

        // An item has one shadow slot: a state whose glow is enabled replaces the item's base shadow, never merging with it.
        describe('one shadow slot', () => {
            it('replaces the base shadow of the other items of the hovered series with unhighlightedItem.glow', async () => {
                const { inPlace } = await hover({ unhighlightedItem: { glow: HIGHLIGHT_GLOW } }, SERIES_SHADOW);
                const [hovered, ...others] = inPlace(0);

                expect(hovered.fillShadow).toMatchObject(SERIES_SHADOW);
                expect(others.length).toBeGreaterThan(0);
                for (const rect of others) {
                    expect(rect.fillShadow).toMatchObject(GLOW_SHADOW);
                    expect(rect.fillShadow?.color).not.toBe(SERIES_SHADOW.color);
                }
                // The other series is in no glowing state, so it keeps its shadow.
                for (const rect of inPlace(1)) expect(rect.fillShadow).toMatchObject(SERIES_SHADOW);
            });

            it('swaps the glow and the base shadow between the two items when the hover moves from one to the next', async () => {
                const { inPlace, moveTo } = await hover({ unhighlightedItem: { glow: HIGHLIGHT_GLOW } }, SERIES_SHADOW);
                const [first, second, third] = inPlace(0);
                expect(first.fillShadow).toMatchObject(SERIES_SHADOW);
                expect(second.fillShadow).toMatchObject(GLOW_SHADOW);

                await moveTo(1);

                // The item the hover left now glows as one of the others, and the item it reached keeps its shadow.
                expect(first.fillShadow).toMatchObject(GLOW_SHADOW);
                expect(second.fillShadow).toMatchObject(SERIES_SHADOW);
                expect(third.fillShadow).toMatchObject(GLOW_SHADOW);
            });

            it('replaces the base shadow of every item of the other series with unhighlightedSeries.glow', async () => {
                const { inPlace } = await hover({ unhighlightedSeries: { glow: HIGHLIGHT_GLOW } }, SERIES_SHADOW);

                for (const rect of inPlace(1)) expect(rect.fillShadow).toMatchObject(GLOW_SHADOW);
                for (const rect of inPlace(0)) expect(rect.fillShadow).toMatchObject(SERIES_SHADOW);
            });

            it('keeps the base shadow where the state glow is disabled', async () => {
                const { inPlace, highlighted } = await hover(
                    { highlightedSeries: { glow: { ...HIGHLIGHT_GLOW, enabled: false } } },
                    SERIES_SHADOW
                );

                for (const rect of [...inPlace(0), ...inPlace(1)]) expect(rect.fillShadow).toMatchObject(SERIES_SHADOW);
                expect(highlighted(0)[0].fillShadow?.enabled).not.toBe(true);
            });

            it("keeps the hovered item's in-place shadow beneath the glowing copy of the highlight layer", async () => {
                const { inPlace, highlighted } = await hover(
                    { highlightedSeries: { glow: HIGHLIGHT_GLOW } },
                    SERIES_SHADOW
                );

                expect(inPlace(0)[0].fillShadow).toMatchObject(SERIES_SHADOW);
                expect(highlighted(0)[0].fillShadow).toMatchObject(GLOW_SHADOW);
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

    // The flag that asks a series for a full redraw is protected on `Series`.
    const hasChangesOnHighlight = (seriesIndex: number) =>
        (getSeriesAt(chart, seriesIndex) as unknown as { hasChangesOnHighlight: boolean }).hasChangesOnHighlight;

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

        expect(hasChangesOnHighlight(0)).toBe(true);
        expect(hasChangesOnHighlight(1)).toBe(false);
        expect(hasChangesOnHighlight(2)).toBe(false);
    });

    it('redraws the two series involved when the hover moves from one to the other', async () => {
        const highlight = { unhighlightedItem: { glow: HIGHLIGHT_GLOW } };
        await create(
            ['v', 'w', 'x'].map((yKey) => ({ type: 'bar', xKey: 'x', yKey, shadow: SERIES_SHADOW, highlight }))
        );
        await hoverDatum(0, 0);
        await hoverDatum(1, 0);

        expect(hasChangesOnHighlight(0)).toBe(true);
        expect(hasChangesOnHighlight(1)).toBe(true);
        expect(hasChangesOnHighlight(2)).toBe(false);
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

    const sectorShadow = (seriesIndex: number, group: 'contentGroup' | 'highlightNodeGroup', datumIndex: number) =>
        shapesOf(getSeriesAt(chart, seriesIndex)[group], Sector).find(
            (sector) => (sector.datum as { datumIndex: number } | undefined)?.datumIndex === datumIndex
        )?.fillShadow;

    // The highlight layer's copy casts the glow of the `Item` state, which `highlightedSeries.glow` falls back to.
    it.each([
        ['highlightedSeries', { highlightedSeries: { glow: HIGHLIGHT_GLOW } }, GLOW_SHADOW],
        ['unhighlightedItem', { unhighlightedItem: { glow: HIGHLIGHT_GLOW } }, undefined],
    ])(
        "keeps the linked ring's in-place sector shadow beneath its highlight copy with %s.glow",
        async (_name, highlight, copyShadow) => {
            await hoverFirstLegendItem(highlight);

            // Both rings redraw their sector 0 on the highlight layer, so neither in-place copy gives up its shadow.
            for (const seriesIndex of [0, 1]) {
                expect(sectorShadow(seriesIndex, 'contentGroup', 0)).toMatchObject(SERIES_SHADOW);
                const copy = sectorShadow(seriesIndex, 'highlightNodeGroup', 0);
                if (copyShadow) {
                    expect(copy).toMatchObject(copyShadow);
                } else {
                    expect(copy?.enabled).not.toBe(true);
                }
            }
        }
    );
});
