import { afterEach, describe, expect, it } from 'vitest';

import { type AgChartInstance, type AgChartOptions, _ModuleSupport } from 'ag-charts-community';
import {
    clickAction,
    deproxy,
    getSeriesContextNodeData,
    getSeriesSelectionNodes,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
    withUndocumentedOptions,
} from 'ag-charts-community-test';

import { createEnterpriseChart } from '../../test/utils';

describe('AG-19127 cross-filter markers with selection.enabled', () => {
    setupMockConsole();
    setupMockCanvas();

    const data = [
        { x: 'Jan', y: 10, selected: true },
        { x: 'Feb', y: 20, selected: false },
        { x: 'Mar', y: 15, selected: false },
    ];

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const markerNodes = () => getSeriesSelectionNodes<_ModuleSupport.Marker>(chart!, 'datumSelection', 0);

    async function create(type: 'line' | 'area') {
        const series = withUndocumentedOptions(
            { type, xKey: 'x', yKey: 'y', marker: { enabled: false }, selection: { enabled: true } },
            { selectedKey: 'selected' }
        );
        chart = await createEnterpriseChart({
            data,
            selection: { enabled: true },
            series: [series],
        } as AgChartOptions);
    }

    async function select(index: number) {
        const { series } = deproxy(chart!);
        chart!.setSelection([{ seriesId: series[0].id, itemId: series[0].data!.getItemIdFromIndex(index) }]);
        await waitForChartStability(chart!);
    }

    async function clickDatum(index: number, offset = 0) {
        const series = deproxy(chart!).series[0];
        const nodeDatum = getSeriesContextNodeData(chart!).nodeData[index];
        const { canvasX, canvasY } = series.toCanvasFromMidPoint(nodeDatum);
        await clickAction(canvasX + offset, canvasY)(chart!);
        await waitForChartStability(chart!);
    }

    const selectedItemIds = () => Array.from(chart!.getSelection()).map((item) => item.itemId);

    describe.each(['line', 'area'] as const)('%s', (type) => {
        it('draws the cross-filter-selected marker solid and hides the rest', async () => {
            await create(type);

            const [jan, feb, mar] = markerNodes();
            expect(jan.visible).toBe(true);
            expect(jan.size).toBeGreaterThan(0);
            expect(jan.fillOpacity).toBe(1);
            expect(feb.size).toBe(0);
            expect(mar.size).toBe(0);
        });

        it('keeps the cross-filter-selected marker solid when another datum is selected', async () => {
            await create(type);
            await select(1);

            const [jan, feb, mar] = markerNodes();
            expect(jan.size).toBeGreaterThan(0);
            // The selected datum is not hidden, though cross-filtering has unselected it.
            expect(feb.size).toBeGreaterThan(0);
            expect(feb.fillOpacity).toBeLessThan(1);
            expect(mar.size).toBe(0);
        });

        it('selects an unselected point clicked within the markerless pick range', async () => {
            await create(type);

            await clickDatum(1, 5);

            const { series } = deproxy(chart!);
            expect(selectedItemIds()).toEqual([series[0].data!.getItemIdFromIndex(1)]);
        });

        it('selects an unselected point clicked exactly', async () => {
            await create(type);

            await clickDatum(2);

            const { series } = deproxy(chart!);
            expect(selectedItemIds()).toEqual([series[0].data!.getItemIdFromIndex(2)]);
        });
    });

    // `range-area` and `hlc` do not support cross-filtering (they never have `contextNodeData.crossFiltering`), so
    // disabled markers stay hidden at size 0 under `selection.enabled`, as before AG-19127.
    describe.each([
        {
            type: 'range-area',
            // Low and high markers per datum.
            markerCount: 6,
            series: { type: 'range-area', xKey: 'x', yLowKey: 'low', yHighKey: 'high' },
            data: [
                { x: 'Jan', low: 5, high: 10 },
                { x: 'Feb', low: 8, high: 20 },
                { x: 'Mar', low: 6, high: 15 },
            ],
        },
        {
            type: 'hlc',
            // High, low and close markers per datum.
            markerCount: 9,
            series: { type: 'hlc', xKey: 'x', highKey: 'high', lowKey: 'low', closeKey: 'close' },
            data: [
                { x: 'Jan', high: 10, low: 5, close: 8 },
                { x: 'Feb', high: 20, low: 8, close: 12 },
                { x: 'Mar', high: 15, low: 6, close: 9 },
            ],
        },
    ])('$type', ({ markerCount, series: seriesOptions, data: seriesData }) => {
        async function createWithDisabledMarkers() {
            chart = await createEnterpriseChart({
                data: seriesData,
                selection: { enabled: true },
                series: [{ ...seriesOptions, marker: { enabled: false }, selection: { enabled: true } }],
            } as AgChartOptions);
        }

        it('keeps every marker node hidden at size 0', async () => {
            await createWithDisabledMarkers();

            const nodes = markerNodes();
            expect(nodes).toHaveLength(markerCount);
            expect(nodes.every((node) => node.size === 0)).toBe(true);
        });

        it("shows only the selected datum's markers once it is selected", async () => {
            await createWithDisabledMarkers();
            await select(1);

            const nodes = markerNodes();
            expect(nodes).toHaveLength(markerCount);
            const shown = nodes.filter((node) => node.size > 0);
            expect(shown.length).toBeGreaterThan(0);
            expect(shown.every((node) => (node.datum as { datumIndex: number }).datumIndex === 1)).toBe(true);
        });
    });
});
