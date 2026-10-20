import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BBox, ChartUpdateType, Line, getDocument } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import {
    findAxis,
    getAxisBandExtent,
    getAxisBandwidth,
    getAxisDomain,
    getAxisGridGroupById,
    getAxisLabelNodes,
    getAxisLabelSource,
    getAxisLabelTexts,
    getAxisLayoutState,
    getAxisLinePosition,
    getAxisTitleText,
    getLabelSegmentAlignments,
    getLabelText,
    getSeriesRect,
    pickAxisValue,
    spyOnAxisTickLayout,
} from './axisAccessors';
import {
    createChart,
    deproxy,
    emitFontLoad,
    resizeChartContainer,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './utils';

describe('axis test accessors', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const options: AgCartesianChartOptions = {
        data: [
            { category: 'A', value: 10 },
            { category: 'B', value: 20 },
            { category: 'C', value: 15 },
        ],
        axes: {
            x: {
                type: 'category',
                position: 'bottom',
                title: { enabled: true, text: 'Letters' },
                // An empty label is laid out as a hidden node: it stays in the scene graph, undrawn.
                label: { formatter: ({ value }) => (value === 'B' ? '' : String(value)) },
            },
            y: { type: 'number', position: 'left' },
        },
        series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
    };

    describe('findAxis', () => {
        it('finds an axis by position and by id', async () => {
            chart = await createChart(options);

            expect(findAxis(chart, 'bottom').type).toBe('category');
            expect(findAxis(chart, 'left').type).toBe('number');
            expect(findAxis(chart, 'x')).toBe(findAxis(chart, 'bottom'));
            expect(findAxis(chart, 'y')).toBe(findAxis(chart, 'left'));
        });

        it('fails for an axis the chart does not have', async () => {
            chart = await createChart(options);

            expect(() => findAxis(chart, 'top')).toThrow();
        });
    });

    describe('getAxisLabelNodes', () => {
        it('returns the drawn label nodes by default', async () => {
            chart = await createChart(options);

            const nodes = getAxisLabelNodes(chart, 'bottom');
            expect(nodes.map((node) => node.datum.text)).toEqual(['A', 'C']);
            expect(nodes.every((node) => node.datum.visible)).toBe(true);
        });

        it('returns the hidden label nodes too with `visibleOnly: false`', async () => {
            chart = await createChart(options);

            const nodes = getAxisLabelNodes(chart, 'bottom', { visibleOnly: false });
            expect(nodes.map((node) => node.datum.text)).toEqual(['A', '', 'C']);
            expect(nodes.filter((node) => !node.datum.visible)).toHaveLength(1);
        });

        it('returns no nodes when the labels are disabled', async () => {
            chart = await createChart({
                ...options,
                axes: { ...options.axes, x: { type: 'category', position: 'bottom', label: { enabled: false } } },
            });

            expect(getAxisLabelNodes(chart, 'bottom', { visibleOnly: false })).toHaveLength(0);
        });
    });

    describe('getAxisLabelTexts', () => {
        it('returns the rendered text of the labels, in both modes', async () => {
            chart = await createChart(options);

            expect(getAxisLabelTexts(chart, 'bottom')).toEqual(['A', 'C']);
            expect(getAxisLabelTexts(chart, 'bottom', { visibleOnly: false })).toEqual(['A', 'C']);
            expect(getAxisLabelTexts(chart, 'left').length).toBeGreaterThan(1);
        });

        it('joins the segments of a rich-text label', async () => {
            chart = await createChart({
                ...options,
                axes: {
                    ...options.axes,
                    x: {
                        type: 'category',
                        position: 'bottom',
                        label: {
                            formatter: ({ value }) => [
                                { text: `<${String(value)}`, fontSize: 20 },
                                { text: '>', fontSize: 10, verticalAlign: 'top' },
                            ],
                        },
                    },
                },
            });

            expect(getAxisLabelTexts(chart, 'bottom')).toEqual(['<A>', '<B>', '<C>']);
            const [node] = getAxisLabelNodes(chart, 'bottom');
            expect(getLabelText(node)).toBe('<A>');
            expect(getLabelSegmentAlignments(node)).toEqual([undefined, 'top']);
        });
    });

    describe('getAxisTitleText', () => {
        it('returns the title as laid out', async () => {
            chart = await createChart(options);

            expect(getAxisTitleText(chart, 'bottom')).toBe('Letters');
        });
    });

    describe('getSeriesRect', () => {
        it('returns the laid out series rect', async () => {
            chart = await createChart(options);

            const { width, height } = getSeriesRect(chart);
            expect(width).toBeGreaterThan(0);
            expect(height).toBeGreaterThan(0);
        });
    });

    describe('band accessors', () => {
        it('reports the bandwidth of a category axis and none for a continuous one', async () => {
            chart = await createChart(options);

            expect(getAxisBandwidth(chart, 'bottom')).toBeGreaterThan(1);
            expect(getAxisBandwidth(chart, 'left')).toBe(0);
        });

        it('reports the extent of the band a value sits in', async () => {
            chart = await createChart(options);

            const bandwidth = getAxisBandwidth(chart, 'bottom');
            const a = getAxisBandExtent(chart, 'bottom', 'A');
            const c = getAxisBandExtent(chart, 'bottom', 'C');
            expect(a.bandwidth).toBe(bandwidth);
            expect(a.end - a.start).toBeCloseTo(bandwidth, 5);
            expect(c.start).toBeGreaterThan(a.end);
        });

        it('places the bands in reverse on a reversed axis', async () => {
            chart = await createChart({
                ...options,
                axes: { ...options.axes, x: { type: 'category', position: 'bottom', reverse: true } },
            });

            const a = getAxisBandExtent(chart, 'bottom', 'A');
            const c = getAxisBandExtent(chart, 'bottom', 'C');
            expect(a.bandwidth).toBeGreaterThan(1);
            expect(a.end - a.start).toBeCloseTo(a.bandwidth, 5);
            // Unreversed, A is the first band and C the last (see above); reversed, A comes after C.
            expect(a.start).toBeGreaterThanOrEqual(c.end);
        });
    });

    describe('getAxisDomain', () => {
        it('returns the domain of a category and of a number axis', async () => {
            chart = await createChart(options);

            expect(getAxisDomain(chart, 'bottom')).toEqual(['A', 'B', 'C']);
            const [min, max] = getAxisDomain(chart, 'left').map(Number);
            expect(min).toBe(0);
            expect(max).toBeGreaterThanOrEqual(20);
        });

        it('returns a copy that cannot move the scale', async () => {
            chart = await createChart(options);

            getAxisDomain(chart, 'bottom').push('D');
            expect(getAxisDomain(chart, 'bottom')).toEqual(['A', 'B', 'C']);
        });
    });

    describe('pickAxisValue', () => {
        it('picks the datum the axis draws at a value', async () => {
            chart = await createChart(options);

            for (const [index, value] of ['A', 'B', 'C'].entries()) {
                const pick = pickAxisValue(chart, 'bottom', value);
                expect(pick).toMatchObject({ value, index });
            }
        });

        it('picks along the vertical direction of a vertical axis', async () => {
            chart = await createChart(options);

            const pick = pickAxisValue(chart, 'left', 10);
            expect(pick).toBeDefined();
            expect(pick!.axisId).toBe(findAxis(chart, 'left').id);
            expect(Number(pick!.value)).toBeCloseTo(10, 0);
        });

        it('picks the same datum on a reversed axis', async () => {
            chart = await createChart({
                ...options,
                axes: { ...options.axes, x: { type: 'category', position: 'bottom', reverse: true } },
            });

            // The index counts from the first tick drawn, so it runs the other way here.
            expect(pickAxisValue(chart, 'bottom', 'A')).toMatchObject({ value: 'A', index: 2 });
            expect(pickAxisValue(chart, 'bottom', 'C')).toMatchObject({ value: 'C', index: 0 });
        });
    });

    describe('getAxisLabelSource', () => {
        it('returns the source contributing the drawn labels as obstacles', async () => {
            chart = await createChart(options);

            const obstacles = getAxisLabelSource(chart, 'bottom').getLabelObstacles(BBox.zero);
            expect(obstacles).toHaveLength(getAxisLabelNodes(chart, 'bottom').length);
            expect(obstacles.length).toBeGreaterThan(0);
        });
    });

    describe('getAxisLayoutState', () => {
        it('returns the layout the axis reports for its position', async () => {
            chart = await createChart(options);

            const layout = getAxisLayoutState(chart, 'bottom');
            expect(layout.id).toBe(findAxis(chart, 'bottom').id);
            expect(layout.position).toBe('bottom');
            expect(layout.rect.width).toBeGreaterThan(0);
            expect(getAxisLayoutState(chart, 'left').position).toBe('left');
        });
    });

    describe('getAxisLinePosition', () => {
        it('returns where the scene draws the line of a horizontal and of a vertical axis', async () => {
            chart = await createChart({ ...options, width: 600, height: 400 });

            const { x, y, height } = getSeriesRect(chart);
            const bottom = getAxisLinePosition(chart, 'bottom');
            const left = getAxisLinePosition(chart, 'left');

            // The rendered translation is floored, so it lands within a pixel below the exact position.
            expect(bottom.y).toBeGreaterThan(0);
            expect(Math.abs(bottom.y - (y + height))).toBeLessThanOrEqual(1);
            expect(left.x).toBeGreaterThan(0);
            expect(Math.abs(left.x - x)).toBeLessThanOrEqual(1);
        });

        it('fails for an axis the chart does not have', async () => {
            chart = await createChart(options);

            expect(() => getAxisLinePosition(chart, 'top')).toThrow();
        });
    });

    describe('getAxisGridGroupById', () => {
        it('returns the group holding the grid lines of the axis with the id', async () => {
            chart = await createChart({
                ...options,
                axes: {
                    x: { ...options.axes!.x, gridLine: { enabled: false } },
                    y: { type: 'number', position: 'left', gridLine: { enabled: true } },
                },
            });

            const gridLines = (id: string) =>
                Array.from(getAxisGridGroupById(chart, id).descendants()).filter((node) => node instanceof Line);
            expect(gridLines('y')).toHaveLength(getAxisLabelNodes(chart, 'left').length);
            expect(gridLines('x')).toHaveLength(0);
        });

        it('fails for an axis the chart does not have', async () => {
            chart = await createChart(options);

            expect(() => getAxisGridGroupById(chart, 'missing')).toThrow();
        });
    });

    describe('spyOnAxisTickLayout', () => {
        it('records the tick layouts of the axis at the position, and not of another', async () => {
            chart = await createChart(options);
            const bottom = spyOnAxisTickLayout(chart, 'bottom');
            const left = spyOnAxisTickLayout(chart, 'left');
            expect(bottom).not.toHaveBeenCalled();
            expect(left).not.toHaveBeenCalled();

            // The tick layout is cached while the domain, range and fonts stay as they are.
            deproxy(chart).update(ChartUpdateType.PERFORM_LAYOUT);
            await waitForChartStability(chart);
            expect(bottom).not.toHaveBeenCalled();
            expect(left).not.toHaveBeenCalled();

            // Fonts change the measured text, so every axis lays its ticks out again.
            await emitFontLoad(chart);
            expect(bottom).toHaveBeenCalled();
            expect(left).toHaveBeenCalled();
            expect(bottom.mock.contexts.every((axis) => axis === findAxis(chart, 'bottom'))).toBe(true);
            expect(left.mock.contexts.every((axis) => axis === findAxis(chart, 'left'))).toBe(true);
        });
    });

    describe('harness actions', () => {
        let container: HTMLElement;

        beforeEach(() => {
            container = getDocument().createElement('div');
            getDocument().body.append(container);
        });

        afterEach(() => container.remove());

        it('resizeChartContainer resizes an auto-sized chart to the container size', async () => {
            // Bespoke: no width or height, so the chart follows the container.
            chart = AgCharts.create({ ...options, container });
            await waitForChartStability(chart);

            await resizeChartContainer(chart, { width: 300, height: 200, pixelRatio: 1 });
            const small = { ...getSeriesRect(chart) };
            await resizeChartContainer(chart, { width: 600, height: 400, pixelRatio: 1 });
            const large = getSeriesRect(chart);

            expect(large.width).toBeGreaterThan(small.width + 100);
            expect(large.height).toBeGreaterThan(small.height + 100);
            expect(deproxy(chart).ctx.domManager.containerSize).toEqual({ width: 600, height: 400, pixelRatio: 1 });
        });
    });
});
