import { afterEach, describe, expect, it } from 'vitest';

import { Group, Rect } from 'ag-charts-core';
import type { AgChartOptions, AgGlowOptions } from 'ag-charts-types';

import { SERIES_SHADOW } from '../test/shadowFixtures';
import { createChart, deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from '../test/utils';

const GLOW: AgGlowOptions = { enabled: true, color: '#00aa00', blur: 3, spread: 2 };
const GLOW_SHADOW = { ...GLOW, xOffset: 0, yOffset: 0 };
const DATA = [
    { c: 'A', v: 5, w: 2 },
    { c: 'B', v: 8, w: 3 },
    { c: 'C', v: 3, w: 4 },
];

const rects = (node: unknown, out: Rect[] = []) => {
    if (node instanceof Rect) out.push(node);
    if (node instanceof Group) for (const child of node.children()) rects(child, out);
    return out;
};

describe('glow on the buckets other than highlightedItem (two bar series, first item of the first hovered)', () => {
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
                series: [
                    { type: 'bar', xKey: 'c', yKey: 'v', shadow, highlight },
                    { type: 'bar', xKey: 'c', yKey: 'w', shadow, highlight },
                ],
            } as AgChartOptions)
        );
        chart.ctx.highlightManager.updateHighlight(chart.id, chart.series[0].getNodeData()[0]);
        await waitForChartStability(chart);
        const inPlace = (i: number) => rects(chart.series[i].contentGroup);
        const highlighted = (i: number) => rects(chart.series[i].highlightNodeGroup).filter((r) => r.visible);
        return { inPlace, highlighted };
    };

    it('casts highlightedSeries.glow from the hovered item when highlightedItem sets none', async () => {
        const { highlighted } = await hover({ highlightedSeries: { glow: GLOW } });
        expect(highlighted(0)[0].fillShadow).toMatchObject(GLOW_SHADOW);
    });

    it('casts highlightedSeries.glow from the other items of the hovered series, in the base pass', async () => {
        const { inPlace } = await hover({ highlightedSeries: { glow: GLOW } });
        const [hovered, ...others] = inPlace(0);
        expect(hovered).toBeDefined();
        for (const rect of others) expect(rect.fillShadow).toMatchObject(GLOW_SHADOW);
    });

    it('casts unhighlightedItem.glow from the other items of the hovered series, in the base pass', async () => {
        const { inPlace } = await hover({ unhighlightedItem: { glow: GLOW } });
        const [, ...others] = inPlace(0);
        for (const rect of others) expect(rect.fillShadow).toMatchObject(GLOW_SHADOW);
    });

    it('casts unhighlightedSeries.glow from every item of the other series, in the base pass', async () => {
        const { inPlace } = await hover({ unhighlightedSeries: { glow: GLOW } });
        expect(inPlace(1).length).toBeGreaterThan(0);
        for (const rect of inPlace(1)) expect(rect.fillShadow).toMatchObject(GLOW_SHADOW);
    });

    // An item has one shadow slot: a state whose glow is enabled replaces the item's base shadow, never merging with it.
    describe('one shadow slot', () => {
        it('replaces the base shadow of the other items of the hovered series with unhighlightedItem.glow', async () => {
            const { inPlace } = await hover({ unhighlightedItem: { glow: GLOW } }, SERIES_SHADOW);
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

        it('replaces the base shadow of every item of the other series with unhighlightedSeries.glow', async () => {
            const { inPlace } = await hover({ unhighlightedSeries: { glow: GLOW } }, SERIES_SHADOW);

            for (const rect of inPlace(1)) expect(rect.fillShadow).toMatchObject(GLOW_SHADOW);
            for (const rect of inPlace(0)) expect(rect.fillShadow).toMatchObject(SERIES_SHADOW);
        });

        it('keeps the base shadow where the state glow is disabled', async () => {
            const { inPlace, highlighted } = await hover(
                { highlightedSeries: { glow: { ...GLOW, enabled: false } } },
                SERIES_SHADOW
            );

            for (const rect of [...inPlace(0), ...inPlace(1)]) expect(rect.fillShadow).toMatchObject(SERIES_SHADOW);
            expect(highlighted(0)[0].fillShadow?.enabled).not.toBe(true);
        });

        it("keeps the hovered item's in-place shadow beneath the glowing copy of the highlight layer", async () => {
            const { inPlace, highlighted } = await hover({ highlightedSeries: { glow: GLOW } }, SERIES_SHADOW);

            expect(inPlace(0)[0].fillShadow).toMatchObject(SERIES_SHADOW);
            expect(highlighted(0)[0].fillShadow).toMatchObject(GLOW_SHADOW);
        });
    });
});
