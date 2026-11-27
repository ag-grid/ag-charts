import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExtendedPath2D, Transformable } from 'ag-charts-core';
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
        vi.restoreAllMocks();
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

        it('should keep a glow that follows straight segments round a stroke that stays curved', async () => {
            const [radius, strokeWidth, spread] = [20, 30, 10];
            const strokePaths = vi.spyOn(ExtendedPath2D.prototype, 'getStrokePath2D');
            const proxy = await createChart({
                data: [{ x: 0, y: 0 }],
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        shape: 'circle',
                        size: radius * 2,
                        // Without a fill to cast, the glow is cast from the stroke.
                        fillOpacity: 0,
                        stroke: 'red',
                        strokeWidth,
                        glow: { enabled: true, fill: 'blue', fillOpacity: 1, blur: 0, gap: 0, spread },
                    },
                ],
            });
            chart = proxy;

            // Only the glow pass is wide enough to follow straight segments.
            const { contexts, results } = strokePaths.mock;
            const curved = results.filter(
                ({ value }, index) => value === (contexts[index] as ExtendedPath2D).getPath2D()
            );
            expect(curved.length).toBeGreaterThan(0);
            expect(curved.length).toBeLessThan(results.length);

            const internal = deproxy(proxy);
            const { pixelRatio } = internal.ctx.scene.canvas;
            const [marker] = shapesOf(getSeriesAt(internal, 0).contentGroup, Marker);
            const centre = Transformable.toCanvas(marker).computeCenter();
            const outerEdge = radius + strokeWidth / 2;
            const at = (distance: number, angle: number) =>
                chartPixelAt(
                    proxy,
                    (centre.x + distance * Math.cos(angle)) * pixelRatio,
                    (centre.y + distance * Math.sin(angle)) * pixelRatio
                );
            // Angles between the vertices of the glow's segments as well as on them.
            for (const angle of [0, Math.PI / 37, Math.PI / 4, (3 * Math.PI) / 5]) {
                expect(at(outerEdge - 2, angle), `${angle} in the stroke`).toEqual([255, 0, 0, 255]);
                expect(at(outerEdge + spread / 2, angle), `${angle} in the glow`).toEqual([0, 0, 255, 255]);
            }
            await compare();
        });
    });
});
