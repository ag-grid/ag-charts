import { describe, expect, it } from 'vitest';

import type { AgChartInstance } from 'ag-charts-community';
import {
    RENDER_OPTIONS,
    SERIES_GLOW,
    SERIES_SHADOW,
    canvasImage,
    clickAction,
    deproxy,
    differingBytes,
    expectSamePixels,
    getSeriesSelectionNodes,
    useGlowCharts,
    waitForChartStability,
} from 'ag-charts-community-test';
import { type Rect, Transformable } from 'ag-charts-core';

import { createEnterpriseChart } from '../../test/utils';

const DATA = [
    { category: 'A', value: 5 },
    { category: 'B', value: 8 },
    { category: 'C', value: 3 },
];

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

/** Selects a bar by clicking it, as the user would: unlike `setSelection`, it runs the itemStyler of each item again. */
const clickBar = async (chart: AgChartInstance, seriesIndex = 0, datumIndex = 0) => {
    const { x, y } = centreOf(chart, seriesIndex, datumIndex);
    await clickAction(x, y)(chart);
    await waitForChartStability(chart);
};

describe('shadow and glow from an itemStyler that branches on the state of an item', () => {
    const charts = useGlowCharts(createEnterpriseChart);
    const { create, chart, snapshot } = charts;

    const selectedWith = async (style: object) => {
        await create(
            bars(() => style),
            DATA,
            OPTIONS
        );
        await selectFirst(chart());
        return canvasImage(chart());
    };

    const atRest = async (series: object[]) => {
        await create(series, DATA, OPTIONS);
        return canvasImage(chart());
    };

    /** The render of the bars once the first is selected, whose itemStyler returns the shadow and glow for a state of selection. */
    const selected = async (state?: string) => {
        await create(
            bars(({ selectionState }) => (state !== undefined && selectionState === state ? STYLE : {})),
            DATA,
            OPTIONS
        );
        await selectFirst(chart());
        return canvasImage(chart());
    };

    it('renders the shadow and glow that an itemStyler returns for every item once one is selected', async () => {
        const control = await selected();
        expect(differingBytes(await selectedWith(STYLE), control)).toBeGreaterThan(0);
    });

    // Pins a known defect: after `setSelection` the itemStyler is not called again, so it never sees a selection state
    // (a click on an item does call it again: see the tests below that click).
    it.each(['selected-item', 'unselected-item'])(
        'renders no shadow or glow that an itemStyler returns for %s, as it renders none',
        async (state) => {
            expectSamePixels(await selected(state), await selected());
        }
    );

    it('renders as at rest once the selection has been cleared', async () => {
        await create(bars(), DATA, OPTIONS);
        const rest = canvasImage(chart());
        await selectFirst(chart());
        expect(differingBytes(canvasImage(chart()), rest)).toBeGreaterThan(0);

        chart().setSelection([]);
        await waitForChartStability(chart());
        expectSamePixels(canvasImage(chart()), rest);
    });

    it('renders the glow it returns on no highlight as the series glow', async () => {
        await create([{ ...bars()[0], glow: SERIES_GLOW }], DATA, OPTIONS);
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

        it.each(STATES.flatMap((state) => CASTS.map(([name, cast]) => [state, name, cast] as const)))(
            'renders the %s of an itemStyler for %s, and not before the click',
            async (state, _name, cast) => {
                const rest = await atRest(bars());
                expectSamePixels(await atRest(styledFor(state, cast)), rest);

                await clickBar(chart());
                const styled = canvasImage(chart());

                await create(bars(), DATA, OPTIONS);
                await clickBar(chart());
                expect(differingBytes(styled, canvasImage(chart()))).toBeGreaterThan(0);
            }
        );

        it('renders the shadow and glow of an itemStyler for the selected item', async () => {
            await create(styledFor('selected-item', STYLE), DATA, OPTIONS);
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
            const data = DATA.map((datum) => ({ ...datum, other: datum.value + 1 }));
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
