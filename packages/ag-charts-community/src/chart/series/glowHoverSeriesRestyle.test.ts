import { afterEach, describe, expect, it, vi } from 'vitest';

import { Rect } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { Marker } from '../marker/marker';
import { differingBytes } from '../test/expectSamePixels';
import { canvasImage, endHover, hoverDatum } from '../test/glowRender';
import { getItemsStyledDuring, getSeriesAt, getSeriesHasChangesOnHighlight } from '../test/seriesAccessors';
import { SERIES_GLOW, glowShadow, shapesOf } from '../test/shadowFixtures';
import {
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    createChart,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

/** Entering or leaving a series restyles only series whose glow changes, whatever `unhighlightedSeries.opacity` is. */
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

    const create = async (
        highlight?: object,
        glow: object = SERIES_GLOW,
        itemStyler?: unknown,
        seriesExtra: object = {},
        chartExtra: object = {}
    ) => {
        chart?.destroy();
        chart = deproxy(
            await createChart({
                data: DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
                ...chartExtra,
                series: ['a', 'b', 'c'].map((yKey) => ({
                    type,
                    xKey: 'x',
                    yKey,
                    glow,
                    highlight,
                    itemStyler,
                    ...seriesExtra,
                })),
            } as AgChartOptions)
        );
        await waitForChartStability(chart);
    };

    describe('with highlight.unhighlightedSeries.opacity: 1', () => {
        // Items of the other series may still dim for `unhighlightedItem`, which a series that is not entered doesn't have.
        const highlight = { unhighlightedSeries: { opacity: 1 }, unhighlightedItem: { opacity: 1 } };

        it('should not restyle a series with an unchanged glow when the hover enters another series', async () => {
            await create(highlight);

            const visited = await getItemsStyledDuring(chart, 1, () => hoverDatum(chart, 0, 0));

            expect(visited).toEqual([]);
            expect(getSeriesHasChangesOnHighlight(chart, 1)).toBe(false);
        });

        it('should not restyle a series with an unchanged glow when the hover leaves another series', async () => {
            await create(highlight);
            await hoverDatum(chart, 0, 0);

            const visited = await getItemsStyledDuring(chart, 1, () => endHover(chart));

            expect(visited).toEqual([]);
            expect(getSeriesHasChangesOnHighlight(chart, 1)).toBe(false);
        });

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
            const moved = canvasImage(chart);
            expect(Array.from(moved.data).some((value) => value !== 0)).toBe(true);

            await create(highlight);
            await hoverDatum(chart, 1, 3);

            expect(differingBytes(moved, canvasImage(chart))).toBe(0);
        });
    });

    describe('where the skip cannot be proved, the series is restyled and draws what its state draws', () => {
        const noDimming = { unhighlightedSeries: { opacity: 1 }, unhighlightedItem: { opacity: 1 } };

        it('with a styler that returns a fill for the state', async () => {
            const styler = ({ highlightState }: { highlightState?: string }) =>
                highlightState === 'unhighlighted-series' ? { fill: '#ff0000' } : {};
            await create(noDimming, SERIES_GLOW, undefined, { styler });

            const entered = await getItemsStyledDuring(chart, 1, () => hoverDatum(chart, 0, 0));
            expect(entered).toHaveLength(DATA.length);

            const hovered = canvasImage(chart);
            await create(noDimming, SERIES_GLOW, undefined, { styler });
            await hoverDatum(chart, 0, 0);
            expect(differingBytes(hovered, canvasImage(chart))).toBe(0);
        });

        it('with a glow that the state of an unlit series changes', async () => {
            const highlight = { unhighlightedSeries: { opacity: 1, glow: { blur: 13 } } };
            await create(highlight);
            const shapes = () => shapesOf(getSeriesAt(chart, 1).contentGroup, kinds[type]);

            await getItemsStyledDuring(chart, 1, () => hoverDatum(chart, 0, 0));
            for (const shape of shapes())
                expect(shape.fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 13 }));

            await endHover(chart);
            for (const shape of shapes()) expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
        });

        it('with highlight.mode shared', async () => {
            await create(noDimming, SERIES_GLOW, undefined, {}, { highlight: { mode: 'shared' } });

            const entered = await getItemsStyledDuring(chart, 1, () => hoverDatum(chart, 0, 0));

            expect(entered.length).toBeGreaterThan(0);
        });

        it('with a state that sets an opacity other than the one the series draws at', async () => {
            await create({ unhighlightedSeries: { opacity: 0.5 } });

            const entered = await getItemsStyledDuring(chart, 1, () => hoverDatum(chart, 0, 0));

            expect(entered).toHaveLength(DATA.length);
        });
    });

    describe('with series-level opacities and highlight.unhighlightedSeries.opacity: 1', () => {
        it('should draw the chart at rest again, and the series that was not entered as it was, after the hover', async () => {
            const seriesExtra = { fillOpacity: 0.4, strokeOpacity: 0.7, strokeWidth: 2 };
            await create({ unhighlightedSeries: { opacity: 1 } }, SERIES_GLOW, undefined, seriesExtra);
            const rest = canvasImage(chart);
            const shapes = () => shapesOf(getSeriesAt(chart, 1).contentGroup, kinds[type]);
            const styleOf = () =>
                shapes().map(({ opacity, fillOpacity, strokeOpacity }) => [opacity, fillOpacity, strokeOpacity]);
            const restStyle = styleOf();
            expect(restStyle[0]).toEqual([1, 0.4, 0.7]);

            await hoverDatum(chart, 0, 0);
            expect(styleOf()).toEqual(restStyle);
            await endHover(chart);

            expect(styleOf()).toEqual(restStyle);
            expect(differingBytes(canvasImage(chart), rest)).toBe(0);
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
            const rest = canvasImage(chart);

            await hoverDatum(chart, 0, 0);
            await hoverDatum(chart, 1, 2);
            await endHover(chart);

            expect(differingBytes(canvasImage(chart), rest)).toBe(0);
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

            const hovered = canvasImage(chart);
            await create({ unhighlightedSeries: { opacity: 1 } }, SERIES_GLOW, itemStyler);
            await hoverDatum(chart, 0, 0);
            expect(differingBytes(hovered, canvasImage(chart))).toBe(0);
        });

        it('with a glow that has a gap', async () => {
            await create({ unhighlightedSeries: { opacity: 1 } }, { ...SERIES_GLOW, gap: 5 });
            await hoverDatum(chart, 0, 0);
            await hoverDatum(chart, 1, 4);
            const moved = canvasImage(chart);
            expect(Array.from(moved.data).some((value) => value !== 0)).toBe(true);

            await create({ unhighlightedSeries: { opacity: 1 } }, { ...SERIES_GLOW, gap: 5 });
            await hoverDatum(chart, 1, 4);
            expect(differingBytes(moved, canvasImage(chart))).toBe(0);
        });
    });
});
