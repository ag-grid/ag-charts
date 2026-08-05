import { afterEach, describe, expect, it } from 'vitest';

import {
    type AgCartesianAxisCrossAt,
    type AgCartesianChartOptions,
    type AgChartOptions,
    AgCharts,
} from 'ag-charts-community';
import {
    clickAction,
    compareImageSnapshot,
    contextMenuAction,
    dragAction,
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
        await compareImageSnapshot(chart, ctx, {
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
                minVisibleItems: 1,
            },
        };

        let cx: number = 0;
        let cy: number = 0;

        async function prepareChart(initialState?: AgChartOptions['initialState'], baseOptions = EXAMPLE_OPTIONS) {
            const options: AgChartOptions = {
                ...baseOptions,
                initialState: {
                    ...baseOptions.initialState,
                    ...(initialState ?? {}),
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

        it('should init with initial zoom state', async () => {
            await prepareChart({ zoom: { ratioX: { start: 0.1, end: 0.3 } } });
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
                minVisibleItems: 1,
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

    describe('Zoom and crossAt', () => {
        const EXAMPLE_OPTIONS: AgCartesianChartOptions = {
            data: [
                { x: -3, y: -30 },
                { x: -2, y: 20 },
                { x: -1, y: -10 },
                { x: 0, y: 0 },
                { x: 1, y: 10 },
                { x: 2, y: -20 },
                { x: 3, y: 30 },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            zoom: { enabled: true, axes: 'xy' },
            initialState: { zoom: { ratioX: { start: 0.25, end: 0.75 }, ratioY: { start: 0.25, end: 0.75 } } },
        };

        let cx: number = 0;
        let cy: number = 0;

        async function prepareChart(crossAt: AgCartesianAxisCrossAt) {
            const options: AgCartesianChartOptions = {
                ...EXAMPLE_OPTIONS,
                axes: {
                    x: { type: 'number', position: 'bottom', title: { text: 'X Axis' }, crossAt },
                    y: { type: 'number', position: 'left', title: { text: 'Y Axis' }, crossAt },
                },
            };
            prepareEnterpriseTestOptions(options);
            cx = options.width! / 2;
            cy = options.height! / 2;

            chart = AgCharts.create(options);
            await waitForChartStability(chart);
        }

        function getZoomRatios() {
            const { ratioX, ratioY } = chart.getState().zoom ?? {};
            expect(ratioX).toBeDefined();
            expect(ratioY).toBeDefined();
            return { ratioX, ratioY };
        }

        const crossAtCases = [
            { name: 'crossing at a value', crossAt: { value: 0 } },
            { name: 'the title at the edge', crossAt: { value: 0, titlePlacement: 'edge' } },
            { name: 'the labels at the edge', crossAt: { value: 0, labelsPlacement: 'edge' } },
            {
                name: 'the title and labels at the edge',
                crossAt: { value: 0, titlePlacement: 'edge', labelsPlacement: 'edge' },
            },
        ] satisfies { name: string; crossAt: AgCartesianAxisCrossAt }[];

        // Axes positioned with `crossAt` share the series area, so they only claim the pointer where they
        // are drawn — dragging elsewhere in the series area must still pan the chart.
        it.each(crossAtCases)('should pan the chart when dragging away from axes with $name', async ({ crossAt }) => {
            await prepareChart(crossAt);

            const before = getZoomRatios();

            // A quadrant away from both the crossing point and the edges of the series area.
            const from = { x: cx - 100, y: cy + 100 };
            const to = { x: from.x + 50, y: from.y - 50 };

            await hoverAction(from.x, from.y)(chart);
            await dragAction(from, to)(chart);

            // Panning shifts both axis windows without resizing them; dragging an axis resizes one of them.
            const after = getZoomRatios();
            expect(after.ratioX.end - after.ratioX.start).toBeCloseTo(before.ratioX.end - before.ratioX.start);
            expect(after.ratioY.end - after.ratioY.start).toBeCloseTo(before.ratioY.end - before.ratioY.start);
            expect(after.ratioX.start).not.toBeCloseTo(before.ratioX.start);
            expect(after.ratioY.start).not.toBeCloseTo(before.ratioY.start);
        });
    });
});
