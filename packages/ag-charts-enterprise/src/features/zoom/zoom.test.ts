import { afterEach, describe, expect, it } from '@jest/globals';

import {
    AgCartesianChartOptions,
    AgChartInstance,
    type AgChartOptions,
    AgChartState,
    AgCharts,
    AgInitialStateZoomOptions,
} from 'ag-charts-community';
import {
    clickAction,
    delay,
    doubleClickAction,
    doubleTapAction,
    dragAction,
    extractImageData,
    hoverAction,
    mouseDownAction,
    mouseMoveAction,
    mouseUpAction,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    twoFingerEnd,
    twoFingerMove,
    twoFingerStart,
    waitForChartStability,
} from 'ag-charts-community-test';
import { DeepReadonly } from 'ag-charts-core';
import { WheelDeltaMode } from 'ag-charts-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('Zoom', () => {
    setupMockConsole();

    let chart: AgChartInstance;
    const ctx = setupMockCanvas();

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
        zoom: {
            enabled: true,
            axes: 'xy',
            scrollingStep: 0.5, // Make sure we zoom enough in a single step so we can detect it
            minVisibleItems: 1,
        },
    };

    const ORDINAL_EXAMPLE_OPTIONS: AgChartOptions = {
        data: [
            { date: new Date('2024-04-19'), value: 60 }, // Monday
            // Skipping Saturday and Sunday
            { date: new Date('2024-04-22'), value: 10 }, // Monday
            { date: new Date('2024-04-23'), value: 20 }, // Tuesday
            { date: new Date('2024-04-24'), value: 30 }, // Wednesday
            { date: new Date('2024-04-25'), value: 40 }, // Thursday
            { date: new Date('2024-04-26'), value: 50 }, // Friday
            // Skipping Saturday and Sunday
            { date: new Date('2024-04-29'), value: 60 }, // Monday
        ],
        series: [
            {
                type: 'bar',
                xKey: 'date',
                yKey: 'value',
            },
        ],
        axes: {
            x: {
                type: 'ordinal-time',
                position: 'bottom',
                parentLevel: {
                    // Force more labels to show
                    enabled: true,
                },
            },
            y: {
                type: 'number',
                position: 'left',
            },
        },
    };

    let cx: number = 0;
    let cy: number = 0;

    async function prepareChart(
        zoomOptions?: AgChartOptions['zoom'],
        initialState?: NonNullable<AgChartOptions['initialState']>['zoom'],
        baseOptions = EXAMPLE_OPTIONS
    ) {
        const options: AgChartOptions = {
            ...baseOptions,
            initialState: { zoom: initialState },
            zoom: { ...baseOptions.zoom, ...(zoomOptions ?? {}) },
        };
        prepareEnterpriseTestOptions(options);
        cx = options.width! / 2;
        cy = options.height! / 2;

        chart = AgCharts.create(options);

        // Click once in the chart to ensure the chart is active / mouse is over it to ensure the first scroll wheel
        // event is triggered.
        await waitForChartStability(chart);
        await clickAction(cx, cy)(chart);
    }

    async function prepareHorizontalBarChart(zoomOptions?: AgChartOptions['zoom']) {
        await prepareChart(zoomOptions, undefined, {
            ...EXAMPLE_OPTIONS,
            series: [{ type: 'bar', xKey: 'x', yKey: 'y', direction: 'horizontal' }],
        } as AgChartOptions);
    }

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    // Set the customSnapshotIdentifier string to check for behavioural equivalence
    // E.g. double-clicking (mouse) or double-tapping (touch) should generate the same 'reset' image-snapshot.
    const compare = async (customSnapshotIdentifier?: string) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({
            failureThreshold: 0,
            failureThresholdType: 'percent',
            customSnapshotIdentifier,
        });
    };

    describe('scrolling', () => {
        it('should zoom in', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });

        it('should zoom in then out', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, 1)(chart);
            await compare();
        });

        it('should handle infinite zoom cases', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -10000)(chart);
            // Should not zoom in
            // @todo(AG-15504) - we should zoom in as far as possible
            await compare();
        });
    });

    describe('pixel scrolling', () => {
        it('should zoom in then out', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -70, 50, WheelDeltaMode.Pixels)(chart);
            await compare();
            await scrollAction(cx, cy, 50, 50, WheelDeltaMode.Pixels)(chart);
            await compare();
        });
    });

    describe('horizontal scrolling', () => {
        it('should pan', async () => {
            // Initialise zoom
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            // Pan left
            await scrollAction(cx, cy, 0, 50, WheelDeltaMode.Pixels, -400)(chart);
            await compare();
            // Pan right
            await scrollAction(cx, cy, 0, 50, WheelDeltaMode.Pixels, 250)(chart);
            await compare();
        });
    });

    describe('anchor', () => {
        it('should zoom at the start', async () => {
            await prepareChart({ anchorPointX: 'start', anchorPointY: 'start' });
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });

        it('should zoom in the middle', async () => {
            await prepareChart({ anchorPointX: 'middle', anchorPointY: 'middle' });
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });

        it('should zoom at the end', async () => {
            await prepareChart({ anchorPointX: 'end', anchorPointY: 'end' });
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });

        it('should zoom on the pointer', async () => {
            await prepareChart({ anchorPointX: 'pointer', anchorPointY: 'pointer' });
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });
    });

    describe('min visible items', () => {
        it('should not zoom past the minimum visible items', async () => {
            await prepareChart({ minVisibleItems: 3, scrollingStep: 0.1 });
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart); // This is the limit
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });
    });

    describe('double click', () => {
        it('should reset the zoom', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await doubleClickAction(cx, cy)(chart);
            await compare('reset');
        });
        it('should reset the X axis zoom', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await doubleClickAction(400, 578)(chart);
            await compare('dblclick-x');
        });
        it('should reset the Y axis zoom', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await doubleClickAction(32, 300)(chart);
            await compare('dblclick-y');
        });
    });

    describe('double tap', () => {
        it('should reset the zoom', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await doubleTapAction(cx, cy)(chart);
            await compare('reset');
        });
        it('should reset the X axis zoom', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await doubleTapAction(400, 578)(chart);
            await compare('dblclick-x');
        });
        it('should reset the Y axis zoom', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await doubleTapAction(32, 300)(chart);
            await compare('dblclick-y');
        });
    });

    describe('panning', () => {
        it('should pan both axes', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await dragAction({ x: cx / 2, y: cy / 2 }, { x: cx + cx / 2, y: cy + cy / 2 })(chart);
            await compare();
        });
    });

    describe('select', () => {
        describe('x axis', () => {
            const a = { x: 200, y: 300 };
            const b = { x: 600, y: 300 };
            beforeEach(async () => {
                await prepareChart({ axes: 'x', enableSelecting: true });
                await mouseDownAction(a.x, a.y)(chart);
                await delay(500);
                await mouseMoveAction(a.x, a.y)(chart);
                await mouseMoveAction(b.x, b.y)(chart);
            });

            it('should render the selection', async () => {
                await compare();
            });

            it('should zoom on mouseup', async () => {
                await mouseUpAction(b.x, b.y)(chart);
                await compare();
            });
        });

        describe('y axis', () => {
            const a = { x: 400, y: 100 };
            const b = { x: 400, y: 400 };
            beforeEach(async () => {
                await prepareChart({ axes: 'y', enableSelecting: true });
                await mouseDownAction(a.x, a.y)(chart);
                await delay(500);
                await mouseMoveAction(a.x, a.y)(chart);
                await mouseMoveAction(b.x, b.y)(chart);
            });

            it('should render the selection', async () => {
                await compare();
            });

            it('should zoom on mouseup', async () => {
                await mouseUpAction(b.x, b.y)(chart);
                await compare();
            });
        });

        describe('invalid', () => {
            const a = { x: 200, y: 300 };
            const b = { x: 300, y: 300 };
            beforeEach(async () => {
                await prepareChart({ axes: 'x', enableSelecting: true, minVisibleItems: 2 });
                await mouseDownAction(a.x, a.y)(chart);
                await delay(500);
                await mouseMoveAction(a.x, a.y)(chart);
                await mouseMoveAction(b.x, b.y)(chart);
            });

            it('should render the invalid selection', async () => {
                await compare();
            });

            // TODO: This test is flaky, so we skip it for now
            it.skip('should not zoom on mouseup', async () => {
                await mouseUpAction(b.x, b.y)(chart);
                await compare('reset');
            });
        });
    });

    describe('axis dragging', () => {
        it('should zoom the x-axis from the end', async () => {
            await prepareChart();

            const from = { x: cx, y: cy * 2 - 30 };
            const to = { x: from.x - cx / 2, y: from.y };

            await hoverAction(from.x, from.y)(chart);
            await dragAction(from, to)(chart);

            await compare();
        });

        it('should zoom the y-axis from the middle', async () => {
            await prepareChart();

            const from = { x: 30, y: cy };
            const to = { x: from.x, y: from.y - cy / 2 };

            await hoverAction(from.x, from.y)(chart);
            await dragAction(from, to)(chart);

            await compare();
        });

        describe('with two y-axes', () => {
            const twoAxesOptions: AgChartOptions = {
                data: [
                    { x: 0, y: 0, y2: 700 },
                    { x: 1, y: 50, y2: 800 },
                    { x: 2, y: 25, y2: 1000 },
                    { x: 3, y: 75, y2: 600 },
                    { x: 4, y: 50, y2: 750 },
                    { x: 5, y: 25, y2: 900 },
                    { x: 6, y: 50, y2: 400 },
                    { x: 7, y: 75, y2: 800 },
                ],
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y' },
                    { type: 'line', xKey: 'x', yKey: 'y2', yKeyAxis: 'ySecondary' },
                ],
                axes: {
                    x: { position: 'bottom', type: 'number' },
                    y: { position: 'left', type: 'number' },
                    ySecondary: { position: 'right', type: 'number' },
                },
                zoom: {
                    enabled: true,
                    axes: 'xy',
                    scrollingStep: 0.5, // Make sure we zoom enough in a single step so we can detect it
                    minVisibleItems: 1,
                },
            };

            it('should zoom both axes together', async () => {
                await prepareChart(undefined, undefined, twoAxesOptions);

                const from = { x: 30, y: cy };
                const to = { x: from.x, y: from.y - cy / 2 };

                await hoverAction(from.x, from.y)(chart);
                await dragAction(from, to)(chart);

                await compare();
            });

            it('should allow independent axis zooming', async () => {
                await prepareChart(undefined, undefined, {
                    ...twoAxesOptions,
                    zoom: {
                        ...twoAxesOptions.zoom,
                        enableIndependentAxes: true,
                    } as any,
                });

                const from = { x: 30, y: cy };
                const to = { x: from.x, y: from.y - cy / 2 };

                await hoverAction(from.x, from.y)(chart);
                await dragAction(from, to)(chart);

                await compare();
            });
        });
    });

    describe('axis panning', () => {
        it('should pan the x-axis', async () => {
            await prepareChart(
                { axisDraggingMode: 'pan', enableAxisDragging: true, enablePanning: false },
                { ratioX: { start: 0, end: 0.7 } }
            );

            const from = { x: cx, y: cy * 2 - 30 };
            const to = { x: from.x - cx / 2, y: from.y };

            await hoverAction(from.x, from.y)(chart);
            await dragAction(from, to)(chart);

            await compare();
        });

        it('should pan the y-axis', async () => {
            await prepareChart(
                { axisDraggingMode: 'pan', enableAxisDragging: true, enablePanning: false },
                { ratioX: { start: 0, end: 0.7 }, ratioY: { start: 0.3, end: 1 } }
            );

            const from = { x: 30, y: cy };
            const to = { x: from.x, y: from.y - cy / 2 };

            await hoverAction(from.x, from.y)(chart);
            await dragAction(from, to)(chart);

            await compare();
        });
    });

    describe('flipped axes', () => {
        it('should zoom on the flipped axis', async () => {
            await prepareHorizontalBarChart({ axes: 'x' });
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });

        it('should zoom to minimum visible items', async () => {
            await prepareHorizontalBarChart({ axes: 'x', minVisibleItems: 3, scrollingStep: 0.1 });
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart);
            await scrollAction(cx, cy, -1)(chart); // This is the limit
            await scrollAction(cx, cy, -1)(chart);
            await compare();
        });
    });

    describe('twoFingers', () => {
        beforeEach(async () => {
            await prepareChart({ axes: 'y', enableSelecting: true });
            await twoFingerStart(1, cx - 50, cy - 50, 2, cx + 50, cy + 50)(chart);
            await twoFingerMove(1, cx - 150, cy - 150, 2, cx + 150, cy + 150)(chart);
            await twoFingerEnd(1, cx - 150, cy - 150, 2, cx + 150, cy + 150)(chart);
        });

        test('init zoomed in', async () => {
            await compare('two-fingers-init');
        });

        test('zoom back out', async () => {
            await twoFingerStart(3, cx - 100, cy - 100, 4, cx + 100, cy + 100)(chart);
            await twoFingerMove(3, cx - 50, cy - 50, 4, cx + 50, cy + 50)(chart);
            await twoFingerEnd(3, cx - 50, cy - 50, 4, cx + 50, cy + 50)(chart);
            await compare();
        });

        test('zoom out clipped', async () => {
            await twoFingerStart(3, cx - 250, cy - 250, 4, cx + 250, cy + 250)(chart);
            await twoFingerMove(3, cx - 10, cy - 10, 4, cx + 10, cy + 10)(chart);
            await twoFingerEnd(3, cx - 10, cy - 10, 4, cx + 10, cy + 10)(chart);
            await compare('reset');
        });

        test('zoom and pan', async () => {
            await twoFingerStart(3, cx - 50, cy - 50, 4, cx + 50, cy + 50)(chart);
            await twoFingerMove(3, cx - 150, cy - 80, 4, cx, cy + 80)(chart);
            await twoFingerEnd(3, cx - 150, cy - 80, 4, cx, cy + 80)(chart);
            await compare();
        });

        test('x overlap', async () => {
            await twoFingerStart(3, cx - 5, cy - 50, 4, cx + 5, cy + 50)(chart);

            await twoFingerMove(3, cx - 100, cy - 50, 4, cx + 100, cy + 50)(chart);
            await compare('two-fingers-init'); // no change (clientX average unchanged)

            await twoFingerMove(3, cx + 20, cy - 50, 4, cx + 100, cy + 50)(chart);
            await compare(); // pans left

            await twoFingerMove(3, cx + 20, cy - 65, 4, cx + 100, cy + 20)(chart);
            await compare(); // zoompans y axis
        });

        test('y overlap', async () => {
            await twoFingerStart(3, cx - 50, cy - 5, 4, cx + 50, cy + 5)(chart);
            await twoFingerMove(3, cx - 50, cy - 100, 4, cx + 50, cy + 100)(chart);
            await compare('two-fingers-init'); // no change (clientY average unchanged)

            await twoFingerMove(3, cx - 50, cy + 20, 4, cx + 50, cy + 100)(chart);
            await compare(); // pans down

            await twoFingerMove(3, cx - 150, cy + 20, 4, cx + 35, cy + 100)(chart);
            await compare(); // zoompans x axis
        });
    });

    describe('initialState', () => {
        it('should start with the given range', async () => {
            await prepareChart({}, { rangeX: { start: 3, end: 6 }, rangeY: { start: 30, end: 70 } });
            await compare();
        });

        it('should extend the range to the start', async () => {
            await prepareChart({}, { rangeX: { start: undefined, end: 6 } });
            await compare();
        });

        it('should extend the range to the end', async () => {
            await prepareChart({}, { rangeX: { start: 3, end: undefined } });
            await compare();
        });

        it('should handle ranges where the start value is not in the ordinal time axis', async () => {
            await prepareChart(
                {},
                { rangeX: { start: { __type: 'date', value: '2024-04-28' } } },
                ORDINAL_EXAMPLE_OPTIONS
            );
            await compare();
        });

        it('should handle ranges where the end value is not in the ordinal time axis', async () => {
            await prepareChart(
                {},
                { rangeX: { end: { __type: 'date', value: '2024-04-20' } } },
                ORDINAL_EXAMPLE_OPTIONS
            );
            await compare();
        });

        it('should handle ranges where neither value is in the ordinal time axis', async () => {
            await prepareChart(
                {},
                {
                    rangeX: {
                        start: { __type: 'date', value: '2024-04-20' },
                        end: { __type: 'date', value: '2024-04-28' },
                    },
                },
                ORDINAL_EXAMPLE_OPTIONS
            );
            await compare();
        });
    });

    describe('listeners', () => {
        it('should fire series click listeners', async () => {
            let clickCount: number = 0;
            await prepareChart({}, undefined, { ...EXAMPLE_OPTIONS, listeners: { click: () => clickCount++ } });
            expect(clickCount).toBe(1);
            await scrollAction(cx, cy, -1)(chart);
            await clickAction(cx, cy)(chart);
            expect(clickCount).toBe(2);
        });

        it('should fire series dblclick listeners', async () => {
            let dblclickCount: number = 0;
            await prepareChart({}, undefined, {
                ...EXAMPLE_OPTIONS,
                listeners: { doubleClick: () => dblclickCount++ },
            });
            await scrollAction(cx, cy, -1)(chart);
            await doubleClickAction(cx, cy)(chart);
            expect(dblclickCount).toBe(1);
        });

        it('should not zoom out when double clicking a node', async () => {
            await prepareChart();
            await scrollAction(cx, cy, -1)(chart);
            await doubleClickAction(148, 154)(chart); // this is the position of the 1st visible node
            await compare(); // this should be a zoomed-in snapshot
        });
    });

    describe('data changes during zoom', () => {
        it('should update the data and zoom as expected', async () => {
            const data = [
                { x: { id: 0, value: 'a', toString: () => 'a' }, y: 50 },
                { x: { id: 1, value: 'b', toString: () => 'b' }, y: 30 },
                { x: { id: 2, value: 'c', toString: () => 'c' }, y: 10 },
                { x: { id: 3, value: 'd', toString: () => 'd' }, y: 30 },
                { x: { id: 4, value: 'e', toString: () => 'e' }, y: 50 },
            ];
            const options: AgCartesianChartOptions = {
                ...EXAMPLE_OPTIONS,
                animation: { enabled: false },
                data,
            };
            await prepareChart(undefined, undefined, options);
            await scrollAction(cx, cy, -1)(chart);
            await chart.updateDelta({
                data: data.map((d) => ({ x: { ...d.x }, y: d.y + 10 })),
            });
            // Chart should not be blank
            await compare();
        });
    });

    describe('autoScaling', () => {
        it('should auto scale the y axis on a continuous x axis', async () => {
            const options: AgCartesianChartOptions = {
                ...EXAMPLE_OPTIONS,
                zoom: {
                    autoScaling: { enabled: true },
                    axes: 'x',
                    anchorPointX: 'middle',
                },
                animation: { enabled: false },
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            await prepareChart(undefined, undefined, options);
            await scrollAction(cx, cy, -2)(chart);

            await compare();
        });

        it('should auto scale the y axis on a category x axis', async () => {
            const options: AgCartesianChartOptions = {
                ...EXAMPLE_OPTIONS,
                zoom: {
                    autoScaling: { enabled: true },
                    axes: 'x',
                    anchorPointX: 'middle',
                },
                animation: { enabled: false },
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            await prepareChart(undefined, undefined, options);
            await scrollAction(cx, cy, -2)(chart);

            await compare();
        });
    });

    describe('AG-16394 reset to initialState', () => {
        const resetZoomState = {
            rangeX: {
                end: { __type: 'date', value: '2022-06-30T23:00:00.000Z' },
                // FIXME(AG-16401): Seems there's a bug with rangeX.start in Node.js (not reproducible in Chrome).
                // start: { __type: 'date', value: '2021-01-01T00:00:00.000Z' },
            },
            rangeY: {
                start: 0,
                end: 193931.85,
            },
            ratioX: {
                start: 0.8000000000000002,
                end: 1,
            },
            ratioY: {
                start: 0,
                end: 0.9696592500000001,
            },
            autoScaledAxes: [],
        } as const satisfies DeepReadonly<AgChartState['zoom']>;

        beforeEach(async () => {
            const initialState: AgInitialStateZoomOptions = {
                rangeX: {
                    start: {
                        __type: 'date',
                        value: new Date('2021-01-01').getTime(),
                    },
                },
            };
            const baseOptions: AgCartesianChartOptions = {
                data: [
                    { date: new Date(2015, 0, 1), Cost: 103268 },
                    { date: new Date(2015, 6, 1), Cost: 107487 },
                    { date: new Date(2016, 0, 1), Cost: 107297 },
                    { date: new Date(2016, 6, 1), Cost: 152988 },
                    { date: new Date(2017, 0, 1), Cost: 129825 },
                    { date: new Date(2017, 6, 1), Cost: 118553 },
                    { date: new Date(2018, 0, 1), Cost: 150835 },
                    { date: new Date(2018, 6, 1), Cost: 116414 },
                    { date: new Date(2019, 0, 1), Cost: 102183 },
                    { date: new Date(2019, 6, 1), Cost: 172169 },
                    { date: new Date(2020, 0, 1), Cost: 195021 },
                    { date: new Date(2020, 6, 1), Cost: 176255 },
                    { date: new Date(2021, 0, 1), Cost: 118050 },
                    { date: new Date(2021, 6, 1), Cost: 109300 },
                    { date: new Date(2022, 0, 1), Cost: 107878 },
                    { date: new Date(2022, 6, 1), Cost: 184697 },
                ],
                series: [
                    {
                        type: 'area',
                        xKey: 'date',
                        yKey: 'Cost',
                    },
                ],
                axes: {
                    x: {
                        type: 'unit-time',
                        position: 'bottom',
                    },
                },
                zoom: {
                    enabled: true,
                },
            };
            await prepareChart(undefined, initialState, baseOptions);
        });

        test('dblclick', async () => {
            let state: AgChartState;

            state = chart.getState();
            expect(state.zoom).toMatchObject(resetZoomState);

            await scrollAction(cx, cy, -2)(chart);
            await waitForChartStability(chart);
            state = chart.getState();
            expect(state.zoom).not.toMatchObject(resetZoomState);

            await doubleClickAction(cx, cy)(chart);
            await waitForChartStability(chart);
            state = chart.getState();
            expect(state.zoom).toMatchObject(resetZoomState);
        });
    });

    describe('navigator-minichart-sync', () => {
        type TDatum = { date: Date; price: number };

        function createSeededRng(seed: number) {
            let state = seed;
            return () => {
                state = (state * 1664525 + 1013904223) % 0xffffffff;
                return state / 0xffffffff;
            };
        }

        function getData(): TDatum[] {
            const startDate = new Date('2024-01-01');
            const data = [];
            const rand = createSeededRng(12345);

            for (let i = 0; i < 30; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                data.push({
                    date,
                    price: 100 + Math.sin(i / 5) * 20 + rand() * 10,
                });
            }

            return data;
        }

        it('should stay in sync with series-area', async () => {
            const options: AgCartesianChartOptions<TDatum> = {
                data: getData(),
                series: [{ type: 'line', xKey: 'date', yKey: 'price', marker: { enabled: true } }],
                axes: {
                    x: {
                        type: 'time',
                        position: 'bottom',
                        nice: false,
                    },
                    y: {
                        type: 'number',
                        position: 'left',
                        title: { text: 'Price' },
                    },
                },
                zoom: {
                    enabled: true,
                    onDataChange: {
                        strategy: 'preserveRatios',
                    },
                },
                navigator: {
                    enabled: true,
                    miniChart: {
                        enabled: true,
                    },
                },
            };
            await prepareChart(undefined, { ratioX: { start: 0, end: 0.25 } }, options);
            options.data = options.data!.slice(4);

            await chart.update(options);
            await compare();
        });
    });
});
