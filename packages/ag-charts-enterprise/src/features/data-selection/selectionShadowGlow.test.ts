import { describe, expect, it } from 'vitest';

import type { AgChartInstance } from 'ag-charts-community';
import {
    RENDER_OPTIONS,
    SERIES_GLOW,
    SERIES_SHADOW,
    canvasImage,
    deproxy,
    differingBytes,
    expectSamePixels,
    useGlowCharts,
    waitForChartStability,
} from 'ag-charts-community-test';

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

describe('shadow and glow from an itemStyler that branches on the state of an item', () => {
    const charts = useGlowCharts(createEnterpriseChart);
    const { create, chart } = charts;

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

    // Current behaviour, which looks wrong: after `setSelection` the itemStyler of a bar is not called again, and still
    // sees `selectionState: 'none'`, so a shadow or glow that it returns for a selected or unselected item never renders.
    // The cause is probably the per-datum cache of itemStyler results, which a change of selection does not clear.
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
});
