import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    type AgCartesianChartOptions,
    type AgChartInstance,
    type AgChartOptions,
    type AgChartState,
    AgCharts,
    type AgInitialStateZoomOptions,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    clickAction,
    compareImageSnapshot,
    delay,
    deproxy,
    doubleClickAction,
    doubleTapAction,
    dragAction,
    findChartTarget,
    getLegendModule,
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
import { ChartAxisDirection, type DeepReadonly } from 'ag-charts-core';
import { WheelDeltaMode, dispatchEvent, wheelEvent } from 'ag-charts-test';
import type { AgNumericValue } from 'ag-charts-types';

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
        series: [{ type: 'bar', xKey: 'date', yKey: 'value' }],
        axes: {
            x: {
                type: 'ordinal-time',
                position: 'bottom',
                parentLevel: {
                    // Force more labels to show
                    enabled: true,
                },
            },
            y: { type: 'number', position: 'left' },
        },
    };

    const TIME_EXAMPLE_OPTIONS: AgChartOptions = {
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
        series: [{ type: 'bar', xKey: 'date', yKey: 'value' }],
        axes: {
            x: { type: 'time', position: 'bottom' },
            y: { type: 'number', position: 'left' },
        },
    };

    const CATEGORY_EXAMPLE_OPTIONS: AgChartOptions = {
        data: [
            { x: 'zero', y: 0 },
            { x: 'one', y: 50 },
            { x: 'two', y: 25 },
            { x: 'three', y: 75 },
            { x: 'four', y: 50 },
            { x: 'five', y: 25 },
            { x: 'six', y: 50 },
            { x: 'seven', y: 75 },
        ],
        series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
        zoom: { enabled: true, axes: 'x' },
    };

    let cx: number = 0;
    let cy: number = 0;

    async function prepareChart(
        zoomOptions?: AgChartOptions['zoom'],
        initialState?: NonNullable<AgChartOptions['initialState']>['zoom'],
        baseOptions = EXAMPLE_OPTIONS,
        clickAfterCreate = true
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
        if (clickAfterCreate) {
            await waitForChartStability(chart);
            await clickAction(cx, cy)(chart);
        }
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
        await compareImageSnapshot(chart, ctx, {
            failureThreshold: 0,
            failureThresholdType: 'percent',
            customSnapshotIdentifier,
        });
    };

    describe('visibleDomain', () => {
        it('should match the zoomed domain for cartesian number axes', async () => {
            let lastVisibleDomain: [AgNumericValue, AgNumericValue] | undefined;
            const baseOptions: AgCartesianChartOptions = {
                data: [
                    { x: 0, y: 0 },
                    { x: 10, y: 5 },
                    { x: 20, y: 10 },
                    { x: 30, y: 15 },
                    { x: 40, y: 20 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: {
                        type: 'number',
                        position: 'bottom',
                        nice: false,
                        label: {
                            formatter: (params) => {
                                lastVisibleDomain = params.visibleDomain;
                                return String(params.value);
                            },
                        },
                    },
                    y: { type: 'number', position: 'left', nice: false },
                },
                zoom: { enabled: true, axes: 'x' },
            };
            const initialState: AgInitialStateZoomOptions = {
                ratioX: { start: 0.2, end: 0.6 },
            };

            await prepareChart(undefined, initialState, baseOptions, false);
            await waitForChartStability(chart);

            const axes = deproxy(chart).axes;
            const xAxis = axes.find((axis) => axis.direction === ChartAxisDirection.X && axis.type === 'number');
            expect(xAxis).toBeDefined();
            if (xAxis == null) return;

            const domain = xAxis.scale.domain;
            const length = domain[1] - domain[0];
            const ratioX = chart.getState().zoom?.ratioX;
            const ratioStart = ratioX?.start ?? 0;
            const ratioEnd = ratioX?.end ?? 1;
            const expectedVisibleDomain: [number, number] = [
                domain[0] + ratioStart * length,
                domain[1] - (1 - ratioEnd) * length,
            ];

            expect(lastVisibleDomain).toEqual(expectedVisibleDomain);
        });
    });

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

        describe('scrollingMode is pan', () => {
            it('should pan vertically', async () => {
                await prepareChart({ scrollingMode: 'pan' }, { ratioY: { start: 0.3, end: 0.7 } });
                await scrollAction(cx, cy, -1)(chart);
                await compare();
            });
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

        it('should not warn when zooming a large-x-value bar chart fully in', async () => {
            // x-values at/above Number.MAX_SAFE_INTEGER lose float64 precision (consecutive integers
            // collapse to the same double), which at full zoom-in yields a fitted bar window with a
            // ratio marginally above 1. The offsets are added at runtime so the source carries no
            // precision-losing literal.
            const base = Number.MAX_SAFE_INTEGER;
            const revenues = [120, 150, 130, 170, 160];
            const largeXBarOptions: AgChartOptions = {
                data: revenues.map((revenue, i) => ({ x: base + i, revenue })),
                series: [{ type: 'bar', xKey: 'x', yKey: 'revenue' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };
            await prepareChart({ scrollingStep: 0.5 }, undefined, largeXBarOptions);

            // Scroll fully in until the bars reach their minimum width. The assertion is implicit:
            // setupMockConsole() fails the test on any "invalid ratio" warning at the zoom limit.
            for (let i = 0; i < 12; i++) {
                await scrollAction(cx, cy, -1)(chart);
            }
            await waitForChartStability(chart);
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

        it('AG-17205 should toggle series-area touch-action so touch pans the chart only when zoomed in, otherwise pass to the page', async () => {
            await prepareChart();
            const seriesEl = document.querySelector<HTMLElement>('.ag-charts-series-area')!;
            expect(seriesEl).not.toBeNull();
            expect(seriesEl.style.touchAction).toBe('pan-y');

            await scrollAction(cx, cy, -1)(chart);
            await waitForChartStability(chart);
            expect(seriesEl.style.touchAction).toBe('none');

            await chart.update({ ...EXAMPLE_OPTIONS, zoom: { enabled: false } });
            await waitForChartStability(chart);
            expect(seriesEl.style.touchAction).toBe('');
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

        describe('dragging to the plot edge', () => {
            // minVisibleItems: 0 removes the item-count floor so the assertion isolates the pointer/anchor
            // math from the (separate) minimum-visible-items clamp.
            const stepsPerLeg = 5;

            function plotRect(): { x: number; y: number; width: number; height: number } {
                return (deproxy(chart) as any).seriesRect;
            }

            function span(axis: 'x' | 'y'): number {
                const ratio = axis === 'x' ? chart.getState().zoom?.ratioX : chart.getState().zoom?.ratioY;
                return (ratio?.end ?? 1) - (ratio?.start ?? 0);
            }

            async function stepTo(from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
                for (let i = 1; i <= stepsPerLeg; i++) {
                    const x = from.x + ((to.x - from.x) * i) / stepsPerLeg;
                    const y = from.y + ((to.y - from.y) * i) / stepsPerLeg;
                    await mouseMoveAction(x, y)(chart);
                    await waitForChartStability(chart);
                }
            }

            // Drags from the axis grab point toward the plot edge, capturing the zoomed span shortly before the
            // edge, at the edge, and after continuing past it. The zoom must keep updating right up to the axis
            // end (not stall before it) and stop there (not continue past it).
            async function dragToEdge(
                axis: 'x' | 'y',
                grab: { x: number; y: number },
                edge: { x: number; y: number },
                past: { x: number; y: number }
            ): Promise<{ spanNearEdge: number; spanAtEdge: number; spanPastEdge: number }> {
                const nearEdge = {
                    x: grab.x + (edge.x - grab.x) * 0.8,
                    y: grab.y + (edge.y - grab.y) * 0.8,
                };

                await mouseDownAction(grab.x, grab.y)(chart);
                await mouseMoveAction(grab.x, grab.y)(chart);
                await stepTo(grab, nearEdge);
                const spanNearEdge = span(axis);
                await stepTo(nearEdge, edge);
                const spanAtEdge = span(axis);
                await stepTo(edge, past);
                const spanPastEdge = span(axis);
                await mouseUpAction(past.x, past.y)(chart);
                return { spanNearEdge, spanAtEdge, spanPastEdge };
            }

            it('stops zooming the x-axis when the pointer reaches the axis end', async () => {
                await prepareChart({ minVisibleItems: 0 });
                const plotLeft = plotRect().x;
                const axisY = cy * 2 - 30;

                const { spanNearEdge, spanAtEdge, spanPastEdge } = await dragToEdge(
                    'x',
                    { x: cx * 1.5, y: axisY },
                    { x: plotLeft, y: axisY },
                    { x: plotLeft - 100, y: axisY }
                );

                expect(spanAtEdge).toBeLessThan(spanNearEdge);
                expect(spanPastEdge).toBeCloseTo(spanAtEdge);
            });

            it('stops zooming the y-axis when the pointer reaches the plot edge', async () => {
                await prepareChart({ minVisibleItems: 0 });
                const plotTop = plotRect().y;
                const axisX = 30;

                const { spanNearEdge, spanAtEdge, spanPastEdge } = await dragToEdge(
                    'y',
                    { x: axisX, y: cy * 1.5 },
                    { x: axisX, y: plotTop },
                    { x: axisX, y: plotTop - 100 }
                );

                expect(spanAtEdge).toBeLessThan(spanNearEdge);
                expect(spanPastEdge).toBeCloseTo(spanAtEdge);
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

        it('should handle numbers on time axes without crashing', async () => {
            await prepareChart({}, { rangeX: { start: 0.2, end: 0.8 } }, TIME_EXAMPLE_OPTIONS);
            await waitForChartStability(chart);
        });

        it('should start with the given ratioX', async () => {
            await prepareChart({}, { ratioX: { start: 0.2, end: 0.8 } });
            await compare();
        });

        it('should start with the given ratioX and ratioY', async () => {
            await prepareChart({}, { ratioX: { start: 0.2, end: 0.8 }, ratioY: { start: 0.3, end: 0.7 } });
            await compare();
        });

        it('should start with the given ratioX for bar series', async () => {
            await prepareChart(
                {},
                { ratioX: { start: 0.2, end: 0.8 } },
                { ...ORDINAL_EXAMPLE_OPTIONS, zoom: { enabled: true } }
            );
            await compare();
        });

        it('should start with the given ratioX for area series', async () => {
            await prepareChart(
                {},
                { ratioX: { start: 0.2, end: 0.8 } },
                {
                    ...EXAMPLE_OPTIONS,
                    series: [{ type: 'area', xKey: 'x', yKey: 'y' }],
                }
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

        it('CRT-1117 should reset zoom on an axis whose scale type changes', async () => {
            const boxPlotOptions: AgChartOptions = {
                data: [
                    { department: 'Sales', min: 1052, q1: 4465, median: 5765, q3: 8834, max: 14852 },
                    { department: 'R&D', min: 1009, q1: 2741, median: 4377, q3: 7725, max: 14814 },
                    { department: 'HR', min: 1555, q1: 2696, median: 4071, q3: 9756, max: 19717 },
                ],
                series: [
                    {
                        type: 'box-plot',
                        xKey: 'department',
                        minKey: 'min',
                        q1Key: 'q1',
                        medianKey: 'median',
                        q3Key: 'q3',
                        maxKey: 'max',
                    },
                ],
                zoom: { enabled: true, scrollingStep: 0.1 },
            };
            await prepareChart(undefined, { ratioX: { start: 0.1, end: 1 } }, boxPlotOptions, false);
            await waitForChartStability(chart);

            await chart.update({
                ...boxPlotOptions,
                data: Array.from({ length: 200 }, (_, i) => ({ age: 17 + (i % 17) })),
                series: [{ type: 'histogram', xKey: 'age' }],
                axes: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                },
            } as AgChartOptions);
            await waitForChartStability(chart);

            const xZoom = chart.getState().zoom?.ratioX;
            expect(xZoom).toEqual({ start: 0, end: 1 });
        });

        it('CRT-1117 should not collapse x zoom via preserveDomain when only x axis type changes', async () => {
            const boxPlotOptions: AgChartOptions = {
                data: [
                    { department: 'Sales', min: 1052, q1: 4465, median: 5765, q3: 8834, max: 14852 },
                    { department: 'R&D', min: 1009, q1: 2741, median: 4377, q3: 7725, max: 14814 },
                    { department: 'HR', min: 1555, q1: 2696, median: 4071, q3: 9756, max: 19717 },
                ],
                series: [
                    {
                        type: 'box-plot',
                        xKey: 'department',
                        minKey: 'min',
                        q1Key: 'q1',
                        medianKey: 'median',
                        q3Key: 'q3',
                        maxKey: 'max',
                    },
                ],
                zoom: { enabled: true, scrollingStep: 0.1 },
            };
            await prepareChart(
                undefined,
                { ratioX: { start: 0.1, end: 1 }, ratioY: { start: 0, end: 0.5 } },
                boxPlotOptions,
                false
            );
            await waitForChartStability(chart);

            await chart.update({
                ...boxPlotOptions,
                data: Array.from({ length: 200 }, (_, i) => ({ age: 17 + (i % 17) })),
                series: [{ type: 'histogram', xKey: 'age' }],
                axes: {
                    x: { type: 'number' },
                    y: { type: 'number' },
                },
            } as AgChartOptions);
            await waitForChartStability(chart);

            const { ratioX, ratioY } = chart.getState().zoom ?? {};
            expect(ratioX).toEqual({ start: 0, end: 1 });
            expect(ratioY).toEqual({ start: 0, end: 0.5 });
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
            autoScaledAxes: ['y'],
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

        async function createMinichartChart(
            initialState: NonNullable<AgChartOptions['initialState']>['zoom'],
            myOptions: AgCartesianChartOptions<TDatum>
        ): Promise<void> {
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
                        min: 80,
                        max: 130,
                    },
                },
                ...myOptions,
            };
            await prepareChart(undefined, initialState, options, false);
        }

        it('should stay in sync with series-area', async () => {
            await createMinichartChart(
                { ratioX: { start: 0, end: 0.25 } },
                {
                    zoom: {
                        enabled: true,
                        autoScaling: {
                            enabled: false,
                        },
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
                }
            );
            await waitForChartStability(chart);
            await compare();

            await chart.updateDelta({ data: getData().slice(4) });
            await compare();
        });

        describe('AG-8627 TC10', () => {
            it('should clamp navigator handles when removing from start', async () => {
                await createMinichartChart(
                    { ratioX: { start: 0, end: 0.25 } },
                    {
                        zoom: {
                            enabled: true,
                            minVisibleItems: 0,
                            autoScaling: {
                                enabled: false,
                            },
                            onDataChange: {
                                strategy: 'preserveDomain',
                            },
                        },
                        navigator: {
                            enabled: true,
                            miniChart: {
                                enabled: true,
                            },
                            minHandle: {
                                fill: 'yellow',
                            },
                            maxHandle: {
                                fill: 'cyan',
                            },
                        },
                    }
                );
                await waitForChartStability(chart);
                await compare();

                await chart.updateDelta({ data: getData().slice(10) });
                await compare();
            });

            it('should clamp navigator handles when removing from end', async () => {
                await createMinichartChart(
                    { ratioX: { start: 0.75, end: 1 } },
                    {
                        zoom: {
                            enabled: true,
                            minVisibleItems: 0,
                            autoScaling: {
                                enabled: false,
                            },
                            onDataChange: {
                                strategy: 'preserveDomain',
                            },
                        },
                        navigator: {
                            enabled: true,
                            miniChart: {
                                enabled: true,
                            },
                            minHandle: {
                                fill: 'yellow',
                            },
                            maxHandle: {
                                fill: 'cyan',
                            },
                        },
                    }
                );
                await waitForChartStability(chart);
                await compare();

                await chart.updateDelta({ data: getData().slice(0, -10) });
                await compare();
            });

            it('should keep minVisibleItems 2 when removing from start', async () => {
                await createMinichartChart(
                    { ratioX: { start: 0, end: 0.25 } },
                    {
                        zoom: {
                            enabled: true,
                            minVisibleItems: 2,
                            autoScaling: {
                                enabled: false,
                            },
                            onDataChange: {
                                strategy: 'preserveDomain',
                            },
                        },
                        navigator: {
                            enabled: true,
                            miniChart: {
                                enabled: true,
                            },
                            minHandle: {
                                fill: 'yellow',
                            },
                            maxHandle: {
                                fill: 'cyan',
                            },
                        },
                    }
                );
                await waitForChartStability(chart);
                await chart.updateDelta({ data: getData().slice(10) });
                await compare();
            });

            it('should keep minVisibleItems 2 when removing from end', async () => {
                await createMinichartChart(
                    { ratioX: { start: 0.75, end: 1 } },
                    {
                        zoom: {
                            enabled: true,
                            minVisibleItems: 2,
                            autoScaling: {
                                enabled: true,
                            },
                            onDataChange: {
                                strategy: 'preserveDomain',
                            },
                        },
                        navigator: {
                            enabled: true,
                            miniChart: {
                                enabled: true,
                            },
                            minHandle: {
                                fill: 'yellow',
                            },
                            maxHandle: {
                                fill: 'cyan',
                            },
                        },
                    }
                );
                await waitForChartStability(chart);
                await chart.updateDelta({ data: getData().slice(0, -10) });
                await compare();
            });
        });
    });

    // CRT-1042: Scrolling mousewheel on axis area should zoom AND call preventDefault.
    // CRT-1050: Non-cancelable wheel events (trackpad inertia) should be ignored on axes.
    describe('CRT-1042/1050 axis wheel zoom', () => {
        it('should zoom the y-axis via wheel scroll and call preventDefault (CRT-1042)', async () => {
            await prepareChart({
                enabled: true,
                axes: 'xy',
                enableAxisScrolling: true,
                scrollingStep: 0.5,
                minVisibleItems: 1,
            });

            const stateBefore = chart.getState().zoom;
            const target = findChartTarget(deproxy(chart), 30, cy);
            const event = wheelEvent(target, { deltaX: 0, deltaY: -100, deltaMode: WheelDeltaMode.Pixels });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            dispatchEvent(target, event);
            await delay(50);
            await waitForChartStability(chart);
            const stateAfter = chart.getState().zoom;

            expect(stateAfter!.ratioY).not.toEqual(stateBefore?.ratioY);
            expect(preventDefaultSpy).toHaveBeenCalled();
            await compare();
        });

        it('should zoom the x-axis via wheel scroll and call preventDefault (CRT-1042)', async () => {
            await prepareChart({
                enabled: true,
                axes: 'xy',
                enableAxisScrolling: true,
                scrollingStep: 0.5,
                minVisibleItems: 1,
            });

            const stateBefore = chart.getState().zoom;
            const target = findChartTarget(deproxy(chart), cx, cy * 2 - 30);
            const event = wheelEvent(target, { deltaX: 0, deltaY: -100, deltaMode: WheelDeltaMode.Pixels });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            dispatchEvent(target, event);
            await delay(50);
            await waitForChartStability(chart);
            const stateAfter = chart.getState().zoom;

            expect(stateAfter!.ratioX).not.toEqual(stateBefore?.ratioX);
            expect(preventDefaultSpy).toHaveBeenCalled();
            await compare();
        });

        it('should ignore non-cancelable wheel events on axes (CRT-1050)', async () => {
            await prepareChart({
                enabled: true,
                axes: 'xy',
                enableAxisScrolling: true,
                scrollingStep: 0.5,
                minVisibleItems: 1,
            });

            const stateBefore = chart.getState().zoom;
            const target = findChartTarget(deproxy(chart), 30, cy);
            const event = wheelEvent(target, {
                deltaX: 0,
                deltaY: -100,
                deltaMode: WheelDeltaMode.Pixels,
                cancelable: false,
            });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
            dispatchEvent(target, event);
            await delay(50);
            await waitForChartStability(chart);

            const stateAfter = chart.getState().zoom;
            expect(stateAfter).toEqual(stateBefore);
            expect(preventDefaultSpy).not.toHaveBeenCalled();
        });
    });

    describe('bigint axis domains (AG-16608)', () => {
        // Out-of-safe-range y-values: zoom and state round-trips must flow bigint domains without error.
        const BIG = 9_007_199_254_740_993n; // Number.MAX_SAFE_INTEGER + 2
        const BIGINT_EXAMPLE_OPTIONS: AgChartOptions = {
            data: [
                { x: 0, y: BIG },
                { x: 1, y: BIG * 3n },
                { x: 2, y: BIG * 2n },
                { x: 3, y: BIG * 4n },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: { type: 'number', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
            zoom: { enabled: true, axes: 'xy' },
        };

        it('should scroll-zoom a bigint-axis chart without error', async () => {
            await prepareChart(undefined, undefined, BIGINT_EXAMPLE_OPTIONS);
            await scrollAction(cx, cy, -1)(chart);
            await waitForChartStability(chart);

            expect(chart.getState().zoom).toBeDefined();
        });

        it('should round-trip getState/setState on a bigint-axis chart', async () => {
            await prepareChart(undefined, { ratioX: { start: 0.2, end: 0.6 } }, BIGINT_EXAMPLE_OPTIONS, false);
            await waitForChartStability(chart);

            const saved = chart.getState();
            await chart.setState(saved);
            await waitForChartStability(chart);

            // The bigint-derived zoom range must survive the encode/decode round-trip exactly (the float
            // ratio can drift by 1 ULP, which is pre-existing and unrelated to bigint).
            expect(chart.getState().zoom?.rangeY).toEqual(saved.zoom?.rangeY);
        });

        // The same zoom range endpoints supplied as `number` and as `bigint` must produce the
        // same zoom state.
        it('should produce the same zoom for bigint and number rangeX endpoints', async () => {
            // Explicit number axes: on the default category x-axis a bigint is a type-distinct
            // category key, which is out of scope for the continuous-axis range widening.
            const numberAxesOptions: AgChartOptions = {
                ...EXAMPLE_OPTIONS,
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
            };

            await prepareChart(undefined, { rangeX: { start: 3, end: 6 } }, numberAxesOptions, false);
            await waitForChartStability(chart);
            const numberZoom = chart.getState().zoom;
            chart.destroy();

            // Provided state must be pre-encoded (the memento contract), so bigint endpoints arrive in
            // the `{ __type: 'bigint' }` form and decode back to bigints before the zoom range applies.
            const encodedBigint = (value: string) => ({ __type: 'bigint', value }) as never;
            await prepareChart(
                undefined,
                { rangeX: { start: encodedBigint('3'), end: encodedBigint('6') } },
                numberAxesOptions,
                false
            );
            await waitForChartStability(chart);
            const bigintZoom = chart.getState().zoom;

            // A working rangeX yields a strict sub-range zoom; guard against both variants silently
            // falling back to the full [0, 1] range.
            expect(numberZoom?.ratioX).toBeDefined();
            expect(numberZoom?.ratioX).not.toEqual({ start: 0, end: 1 });
            expect(bigintZoom).toEqual(numberZoom);
        });

        it('should preserve the domain across a data update on a bigint axis without error', async () => {
            // The zoomOnDataChange preserveDomain interpolation must narrow a bigint domain to
            // Number without reporting "Unexpected range types".
            await prepareChart(
                { onDataChange: { strategy: 'preserveDomain' } },
                { ratioX: { start: 0.2, end: 0.6 } },
                BIGINT_EXAMPLE_OPTIONS,
                false
            );
            await waitForChartStability(chart);

            await chart.updateDelta({ data: [...BIGINT_EXAMPLE_OPTIONS.data!, { x: 4, y: BIG * 5n }] });
            await waitForChartStability(chart);

            expect(chart.getState().zoom?.ratioX).toBeDefined();
        });

        it('should serialize bigint zoom state', async () => {
            await prepareChart(
                undefined,
                { rangeX: { start: { __type: 'bigint', value: '9007199254740994' } } },
                {
                    data: [
                        { x: 9007199254740990n, y: 1 },
                        { x: 9007199254740992n, y: 2 },
                        { x: 9007199254740994n, y: 3 },
                        { x: 9007199254740996n, y: 4 },
                        { x: 9007199254740998n, y: 3 },
                    ],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: { type: 'number', position: 'bottom' },
                        y: { type: 'number', position: 'left' },
                    },
                    zoom: { enabled: true, axes: 'x' },
                },
                false
            );
            await waitForChartStability(chart);

            const state = chart.getState().zoom;
            expect(state).toMatchObject({
                rangeX: {
                    start: { __type: 'bigint', value: '9007199254740994' },
                    end: { __type: 'bigint', value: '9007199254740998' },
                },
            });
        });
    });

    describe('category axes', () => {
        it('should zoom on a category axis', async () => {
            await prepareChart(
                {},
                {
                    rangeX: {
                        start: { value: 'three', groupPercentage: 0 },
                        end: { value: 'five', groupPercentage: 0.6 },
                    },
                },
                CATEGORY_EXAMPLE_OPTIONS
            );
            await compare();
        });

        it('should report a sub-category groupPercentage when zoomed mid-band', async () => {
            await prepareChart(
                {},
                {
                    rangeX: {
                        start: { value: 'three', groupPercentage: 0.2 },
                        end: { value: 'five', groupPercentage: 0.6 },
                    },
                },
                CATEGORY_EXAMPLE_OPTIONS
            );
            await waitForChartStability(chart);

            const { rangeX } = chart.getState().zoom ?? {};
            const start = rangeX?.start as { value: string; groupPercentage: number } | undefined;
            const end = rangeX?.end as { value: string; groupPercentage: number } | undefined;

            expect(start).toBeDefined();
            expect(start!.value).toBe('three');
            expect(start!.groupPercentage).toBeCloseTo(0.2);

            expect(end).toBeDefined();
            expect(end!.value).toBe('five');
            expect(end!.groupPercentage).toBeCloseTo(0.6);
        });
    });

    describe('CRT-1193 legend hover during a series-area drag', () => {
        const LEGEND_EXAMPLE_OPTIONS: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            data: [
                { x: 0, y: 0, y2: 10 },
                { x: 1, y: 50, y2: 20 },
                { x: 2, y: 25, y2: 30 },
                { x: 3, y: 75, y2: 40 },
                { x: 4, y: 50, y2: 50 },
                { x: 5, y: 25, y2: 60 },
                { x: 6, y: 50, y2: 70 },
                { x: 7, y: 75, y2: 80 },
            ],
            series: [
                { type: 'line', xKey: 'x', yKey: 'y', yName: 'Series Y' },
                { type: 'line', xKey: 'x', yKey: 'y2', yName: 'Series Y2' },
            ],
            legend: { enabled: true },
        } as AgChartOptions;

        it('should drop legend hover while a real drag holds ZoomDrag', async () => {
            await prepareChart({ axes: 'x', enableSelecting: true }, undefined, LEGEND_EXAMPLE_OPTIONS);
            await waitForChartStability(chart);

            const instance = deproxy(chart);
            const { highlightManager, interactionManager, tooltipManager } = instance.ctx;
            const legend = getLegendModule(instance);
            const items = legend.itemSelection.nodes();

            const updateTooltip = vi.spyOn(tooltipManager, 'updateTooltip');
            const removeTooltip = vi.spyOn(tooltipManager, 'removeTooltip');

            // Positive control: the same hover on the same chart does highlight, and does reach the
            // tooltip manager, when nothing is dragging.
            legend.onHover(new MouseEvent('mouseenter'), items[0]);
            expect(highlightManager.getActiveHighlight()?.series.id).toBe(items[0].datum?.id);
            expect(updateTooltip.mock.calls.length + removeTooltip.mock.calls.length).toBeGreaterThan(0);

            // Legend highlight clears are deferred to batch stop, so the baseline has to be allowed
            // to land before the suppression case is measured against it.
            legend.onLeave();
            await waitForChartStability(chart);
            expect(highlightManager.getActiveHighlight()).toBeUndefined();

            // A real series-area drag: mouse down inside the series area, then two moves without a
            // mouse up, which is what leaves the chart mid-drag.
            const { x, y, width, height } = (instance as any).seriesRect;
            const from = { x: x + width * 0.25, y: y + height * 0.5 };
            const to = { x: x + width * 0.75, y: y + height * 0.5 };
            await mouseDownAction(from.x, from.y)(chart);
            await delay(500);
            await mouseMoveAction(from.x, from.y)(chart);
            await mouseMoveAction(to.x, to.y)(chart);

            // The drag's own updates request layout with skipAnimations, so no animation batch is in
            // flight to outrank ZoomDrag in the state queue - isState() reads only its lowest set bit.
            expect(interactionManager.isState(_ModuleSupport.InteractionState.ZoomDrag)).toBe(true);

            updateTooltip.mockClear();
            removeTooltip.mockClear();

            legend.onHover(new MouseEvent('mouseenter'), items[1]);

            // The hover must be dropped before it reaches either manager: highlight application is
            // separately gated on the state queue, so the tooltip calls are what distinguish the
            // guard returning early from a highlight that merely never lands.
            expect(updateTooltip).not.toHaveBeenCalled();
            expect(removeTooltip).not.toHaveBeenCalled();
            expect(highlightManager.getActiveHighlight()).toBeUndefined();

            await mouseUpAction(to.x, to.y)(chart);
            updateTooltip.mockRestore();
            removeTooltip.mockRestore();
        });
    });
});
