import { afterEach, describe, expect, it } from '@jest/globals';

import { type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    clickAction,
    contextMenuAction,
    dragAction,
    expectWarningsToMatchSnapshots,
    extractImageData,
    hoverAction,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../test/utils';
import { DEFAULT_CONTEXT_MENU_CLASS } from './context-menu/contextMenuStyles';

describe('Feature Combinations', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({
            failureThreshold: 0,
            failureThresholdType: 'percent',
        });
    };

    describe('Navigator and Zoom', () => {
        const EXAMPLE_OPTIONS: AgChartOptions = {
            data: [
                { x: 0, y: 0 },
                { x: 1, y: 50 },
                { x: 2, y: 25 },
                { x: 3, y: 75 },
                { x: 4, y: 50 },
                { x: 5, y: 25 },
                { x: 6, y: 50 },
                { x: 7, y: 75 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            navigator: {
                enabled: true,
            },
            zoom: {
                enabled: true,
                axes: 'xy',
                scrollingStep: 0.5,
                minVisibleItemsX: 1,
                minVisibleItemsY: 1,
            },
        };

        let cx: number = 0;
        let cy: number = 0;

        async function prepareChart(
            navigator?: AgChartOptions['navigator'],
            zoom?: AgChartOptions['zoom'],
            baseOptions = EXAMPLE_OPTIONS
        ) {
            const options: AgChartOptions = {
                ...baseOptions,
                navigator: {
                    ...baseOptions.navigator,
                    ...(navigator ?? {}),
                },
                zoom: {
                    ...baseOptions.zoom,
                    ...(zoom ?? {}),
                },
            };
            prepareEnterpriseTestOptions(options);
            cx = options.width! / 2;
            cy = options.height! / 2;

            chart = AgCharts.create(options);

            // Click once in the chart to ensure the chart is active / mouse is over it to ensure the first scroll
            // wheel event is triggered.
            await waitForChartStability(chart);
            await clickAction(cx, cy)(chart);
        }

        it('should zoom then navigate', async () => {
            await prepareChart();

            // Zoom
            await scrollAction(cx, cy, -1)(chart);
            await compare();

            // Move navigator handle
            let from = { x: 417, y: 565 };
            let to = { x: from.x + 100, y: from.y };

            await dragAction(from, to)(chart);

            await compare();

            // Drag navigator slider
            from = { x: to.x + 20, y: to.y };
            to = { x: to.x - 100, y: to.y };

            await hoverAction(from.x, from.y)(chart);
            await dragAction(from, to)(chart);

            await compare();
        });

        it('should init with navigator min/max', async () => {
            await prepareChart({ min: 0.1, max: 0.3 });
            await compare();
        });

        it('should init with zoom ratio', async () => {
            await prepareChart(undefined, { ratioX: { start: 0.7, end: 0.9 } });
            await compare();
        });

        it('should prioritise zoom ratio over navigator min/max', async () => {
            await prepareChart({ min: 0.1, max: 0.3 }, { ratioX: { start: 0.7, end: 0.9 } });
            expectWarningsToMatchSnapshots();
            await compare();
        });

        it('should prioritise zoom range over navigator min/max', async () => {
            await prepareChart({ min: 0.1, max: 0.3 }, { rangeX: { start: 3, end: 6 } });
            await compare();
        });
    });

    describe('Context Menu and Zoom', () => {
        const EXAMPLE_OPTIONS: AgChartOptions = {
            data: [
                { x: 0, y: 0 },
                { x: 1, y: 50 },
                { x: 2, y: 25 },
                { x: 3, y: 75 },
                { x: 4, y: 50 },
                { x: 5, y: 25 },
                { x: 6, y: 50 },
                { x: 7, y: 75 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            contextMenu: {
                enabled: true,
            },
            zoom: {
                enabled: true,
                axes: 'xy',
                scrollingStep: 0.5,
                minVisibleItemsX: 1,
                minVisibleItemsY: 1,
            },
        };

        let cx: number = 0;
        let cy: number = 0;

        async function prepareChart(
            contextMenu?: AgChartOptions['contextMenu'],
            zoom?: AgChartOptions['zoom'],
            baseOptions = EXAMPLE_OPTIONS
        ) {
            const options: AgChartOptions = {
                ...baseOptions,
                contextMenu: {
                    ...baseOptions.contextMenu,
                    ...(contextMenu ?? {}),
                },
                zoom: {
                    ...baseOptions.zoom,
                    ...(zoom ?? {}),
                },
            };
            prepareEnterpriseTestOptions(options);
            cx = options.width! / 2;
            cy = options.height! / 2;

            chart = AgCharts.create(options);

            await waitForChartStability(chart);
            await clickAction(cx, cy)(chart);
        }

        const compareContextMenu = async () => {
            await waitForChartStability(chart);
            expect(document.body.getElementsByClassName(DEFAULT_CONTEXT_MENU_CLASS)).toMatchSnapshot();
        };

        it('when fully zoomed out it should only enable the zoom option', async () => {
            await prepareChart();
            await contextMenuAction(cx, cy)(chart);
            await compareContextMenu();
        });

        it('when zoomed in it should enable both the zoom and pan options', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await contextMenuAction(cx, cy)(chart);
            await compareContextMenu();
        });

        it('when fully zoomed in it should only enable the pan option', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -2)(chart);
            await contextMenuAction(cx, cy)(chart);
            await compareContextMenu();
        });
    });
});
