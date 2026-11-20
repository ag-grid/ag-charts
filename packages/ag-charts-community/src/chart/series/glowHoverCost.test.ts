import { afterEach, describe, expect, it, vi } from 'vitest';

import { Rect } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { Chart } from '../chart';
import { Marker } from '../marker/marker';
import { endHover, hoverDatum } from '../test/glowRender';
import {
    getItemsStyledDuring,
    getSeriesAt,
    getSeriesHasChangesOnHighlight,
    getSeriesNodeData,
} from '../test/seriesAccessors';
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
 * What a hover costs a chart with a series `glow`: a node whose glow does not change is neither given another glow object
 * nor marked dirty, and a move between items restyles only the two items involved. The tests pin that mechanism and never
 * a timing. Whatever the skip cannot prove unchanged must still render the glow the state casts.
 */
const DATA = Array.from({ length: 6 }, (_, i) => ({ x: i + 1, v: ((i * 7) % 5) + 2, w: i + 2 }));

interface SeriesCase {
    name: string;
    series: (key: 'v' | 'w', glow: object | undefined, opts?: { highlight?: object; itemStyler?: unknown }) => object;
    kind: abstract new (...args: any[]) => Shape;
    /** Whether `highlight.mode: 'shared'` lights the item that shares the hovered category in the other series. */
    sharesCategory: boolean;
}

const sortedIndices = (indices: number[]) => [...indices].sort((a, b) => a - b);

const SERIES: SeriesCase[] = [
    {
        name: 'bar',
        kind: Rect,
        sharesCategory: true,
        series: (key, glow, opts) => ({ type: 'bar', xKey: 'x', yKey: key, glow, ...opts }),
    },
    {
        name: 'scatter',
        kind: Marker,
        sharesCategory: false,
        series: (key, glow, opts) => ({ type: 'scatter', xKey: 'x', yKey: key, glow, ...opts }),
    },
];

