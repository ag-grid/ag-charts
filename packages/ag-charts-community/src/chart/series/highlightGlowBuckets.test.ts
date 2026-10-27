import { afterEach, describe, expect, it } from 'vitest';

import { Rect } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { Marker } from '../marker/marker';
import { HIGHLIGHT_GLOW, SERIES_SHADOW, XY_DATA, glowShadow, shapesOf } from '../test/shadowFixtures';
import { createChart, deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from '../test/utils';

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
        let chart: any;
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
            chart.ctx.highlightManager.updateHighlight(chart.id, chart.series[0].getNodeData()[0]);
            await waitForChartStability(chart);
            const inPlace = (i: number) => shapesOf(chart.series[i].contentGroup, kind);
            const highlighted = (i: number) =>
                shapesOf(chart.series[i].highlightNodeGroup, kind).filter((r) => r.visible);
            const moveTo = async (datumIndex: number) => {
                chart.ctx.highlightManager.updateHighlight(chart.id, chart.series[0].getNodeData()[datumIndex]);
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
