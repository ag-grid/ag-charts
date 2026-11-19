import { afterEach, describe, expect, it } from 'vitest';

import { Transformable } from 'ag-charts-core';
import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { getSeriesAt } from '../test/seriesAccessors';
import { shapesOf } from '../test/shadowFixtures';
import {
    chartPixelAt,
    compareImageSnapshot,
    createChart,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
} from '../test/utils';
import { Marker } from './marker';

describe('Marker Shapes', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
        }
    });

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    describe('CRT-991 pin marker with large stroke', () => {
        it('should render pin marker without artifacts at normal stroke width', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 15 },
                ],
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        shape: 'pin',
                        size: 30,
                    },
                ],
            };
            chart = await createChart(options);
            await compare();
        });

        it('should render pin marker without artifacts at large stroke width', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 15 },
                ],
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        shape: 'pin',
                        size: 30,
                        stroke: 'red',
                        strokeWidth: 10,
                    },
                ],
            };
            chart = await createChart(options);
            await compare();
        });

        it('should render pin marker in legend without artifacts', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                ],
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        shape: 'pin',
                        size: 20,
                        stroke: 'blue',
                        strokeWidth: 5,
                    },
                ],
                legend: {
                    item: {
                        marker: {
                            size: 40,
                            strokeWidth: 10,
                        },
                    },
                },
            };
            chart = await createChart(options);
            await compare();
        });
    });

    describe('triangle-down and hourglass', () => {
        it('should render both shapes on series markers and legend items', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, a: 10, b: 30 },
                    { x: 1, a: 20, b: 25 },
                    { x: 2, a: 15, b: 35 },
                ],
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'a',
                        shape: 'triangle-down',
                        size: 30,
                        fill: 'orange',
                        stroke: 'maroon',
                        strokeWidth: 3,
                    },
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'b',
                        shape: 'hourglass',
                        size: 30,
                        fill: 'teal',
                        stroke: 'navy',
                        strokeWidth: 3,
                    },
                ],
            };
            chart = await createChart(options);
            await compare();
        });
    });

    describe('stroke wider than the outline curvature', () => {
        it('should paint curved markers solid out to the outer edge of the stroke', async () => {
            const shapes = ['circle', 'heart', 'pin'] as const;
            const options: AgChartOptions = {
                data: [{ x: 0, circle: 10, heart: 20, pin: 30 }],
                series: shapes.map((shape) => ({
                    type: 'scatter',
                    xKey: 'x',
                    yKey: shape,
                    shape,
                    size: shape === 'circle' ? 7 : 10,
                    fill: 'lime',
                    stroke: 'red',
                    strokeWidth: shape === 'circle' ? 40 : 24,
                })),
            };
            const proxy = await createChart(options);
            chart = proxy;

            const internal = deproxy(proxy);
            const { pixelRatio } = internal.ctx.scene.canvas;
            const [circle] = shapesOf(getSeriesAt(internal, 0).contentGroup, Marker);
            const centre = Transformable.toCanvas(circle).computeCenter();
            // Between the fill and the inner edge of a stroke that curve strokers can leave unpainted.
            expect(chartPixelAt(proxy, (centre.x + 10) * pixelRatio, centre.y * pixelRatio)).toEqual([255, 0, 0, 255]);
            await compare();
        });
    });
});
