import { describe, expect, it } from 'vitest';

import type { AgChartInstance } from 'ag-charts-community';
import {
    CATEGORY_DATA,
    RENDER_OPTIONS,
    SERIES_GLOW,
    SERIES_SHADOW,
    canvasImage,
    clickAction,
    deproxy,
    differingBytes,
    endHover,
    expectSamePixels,
    getSeriesSelectionNodes,
    hoverAction,
    hoverDatum,
    useGlowCharts,
    waitForChartStability,
} from 'ag-charts-community-test';
import { type Rect, Transformable } from 'ag-charts-core';

import { createEnterpriseChart } from '../../test/utils';

const OPTIONS = { ...RENDER_OPTIONS, selection: { enabled: true } };

const STYLE = { shadow: SERIES_SHADOW, glow: SERIES_GLOW };

type StylerParams = { datum: { category: string }; selectionState?: string; highlightState?: string };

const bars = (itemStyler?: (params: StylerParams) => object) => [
    { type: 'bar', xKey: 'category', yKey: 'value', selection: { enabled: true }, itemStyler },
];

/** Selects the first bar, as the application would. */
const selectFirst = async (chart: AgChartInstance) => {
    const series = deproxy(chart).series[0];
    chart.setSelection([{ seriesId: series.id, itemId: series.data!.getItemIdFromIndex(0) }]);
    await waitForChartStability(chart);
};

/** The centre of a bar, on the canvas, where a click selects it. */
const centreOf = (chart: AgChartInstance, seriesIndex: number, datumIndex: number) => {
    const node = getSeriesSelectionNodes<Rect>(chart, 'datumSelection', seriesIndex)[datumIndex];
    const { x, y, width, height } = Transformable.toCanvas(node, node.getBBox());
    return { x: x + width / 2, y: y + height / 2 };
};

/**
 * Selects a bar as the user would: the pointer moves onto it and clicks it, then off the series area. A click redraws
 * the chart in full (`ChartUpdateType.FULL`, which clears the callback cache), so it runs the itemStyler of each item
 * again, unlike `setSelection`. Waits out the delay of the unhighlight, and fails if a highlight is still active.
 */
const clickBar = async (chart: AgChartInstance, seriesIndex = 0, datumIndex = 0) => {
    const { x, y } = centreOf(chart, seriesIndex, datumIndex);
    await hoverAction(x, y)(chart);
    await clickAction(x, y)(chart);
    await waitForChartStability(chart);
    const { highlightManager } = deproxy(chart).ctx;
    await hoverAction(2, 2)(chart);
    await waitForChartStability(chart, highlightManager.unhighlightDelay + 50);
    expect(highlightManager.getActiveHighlight()).toBeUndefined();
};