describe.each(SERIES)('the cost of a hover with a series glow ($name)', ({ series, kind, sharesCategory }) => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
        vi.restoreAllMocks();
    });

    const create = async (seriesOptions: object[], options: object = SINGLE_HIGHLIGHT_SHARED_TOOLTIP) => {
        chart = deproxy(
            await createChart({
                data: DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                ...options,
                series: seriesOptions,
            } as AgChartOptions)
        );
        await waitForChartStability(chart);
    };

    const inPlace = (seriesIndex = 0) => shapesOf(getSeriesAt(chart, seriesIndex).contentGroup, kind);

    const hover = (seriesIndex: number, datumIndex: number) => hoverDatum(chart, seriesIndex, datumIndex);

    /** Raises the highlight on an item of the first series without waiting for the chart to draw, as a pointer moving faster than the frames does. */
    const raiseHighlight = (datumIndex: number) => {
        const { ctx, id } = chart;
        ctx.highlightManager.updateHighlight(id, getSeriesNodeData<HighlightNodeDatum>(chart)[datumIndex]);
    };

    /** The glows that the items of the first series cast in a chart hovered at `datumIndex`, which replaces the chart. */
    const glowsOfFreshChartHoveredAt = async (seriesOptions: object[], datumIndex: number) => {
        chart.destroy();
        await create(seriesOptions);
        await hover(0, datumIndex);
        return inPlace().map((shape) => shape.fillGlow);
    };

    const visitedDuring = (seriesIndex: number, action: () => Promise<void>) =>
        getItemsStyledDuring(chart, seriesIndex, action);

    describe('a glow that a state leaves as the series casts it', () => {
        // The theme dims the other items and series, so those nodes are restyled for their opacity. What a state that casts
        // the series glow must not do is hand them another glow object, which `fillGlow` compares by identity.
        it('keeps one glow object on the items that the hover leaves lit as before', async () => {
            await create([series('v', SERIES_GLOW, { highlight: {} }), series('w', SERIES_GLOW, { highlight: {} })]);
            const [hovered, ...others] = inPlace();
            const otherSeries = inPlace(1);
            const before = [...others, ...otherSeries].map((shape) => shape.fillGlow);
            expect(before[0]).toMatchObject(glowShadow(SERIES_GLOW));

            await hover(0, 0);

            expect(hovered).toBeDefined();
            for (const [i, shape] of [...others, ...otherSeries].entries()) expect(shape.fillGlow).toBe(before[i]);
        });

        it('keeps one glow object where a state sets the glow equal to the series glow', async () => {
            const highlight = {
                unhighlightedItem: { glow: { ...SERIES_GLOW } },
                highlightedSeries: { glow: { enabled: true } },
                unhighlightedSeries: { glow: { ...SERIES_GLOW } },
            };
            await create([series('v', SERIES_GLOW, { highlight }), series('w', SERIES_GLOW, { highlight })]);
            const shapes = [...inPlace().slice(1), ...inPlace(1)];
            const before = shapes.map((shape) => shape.fillGlow);

            await hover(0, 0);
            for (const [i, shape] of shapes.entries()) expect(shape.fillGlow).toBe(before[i]);

            await endHover(chart);
            for (const [i, shape] of shapes.entries()) expect(shape.fillGlow).toBe(before[i]);
        });

        it('shares one glow object between the items of the series at rest', async () => {
            await create([series('v', SERIES_GLOW, { highlight: {} })]);

            const [first, ...rest] = inPlace();
            for (const shape of rest) expect(shape.fillGlow).toBe(first.fillGlow);
        });

        it('gives the items another glow object, with its glow, where the state casts a different glow', async () => {
            // Guards the checks above against passing because the glow is never replaced.
            await create([series('v', SERIES_GLOW, { highlight: { unhighlightedItem: { glow: { blur: 11 } } } })]);
            const [, ...others] = inPlace();
            const before = others.map((shape) => shape.fillGlow);

            await hover(0, 0);

            for (const [i, shape] of others.entries()) expect(shape.fillGlow).not.toBe(before[i]);
            for (const shape of others) expect(shape.fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 11 }));
        });
    });

    describe('moving between items of one series', () => {
        const highlight = { unhighlightedItem: { glow: { blur: 11 } } };

        it('asks for no redraw of the whole series, with a glow that differs for the other items', async () => {
            await create([series('v', SERIES_GLOW, { highlight })]);
            await hover(0, 0);
            await hover(0, 1);

            expect(getSeriesHasChangesOnHighlight(chart, 0)).toBe(false);
        });

        it('restyles the item left and the item reached, and no other', async () => {
            await create([series('v', SERIES_GLOW, { highlight })]);
            await hover(0, 0);

            const visited = await visitedDuring(0, () => hover(0, 1));

            expect(DATA.length).toBeGreaterThan(2);
            expect(sortedIndices(visited)).toEqual([0, 1]);
        });

        it('restyles every item where the hover ends, which the check above would otherwise not tell from no visit', async () => {
            await create([series('v', SERIES_GLOW, { highlight })]);
            await hover(0, 0);

            const visited = await visitedDuring(0, () => endHover(chart));

            expect(sortedIndices(visited)).toEqual(DATA.map((_, i) => i));
        });

        it('casts the glows of the states after the move, as a chart hovered at that item does', async () => {
            await create([series('v', SERIES_GLOW, { highlight })]);
            await hover(0, 0);
            await hover(0, 1);
            await hover(0, 3);
            const moved = inPlace().map((shape) => shape.fillGlow);

            chart.destroy();
            await create([series('v', SERIES_GLOW, { highlight })]);
            await hover(0, 3);

            expect(moved).toHaveLength(DATA.length);
            expect(moved).toEqual(inPlace().map((shape) => shape.fillGlow));
            // Item 3 is the hovered one, which casts no glow in place; the others cast the state glow.
            for (const [i, glow] of moved.entries()) {
                if (i === 3) expect(glow?.enabled).not.toBe(true);
                else expect(glow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 11 }));
            }
        });

        it('restyles the items of every move that one frame draws, not only those of the last', async () => {
            const options = [series('v', SERIES_GLOW, { highlight })];
            await create(options);
            await hover(0, 0);

            const visited = await visitedDuring(0, async () => {
                raiseHighlight(1);
                raiseHighlight(2);
                await waitForChartStability(chart);
            });
            const moved = inPlace().map((shape) => shape.fillGlow);

            // Items 0 and 1 are left behind, and 2 is reached.
            expect(sortedIndices(visited)).toEqual([0, 1, 2]);
            expect(await glowsOfFreshChartHoveredAt(options, 2)).toEqual(moved);
            expect(moved[0]).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 11 }));
            expect(moved[1]).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 11 }));
        });

        it('redraws the whole series when the move follows, in the same frame, a hover that entered it', async () => {
            const options = [series('v', SERIES_GLOW, { highlight })];
            await create(options);

            const visited = await visitedDuring(0, async () => {
                raiseHighlight(0);
                raiseHighlight(1);
                await waitForChartStability(chart);
            });
            const moved = inPlace().map((shape) => shape.fillGlow);

            expect(sortedIndices(visited)).toEqual(DATA.map((_, i) => i));
            expect(await glowsOfFreshChartHoveredAt(options, 1)).toEqual(moved);
            for (const [i, glow] of moved.entries()) {
                if (i !== 1) expect(glow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 11 }));
            }
        });

        it('returns every item to the series glow when the hover ends after moves', async () => {
            await create([series('v', SERIES_GLOW, { highlight })]);
            await hover(0, 0);
            await hover(0, 1);
            await hover(0, 2);
            await endHover(chart);

            for (const shape of inPlace()) expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
        });
    });

    describe('moving the hover between series', () => {
        const create3 = (highlight: object) =>
            create(['v', 'w', 'x'].map((key) => series(key as 'v', SERIES_GLOW, { highlight })));

        // Under the default theme a series that is entered or left is dimmed or lit, so it is restyled for its opacity.
        it('does redraw the series entered and left, with the glow that its state casts', async () => {
            await create3({ unhighlightedSeries: { glow: { blur: 13 } } });
            await hover(0, 0);
            await hover(1, 0);

            expect(getSeriesHasChangesOnHighlight(chart, 0)).toBe(true);
            expect(getSeriesHasChangesOnHighlight(chart, 1)).toBe(true);
            for (const shape of inPlace(0))
                expect(shape.fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 13 }));
        });

        it('casts the glow of each state after the hover enters and leaves a series', async () => {
            const highlight = { unhighlightedSeries: { glow: { blur: 13 } } };
            await create3(highlight);
            await hover(0, 0);
            for (const shape of inPlace(1))
                expect(shape.fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 13 }));

            await endHover(chart);
            for (const index of [0, 1, 2]) {
                for (const shape of inPlace(index)) expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
            }
        });
    });

    describe('where the skip cannot be proved, the series redraws', () => {
        it('with an itemStyler that returns a glow for the state, still casts the glow of each state after a move', async () => {
            const itemStyler = ({ highlightState }: { highlightState?: string }) =>
                highlightState === 'unhighlighted-item' ? { glow: { blur: 17 } } : {};
            await create([series('v', SERIES_GLOW, { highlight: {}, itemStyler })]);

            await hover(0, 0);
            await hover(0, 1);

            expect(getSeriesHasChangesOnHighlight(chart, 0)).toBe(true);
            const shapes = inPlace();
            for (const [i, shape] of shapes.entries()) {
                if (i === 1) expect(shape.fillGlow?.enabled).not.toBe(true);
                else expect(shape.fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 17 }));
            }

            await endHover(chart);
            for (const shape of inPlace()) expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
        });

        // A scatter series lights no item for a category that the hover shares with it, so only a bar has one to check.
        it.runIf(sharesCategory)(
            'with highlight.mode shared, still casts the highlighted glow on the item that shares the hovered category',
            async () => {
                const highlight = { highlightedItem: { glow: { blur: 9 } }, unhighlightedItem: { glow: { blur: 11 } } };
                await create([series('v', SERIES_GLOW, { highlight }), series('w', SERIES_GLOW, { highlight })], {
                    highlight: { mode: 'shared' },
                });
                const lit = glowShadow({ ...SERIES_GLOW, blur: 9 });
                const atRest = glowShadow(SERIES_GLOW);

                // The other series casts the highlighted glow on the item of the hovered category only.
                await hover(0, 0);
                expect(inPlace(1)[0].fillGlow).toMatchObject(lit);
                for (const shape of inPlace(1).slice(1)) expect(shape.fillGlow).toMatchObject(atRest);

                // The glow moves with the hover to the next category, and the item left returns to its glow at rest.
                await hover(0, 1);
                expect(inPlace(1)[1].fillGlow).toMatchObject(lit);
                for (const [i, shape] of inPlace(1).entries()) {
                    if (i !== 1) expect(shape.fillGlow).toMatchObject(atRest);
                }

                await endHover(chart);
                for (const shape of inPlace(1)) expect(shape.fillGlow).toMatchObject(atRest);
            }
        );
    });
});
