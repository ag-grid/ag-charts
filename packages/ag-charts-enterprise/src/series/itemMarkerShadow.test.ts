import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgChartOptions, AgDropShadowOptions, _ModuleSupport } from 'ag-charts-community';
import type { Chart } from 'ag-charts-community-test';
import { deproxy, getSeriesSelectionNodes, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { createEnterpriseChart } from '../test/utils';

const DATA = [
    { x: 1, low: 2, high: 8, close: 5 },
    { x: 2, low: 3, high: 9, close: 6 },
    { x: 3, low: 1, high: 7, close: 4 },
];

interface ItemCase {
    name: string;
    /** The series options with the `shadow` of the marker of one item, which inherits from the series marker. */
    series: (itemShadow: AgDropShadowOptions | undefined, seriesShadow?: AgDropShadowOptions) => object;
}

const ITEM_CASES: ItemCase[] = [
    {
        name: 'range-area item marker',
        series: (itemShadow, seriesShadow) => ({
            type: 'range-area',
            xKey: 'x',
            yHighKey: 'high',
            yLowKey: 'low',
            marker: { enabled: true, shadow: seriesShadow },
            item: { high: { marker: { enabled: true, shadow: itemShadow } } },
        }),
    },
    {
        name: 'hlc item marker',
        series: (itemShadow, seriesShadow) => ({
            type: 'hlc',
            xKey: 'x',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            marker: { enabled: true, shadow: seriesShadow },
            item: { close: { marker: { enabled: true, shadow: itemShadow } } },
        }),
    },
];

describe('item marker shadow fill and fillOpacity', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        vi.restoreAllMocks();
    });

    const warnings = () => vi.mocked(console.warn).mock.calls.map(([message]) => String(message));

    const castBy = async (
        testCase: ItemCase,
        itemShadow: AgDropShadowOptions | undefined,
        seriesShadow?: AgDropShadowOptions
    ) => {
        const created = deproxy(
            await createEnterpriseChart({
                data: DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [testCase.series(itemShadow, seriesShadow)],
            } as AgChartOptions)
        );
        chart = created;
        const casters = getSeriesSelectionNodes<_ModuleSupport.Marker>(created, 'datumSelection').filter(
            (marker) => marker.fillShadow?.enabled
        );
        expect(casters.length).toBeGreaterThan(0);
        return casters.map((shape) => shape.fillShadow);
    };

    describe.each(ITEM_CASES)('$name', (testCase) => {
        it('casts a deprecated color as its fill, at a fillOpacity of 1', async () => {
            const shadows = await castBy(testCase, { enabled: true, color: 'red' });

            for (const shadow of shadows) expect(shadow).toMatchObject({ fill: 'red', fillOpacity: 1 });
            expect(warnings().some((message) => message.includes('color'))).toBe(true);
        });

        it('casts a fill at a fillOpacity of 1 unless it sets one', async () => {
            const shadows = await castBy(testCase, { enabled: true, fill: 'red' });

            for (const shadow of shadows) expect(shadow).toMatchObject({ fill: 'red', fillOpacity: 1 });
            expect(warnings()).toEqual([]);
        });

        it('casts the fill and fillOpacity that it sets', async () => {
            const shadows = await castBy(testCase, { enabled: true, fill: 'red', fillOpacity: 0.3 });

            for (const shadow of shadows) expect(shadow).toMatchObject({ fill: 'red', fillOpacity: 0.3 });
        });

        it('casts its fill rather than its color where it sets both', async () => {
            const shadows = await castBy(testCase, { enabled: true, fill: 'blue', color: 'red' });

            for (const shadow of shadows) expect(shadow).toMatchObject({ fill: 'blue', fillOpacity: 1 });
        });

        it('starts from the fill and fillOpacity of the series marker shadow', async () => {
            const shadows = await castBy(
                testCase,
                { enabled: true },
                { enabled: true, fill: 'green', fillOpacity: 0.6 }
            );

            for (const shadow of shadows) expect(shadow).toMatchObject({ fill: 'green', fillOpacity: 0.6 });
        });

        it('starts from the theme fill and fillOpacity', async () => {
            const shadows = await castBy(testCase, { enabled: true });

            for (const shadow of shadows) expect(shadow).toMatchObject({ fill: '#000', fillOpacity: 0.5 });
        });
    });
});