describe('shadow and glow from an itemStyler that branches on the state of an item', () => {
    const charts = useGlowCharts(createEnterpriseChart);
    const { create, chart, snapshot } = charts;

    /** The render of the bars once the first is selected with `setSelection`, with the given itemStyler. */
    const selectedWith = async (itemStyler: (params: StylerParams) => object) => {
        await create(bars(itemStyler), CATEGORY_DATA, OPTIONS);
        await selectFirst(chart());
        return canvasImage(chart());
    };

    /** The same, with an itemStyler that returns the shadow and glow for a state of selection only. */
    const selected = (state?: string) =>
        selectedWith(({ selectionState }) => (state !== undefined && selectionState === state ? STYLE : {}));

    const atRest = async (series: object[]) => {
        await create(series, CATEGORY_DATA, OPTIONS);
        return canvasImage(chart());
    };

    it('renders the shadow and glow that an itemStyler returns for every item once one is selected', async () => {
        const control = await selected();
        expect(differingBytes(await selectedWith(() => STYLE), control)).toBeGreaterThan(0);
    });

    // Pins a known defect: `setSelection` redraws with `ChartUpdateType.PERFORM_LAYOUT`, which keeps the callback cache, so
    // the itemStyler is not called again and never sees a selection state (a click redraws in full: see the tests below).
    it.each(['selected-item', 'unselected-item'])(
        'renders no shadow or glow that an itemStyler returns for %s, as it renders none',
        async (state) => {
            expectSamePixels(await selected(state), await selected());
        }
    );

    it('renders as at rest once the selection has been cleared', async () => {
        await create(bars(), CATEGORY_DATA, OPTIONS);
        const rest = canvasImage(chart());
        await selectFirst(chart());
        expect(differingBytes(canvasImage(chart()), rest)).toBeGreaterThan(0);

        chart().setSelection([]);
        await waitForChartStability(chart());
        expectSamePixels(canvasImage(chart()), rest);
    });

    it('renders the glow it returns on no highlight as the series glow', async () => {
        await create([{ ...bars()[0], glow: SERIES_GLOW }], CATEGORY_DATA, OPTIONS);
        const series = canvasImage(chart());
        expect(differingBytes(series, await atRest(bars()))).toBeGreaterThan(0);

        const styled = bars(({ highlightState }) => (highlightState === 'none' ? { glow: SERIES_GLOW } : {}));
        expectSamePixels(await atRest(styled), series);
    });

    describe('once an item is selected by a click', () => {
        const STATES = ['selected-item', 'unselected-item'];
        const CASTS: [string, object][] = [
            ['shadow', { shadow: SERIES_SHADOW }],
            ['glow', { glow: SERIES_GLOW }],
        ];

        const styledFor = (state: string, cast: object) =>
            bars(({ selectionState }) => (selectionState === state ? cast : {}));

        it.each(CASTS.flatMap(([name, cast]) => STATES.map((state) => [name, state, cast] as const)))(
            'renders the %s of an itemStyler for %s, and not before the click',
            async (_name, state, cast) => {
                const rest = await atRest(bars());
                expectSamePixels(await atRest(styledFor(state, cast)), rest);

                await clickBar(chart());
                const styled = canvasImage(chart());

                await create(bars(), CATEGORY_DATA, OPTIONS);
                await clickBar(chart());
                expect(differingBytes(styled, canvasImage(chart()))).toBeGreaterThan(0);
            }
        );

        // The cause of the defect above: only a redraw that clears the callback cache runs the itemStyler again.
        describe('the itemStyler is run again', () => {
            /** The selection states an itemStyler is given while `act` runs, with the pointer on the first bar beforehand. */
            const statesSeenDuring = async (act: () => Promise<void>) => {
                const seen = new Set<string | undefined>();
                await create(
                    bars(({ selectionState }) => {
                        seen.add(selectionState);
                        return {};
                    }),
                    CATEGORY_DATA,
                    OPTIONS
                );
                await hoverDatum(chart(), 0, 0);
                seen.clear();
                await act();
                return [...seen];
            };

            it('by a click that selects an item, with no change to the highlight', async () => {
                const seen = await statesSeenDuring(async () => {
                    const { x, y } = centreOf(chart(), 0, 0);
                    await clickAction(x, y)(chart());
                    await waitForChartStability(chart());
                });
                expect(seen).toContain('selected-item');
            });

            it('not by setSelection, but by the next change to the highlight', async () => {
                expect(await statesSeenDuring(() => selectFirst(chart()))).toEqual([]);
                expect(
                    await statesSeenDuring(async () => {
                        await selectFirst(chart());
                        await endHover(chart());
                    })
                ).toContain('selected-item');
            });
        });

        it('renders the shadow and glow of an itemStyler for the selected item', async () => {
            await create(styledFor('selected-item', STYLE), CATEGORY_DATA, OPTIONS);
            await clickBar(chart());
            await snapshot();
        });

        // The items of a series that has nothing selected are `unselected-item`: `unselected-series` is only handed to
        // the styling of a series as a whole, so an itemStyler can't branch on it.
        it('hands the itemStyler of another series unselected-item, and never unselected-series', async () => {
            const seen = new Set<string | undefined>();
            const series = (yKey: string, itemStyler?: (params: StylerParams) => object) => ({
                type: 'bar',
                xKey: 'category',
                yKey,
                selection: { enabled: true },
                itemStyler,
            });
            const data = CATEGORY_DATA.map((datum) => ({ ...datum, other: datum.value + 1 }));
            await create(
                [
                    series('value'),
                    series('other', ({ selectionState }) => {
                        seen.add(selectionState);
                        return {};
                    }),
                ],
                data,
                OPTIONS
            );
            await clickBar(chart(), 0, 0);
            expect([...seen].sort((a, b) => String(a).localeCompare(String(b)))).toEqual(['none', 'unselected-item']);
        });

        it('renders as at rest once the selection has been cleared, with a series shadow and glow', async () => {
            const withCast = [{ ...bars()[0], ...STYLE }];
            const rest = await atRest(withCast);
            await clickBar(chart());
            expect(differingBytes(canvasImage(chart()), rest)).toBeGreaterThan(0);

            // A click on empty space in the series area clears the selection.
            const { x } = centreOf(chart(), 0, 0);
            const node = getSeriesSelectionNodes<Rect>(chart(), 'datumSelection')[0];
            await clickAction(x, Transformable.toCanvas(node, node.getBBox()).y - 20)(chart());
            await waitForChartStability(chart());
            expect([...chart().getSelection()]).toHaveLength(0);
            expectSamePixels(canvasImage(chart()), rest);
        });
    });
});
