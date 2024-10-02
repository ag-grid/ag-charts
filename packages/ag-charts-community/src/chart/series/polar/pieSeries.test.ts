import { afterEach, describe, expect, jest, test } from '@jest/globals';

import type { AgPolarChartOptions } from 'ag-charts-types';

import { Transformable } from '../../../scene/transformable';
import type { Chart } from '../../chart';
import { LegendMarkerLabel } from '../../legendMarkerLabel';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    createChart,
    deproxy,
    doubleClickAction,
    expectWarningsCalls,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';
import { PieSeries } from './pieSeries';

describe('PieSeries', () => {
    setupMockConsole();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    let chart: Chart;
    const ctx = setupMockCanvas();
    const options: AgPolarChartOptions = prepareTestOptions({});

    describe('#create', () => {
        test('zerosum pie', async () => {
            chart = await createChart({
                ...options,
                data: [{ value: 0 }, { value: 0 }],
                series: [{ type: 'pie', angleKey: 'value' }],
            });
            await compare();
        });
    });

    describe('#validation', () => {
        test('missing data warning', async () => {
            chart = await createChart({
                ...options,
                data: [{ cat: '1' }, { cat: '2' }, { fox: 'L' }, { cat: '4', dog: 10 }, { cat: '5', dog: 20 }],
                series: [{ type: 'pie', calloutLabelKey: 'cat', angleKey: 'dog', sectorLabelKey: 'fox' }],
            });

            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - no value was found for the key 'dog' on 3 data elements",
  ],
  [
    "AG Charts - no value was found for the key 'cat' on 1 data element",
  ],
  [
    "AG Charts - no value was found for the key 'fox' on 4 data elements",
  ],
]
`);
        });
    });

    describe('nodeClick', () => {
        const clicks: string[] = [];
        const doubleClicks: string[] = [];
        const legendClicks: string[] = [];

        const nodeClickOptions: AgPolarChartOptions = {
            data: [
                { asset: 'Stocks', amount: 5 },
                { asset: 'Cash', amount: 5 },
                { asset: 'Bonds', amount: 0 }, // AG-12321 - nodeClick not triggered for datums after a zero value.
                { asset: 'Real Estate', amount: 5 },
                { asset: 'Commodities', amount: 5 },
            ],
            series: [
                {
                    type: 'pie',
                    angleKey: 'amount',
                    legendItemKey: 'asset',
                    listeners: {
                        nodeClick: (event) => {
                            clicks.push(event.datum.asset);
                        },
                        nodeDoubleClick: (event) => {
                            doubleClicks.push(event.datum.asset);
                        },
                    },
                },
            ],
            legend: {
                listeners: {
                    legendItemClick: (event) => {
                        legendClicks.push(event.itemId);
                    },
                },
            },
        };

        beforeEach(() => {
            clicks.splice(0, clicks.length);
            doubleClicks.splice(0, doubleClicks.length);
            legendClicks.splice(0, legendClicks.length);
        });

        it('should fire a nodeClick event for visible each sector', async () => {
            chart = await createChart(nodeClickOptions);

            const pieSeries = deproxy(chart).series[0] as PieSeries;
            for (const nodeData of pieSeries.getNodeData() ?? []) {
                if (nodeData.angleValue < 1e-10) continue;

                const { x = 0, y = 0 } = nodeData.midPoint ?? {};
                const { x: clickX, y: clickY } = Transformable.toCanvasPoint(pieSeries.contentGroup, x, y);
                await waitForChartStability(chart);
                await clickAction(clickX, clickY)(chart);
            }

            expect(clicks).toEqual(['Stocks', 'Cash', 'Real Estate', 'Commodities']);
            expect(doubleClicks).toHaveLength(0);
            expect(legendClicks).toHaveLength(0);
        });

        it('should fire a nodeDoubleClick event for visible each sector', async () => {
            chart = await createChart(nodeClickOptions);

            const pieSeries = deproxy(chart).series[0] as PieSeries;
            for (const nodeData of pieSeries.getNodeData() ?? []) {
                if (nodeData.angleValue < 1e-10) continue;

                const { x = 0, y = 0 } = nodeData.midPoint ?? {};
                const { x: clickX, y: clickY } = Transformable.toCanvasPoint(pieSeries.contentGroup, x, y);
                await waitForChartStability(chart);
                await doubleClickAction(clickX, clickY)(chart);
            }

            expect(doubleClicks).toEqual(['Stocks', 'Cash', 'Real Estate', 'Commodities']);
            expect(clicks).toHaveLength(8);
            expect(legendClicks).toHaveLength(0);
        });

        it('should not fire series events for legend clicks', async () => {
            chart = await createChart(nodeClickOptions);

            for (const { legend } of deproxy(chart).modulesManager.legends()) {
                const markerLabels = (legend as any).itemSelection?._nodes as LegendMarkerLabel[];
                for (const label of markerLabels) {
                    const { x, y } = Transformable.toCanvas(label).computeCenter();

                    await clickAction(x, y)(chart);
                    await waitForChartStability(chart);

                    await clickAction(x, y)(chart);
                    await waitForChartStability(chart);
                }
            }

            expect(doubleClicks).toHaveLength(0);
            expect(clicks).toHaveLength(0);
            expect(legendClicks).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
