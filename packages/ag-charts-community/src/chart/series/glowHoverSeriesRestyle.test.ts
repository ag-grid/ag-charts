import { afterEach, describe, expect, it, vi } from 'vitest';

import { Rect } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { Marker } from '../marker/marker';
import { differingBytes } from '../test/expectSamePixels';
import { endHover, hoverDatum } from '../test/glowRender';
import { getItemsStyledDuring, getSeriesAt } from '../test/seriesAccessors';
import { SERIES_GLOW, glowShadow, shapesOf } from '../test/shadowFixtures';
import {
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    createChart,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

/**
 * AG-19295 AC 3: entering or leaving a series doesn't re-style the series whose glow doesn't change, in the default theme
 * and in a configuration that ships, `highlight.unhighlightedSeries.opacity: 1`. The default theme dims the other series
 * for opacity, so those series are restyled there, but what they are restyled to is the glow they already cast.
 */
const DATA = Array.from({ length: 8 }, (_, i) => ({
    x: i + 1,
    a: ((i * 7) % 5) + 2,
    b: ((i * 3) % 5) + 3,
    c: ((i * 11) % 5) + 4,
}));

const kinds: Record<'scatter' | 'bar', abstract new (...args: any[]) => Shape> = { scatter: Marker, bar: Rect };

describe.each(['scatter', 'bar'] as const)('the series that a hover enters and leaves, %s', (type) => {
    setupMockConsole();
    setupMockCanvas();

    let chart: ReturnType<typeof deproxy>;
    afterEach(() => {
        chart?.destroy();
        vi.restoreAllMocks();
    });

    const create = async (highlight?: object, glow: object = SERIES_GLOW, itemStyler?: unknown) => {
        chart?.destroy();
        chart = deproxy(
            await createChart({
                data: DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
                series: ['a', 'b', 'c'].map((yKey) => ({ type, xKey: 'x', yKey, glow, highlight, itemStyler })),
            } as AgChartOptions)
        );
        await waitForChartStability(chart);
    };

    const pixelsOf = () => {
        const { canvas } = chart.ctx.scene;
        return { data: canvas.context.getImageData(0, 0, canvas.width, canvas.height).data as ArrayLike<number> };
    };

    describe('with highlight.unhighlightedSeries.opacity: 1', () => {
        // No dimming from either state, so the opacity of every item is the same entered, left or at rest.
        const highlight = { unhighlightedSeries: { opacity: 1 }, unhighlightedItem: { opacity: 1 } };

        it('should not restyle a series that a move from one series to another leaves unlit throughout', async () => {
            await create(highlight);
            await hoverDatum(chart, 0, 0);

            const visited = await getItemsStyledDuring(chart, 2, () => hoverDatum(chart, 1, 0));

            expect(visited).toEqual([]);
        });

        it('should still draw a hover as a chart hovered there draws it', async () => {
            await create(highlight);
            await hoverDatum(chart, 0, 0);
            await hoverDatum(chart, 1, 3);
            const moved = pixelsOf();
            expect(Array.from(moved.data).some((value) => value !== 0)).toBe(true);

            await create(highlight);
            await hoverDatum(chart, 1, 3);

            expect(differingBytes(moved, pixelsOf())).toBe(0);
        });
    });

    describe('in the default theme', () => {
        it('should restyle the other series for their opacity, and leave their glow object as it was', async () => {
            await create();
            const glows = (index: number) =>
                shapesOf(getSeriesAt(chart, index).contentGroup, kinds[type]).map((s) => s.fillGlow);
            const before = glows(1);
            expect(before[0]).toMatchObject(glowShadow(SERIES_GLOW));

            const visited = await getItemsStyledDuring(chart, 1, () => hoverDatum(chart, 0, 0));

            expect(visited).toHaveLength(DATA.length);
            const after = glows(1);
            for (const [i, glow] of after.entries()) expect(glow).toBe(before[i]);
        });

        it('should return to the pixels of the chart at rest after the hover ends', async () => {
            await create();
            const rest = pixelsOf();

            await hoverDatum(chart, 0, 0);
            await hoverDatum(chart, 1, 2);
            await endHover(chart);

            expect(differingBytes(pixelsOf(), rest)).toBe(0);
        });
    });

    describe('where the glow depends on the state, the series is restyled and draws the glow of the state', () => {
        it('with an itemStyler that returns a glow per state', async () => {
            const itemStyler = ({ highlightState }: { highlightState?: string }) =>
                highlightState === 'unhighlighted-item' || highlightState === 'unhighlighted-series'
                    ? { glow: { enabled: true, fill: '#00aa00', blur: 4 } }
                    : {};
            await create({ unhighlightedSeries: { opacity: 1 } }, SERIES_GLOW, itemStyler);

            const entered = await getItemsStyledDuring(chart, 1, () => hoverDatum(chart, 0, 0));
            expect(entered.length).toBe(DATA.length);

            const hovered = pixelsOf();
            await create({ unhighlightedSeries: { opacity: 1 } }, SERIES_GLOW, itemStyler);
            await hoverDatum(chart, 0, 0);
            expect(differingBytes(hovered, pixelsOf())).toBe(0);
        });

        it('with a glow that has a gap', async () => {
            await create({ unhighlightedSeries: { opacity: 1 } }, { ...SERIES_GLOW, gap: 5 });
            await hoverDatum(chart, 0, 0);
            await hoverDatum(chart, 1, 4);
            const moved = pixelsOf();
            expect(Array.from(moved.data).some((value) => value !== 0)).toBe(true);

            await create({ unhighlightedSeries: { opacity: 1 } }, { ...SERIES_GLOW, gap: 5 });
            await hoverDatum(chart, 1, 4);
            expect(differingBytes(moved, pixelsOf())).toBe(0);
        });
    });
});
