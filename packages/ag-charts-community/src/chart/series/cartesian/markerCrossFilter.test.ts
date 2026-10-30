import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import type { Marker } from '../../marker/marker';
import { withUndocumentedOptions } from '../../test/communitySeriesAccessors';
import { getSeriesAreaFocus, getSeriesContextNodeData, getSeriesSelectionNodes } from '../../test/seriesAccessors';
import {
    clickAction,
    createChart,
    deproxy,
    getSwapChainText,
    hoverAction,
    pressKey,
    setupMockCanvas,
    setupMockConsole,
    tabIntoChart,
    waitForChartStability,
} from '../../test/utils';

// AG-19127: with markers disabled, cross-filtering (`selectedKey`) draws the selected datums' markers and nothing else.
describe.each(['line', 'area'] as const)('AG-19127 cross-filter markers: %s series', (type) => {
    setupMockConsole();
    setupMockCanvas();

    const data = [
        { x: 'Jan', y: 10, selected: true },
        { x: 'Feb', y: 20, selected: false },
        { x: 'Mar', y: 15, selected: false },
    ];

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    type SeriesOptions = { marker?: Record<string, unknown>; listeners?: Record<string, unknown> };

    type Datum = { x: string | number; y: number; selected: boolean };

    async function create(
        seriesOptions: SeriesOptions,
        chartData: Datum[] = data,
        selectedKey: string | null = 'selected'
    ) {
        const series = { type, xKey: 'x', yKey: 'y', ...seriesOptions };
        chart = await createChart({
            data: chartData,
            series: [selectedKey == null ? series : withUndocumentedOptions(series, { selectedKey })],
        } as AgChartOptions);
    }

    const markerNodes = () => getSeriesSelectionNodes<Marker>(chart, 'datumSelection', 0);
    const markerDatumIndices = () => markerNodes().map((node) => (node.datum as { datumIndex: number }).datumIndex);

    describe('markers disabled', () => {
        it('draws only the selected marker', async () => {
            await create({ marker: { enabled: false } });

            const nodes = markerNodes();
            expect(nodes).toHaveLength(1);
            expect(nodes[0].visible).toBe(true);
            expect(nodes[0].fillOpacity).toBe(1);
        });

        it('draws no markers when nothing is selected', async () => {
            await create(
                { marker: { enabled: false } },
                data.map((d) => ({ ...d, selected: false }))
            );

            expect(markerNodes()).toHaveLength(0);
        });

        it('draws no markers without a selectedKey', async () => {
            await create({ marker: { enabled: false } }, data, null);

            expect(markerNodes()).toHaveLength(0);
        });

        it('moves the marker to the newly selected datum when the selection changes', async () => {
            await create({ marker: { enabled: false } });
            expect(markerDatumIndices()).toEqual([0]);

            await chart.update({
                data: data.map((d, i) => ({ ...d, selected: i === 2 })),
                series: [
                    withUndocumentedOptions(
                        { type, xKey: 'x', yKey: 'y', marker: { enabled: false } },
                        { selectedKey: 'selected' }
                    ),
                ],
            } as AgChartOptions);
            await waitForChartStability(chart);

            expect(markerDatumIndices()).toEqual([2]);
            expect(markerNodes()[0].visible).toBe(true);
        });
    });

    describe('markers enabled', () => {
        it('draws the unselected markers faded', async () => {
            await create({ marker: { enabled: true } });

            const nodes = markerNodes();
            expect(nodes).toHaveLength(3);
            expect(nodes.every((node) => node.visible)).toBe(true);
            expect(nodes[0].fillOpacity).toBe(1);
            expect(nodes[1].fillOpacity).toBeLessThan(1);
            expect(nodes[2].fillOpacity).toBeLessThan(1);
        });

        it('draws the unselected markers faded when denser than a pixel', async () => {
            const denseData = Array.from({ length: 2000 }, (_, i) => ({ x: i, y: i % 7, selected: i === 0 }));
            await create({ marker: { enabled: true } }, denseData);

            const nodes = markerNodes();
            expect(nodes).toHaveLength(denseData.length);
            expect(nodes[0].fillOpacity).toBe(1);
            expect(nodes[1].fillOpacity).toBeLessThan(1);
        });
    });

    // A `marker.itemStyler` is not kept while markers are disabled, so the styler pass only runs with markers enabled.
    describe('marker itemStyler', () => {
        it('draws only the selected marker when markers are disabled', async () => {
            await create({ marker: { enabled: false, itemStyler: () => ({ fill: 'red' }) } });

            const nodes = markerNodes();
            expect(nodes).toHaveLength(1);
            expect(nodes[0].visible).toBe(true);
            expect(nodes[0].fillOpacity).toBe(1);
        });

        it('draws no markers when markers are disabled and nothing is selected', async () => {
            await create(
                { marker: { enabled: false, itemStyler: () => ({ fill: 'red' }) } },
                data.map((d) => ({ ...d, selected: false }))
            );

            expect(markerNodes()).toHaveLength(0);
        });

        it('draws the styled unselected markers faded when markers are enabled', async () => {
            await create({ marker: { enabled: true, itemStyler: () => ({ fill: 'red' }) } });

            const nodes = markerNodes();
            expect(nodes).toHaveLength(3);
            expect(nodes[0].fillOpacity).toBe(1);
            expect(nodes[1].fillOpacity).toBeLessThan(1);
            expect(nodes.every((node) => node.fill === 'red')).toBe(true);
        });
    });

    // Under `selectedOnly` the datum selection holds a subset of the node data, so it must be consulted by datum, never
    // by position.
    describe('lookups from the subset datum selection', () => {
        const hoverDatum = async (index: number) => {
            const series = deproxy(chart).series[0];
            const nodeDatum = getSeriesContextNodeData(chart).nodeData[index];
            const { canvasX, canvasY } = series.toCanvasFromMidPoint(nodeDatum);
            await hoverAction(canvasX, canvasY)(chart);
            await waitForChartStability(chart);
        };

        it('highlights the hovered unselected datum', async () => {
            await create({ marker: { enabled: false } });

            await hoverDatum(1);

            const highlight = deproxy(chart).ctx.highlightManager.getActiveHighlight();
            expect(highlight?.datum).toMatchObject({ x: 'Feb' });
            expect(highlight?.datumIndex).toBe(1);
        });

        it('highlights the hovered selected datum', async () => {
            await create({ marker: { enabled: false } });

            await hoverDatum(0);

            const highlight = deproxy(chart).ctx.highlightManager.getActiveHighlight();
            expect(highlight?.datum).toMatchObject({ x: 'Jan' });
            expect(highlight?.datumIndex).toBe(0);
        });

        it('moves keyboard focus across the datums that have no marker', async () => {
            await create({ marker: { enabled: false } });

            await tabIntoChart(chart);
            expect(getSeriesAreaFocus(chart).datumIndex).toBe(0);
            expect(getSwapChainText()).toContain('Jan');

            await pressKey(chart, 'ArrowRight');
            expect(getSeriesAreaFocus(chart).datumIndex).toBe(1);
            expect(getSwapChainText()).toContain('Feb');
            expect(chart.getState().active?.activeItem).toMatchObject({ type: 'series-node', itemId: 1 });

            await pressKey(chart, 'ArrowRight');
            expect(getSeriesAreaFocus(chart).datumIndex).toBe(2);
            expect(getSwapChainText()).toContain('Mar');
        });
    });

    describe('picking with markers disabled', () => {
        const clicks: string[] = [];

        async function createClickChart() {
            clicks.length = 0;
            await create({
                marker: { enabled: false },
                listeners: { seriesNodeClick: (event: { datum: { x: string } }) => clicks.push(event.datum.x) },
            });
        }

        async function clickDatum(index: number, offset = 0) {
            const series = deproxy(chart).series[0];
            const nodeDatum = getSeriesContextNodeData(chart).nodeData[index];
            const { canvasX, canvasY } = series.toCanvasFromMidPoint(nodeDatum);
            await clickAction(canvasX + offset, canvasY)(chart);
            await waitForChartStability(chart);
        }

        it('fires seriesNodeClick on the unselected points', async () => {
            await createClickChart();

            await clickDatum(1);
            await clickDatum(2);
            await clickDatum(0);

            expect(clicks).toEqual(['Feb', 'Mar', 'Jan']);
        });

        it('fires seriesNodeClick within the markerless pick range of an unselected point', async () => {
            await createClickChart();

            await clickDatum(1, 5);

            expect(clicks).toEqual(['Feb']);
        });
    });
});
