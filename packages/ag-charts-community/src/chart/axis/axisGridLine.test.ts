import { afterEach, describe, expect } from '@jest/globals';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

describe('AxisGridLine', () => {
    setupMockConsole();
    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();
    const opts: AgCartesianChartOptions = prepareTestOptions({});

    const compare = async () => {
        await waitForChartStability(chart);

        const newImageData = extractImageData(ctx);
        expect(newImageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    // AG-8777
    test('use theme default stroke', async () => {
        chart = AgCharts.create({
            ...opts,
            data: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
            axes: [
                {
                    type: 'number',
                    position: 'bottom',
                    gridLine: { style: [{ lineDash: [8, 3, 3, 3] }] },
                },
                {
                    type: 'number',
                    position: 'left',
                    gridLine: { style: [{ lineDash: [5, 5, 1] }] },
                },
            ],
        });

        await compare();
    });

    describe('fills', () => {
        describe('horizontal axis', () => {
            it('should fill between and behind grid lines', async () => {
                chart = AgCharts.create({
                    ...opts,
                    data: [
                        { x: 0, y: 0 },
                        { x: 1, y: 1 },
                        { x: 2, y: 2 },
                        { x: 3, y: 3 },
                        { x: 4, y: 4 },
                    ],
                    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
                    axes: [
                        {
                            type: 'number',
                            position: 'bottom',
                            gridLine: {
                                style: [
                                    { fill: 'pink', stroke: 'red' },
                                    { fill: 'lightblue', stroke: 'blue' },
                                ],
                            },
                        },
                        {
                            type: 'number',
                            position: 'left',
                        },
                    ],
                });

                await compare();
            });

            it('should fill non-uniform between and behind grid lines', async () => {
                chart = AgCharts.create({
                    ...opts,
                    data: [
                        { x: new Date(2025, 0, 28), y: 0 },
                        { x: new Date(2025, 1, 12), y: 1 },
                        { x: new Date(2025, 2, 12), y: 2 },
                        { x: new Date(2025, 10, 12), y: 3 },
                        { x: new Date(2025, 11, 1), y: 1 },
                    ],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: [
                        {
                            type: 'unit-time',
                            position: 'bottom',
                            unit: 'month',
                            gridLine: {
                                style: [
                                    { fill: 'pink', stroke: 'red' },
                                    { fill: 'lightblue', stroke: 'blue' },
                                ],
                            },
                        },
                        {
                            type: 'number',
                            position: 'left',
                        },
                    ],
                });

                await compare();
            });
        });

        describe('vertical axis', () => {
            it('should fill between and behind grid lines', async () => {
                chart = AgCharts.create({
                    ...opts,
                    data: [
                        { x: 0, y: 0 },
                        { x: 1, y: 1 },
                        { x: 2, y: 2 },
                        { x: 3, y: 3 },
                        { x: 4, y: 4 },
                    ],
                    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
                    axes: [
                        {
                            type: 'number',
                            position: 'bottom',
                        },
                        {
                            type: 'number',
                            position: 'left',
                            gridLine: {
                                style: [
                                    { fill: 'pink', stroke: 'red' },
                                    { fill: 'lightblue', stroke: 'blue' },
                                ],
                            },
                        },
                    ],
                });

                await compare();
            });

            it('should fill non-uniform between and behind grid lines', async () => {
                chart = AgCharts.create({
                    ...opts,
                    data: [
                        { y: new Date(2025, 0, 28), x: 0 },
                        { y: new Date(2025, 1, 12), x: 1 },
                        { y: new Date(2025, 2, 12), x: 2 },
                        { y: new Date(2025, 10, 12), x: 3 },
                        { y: new Date(2025, 11, 1), x: 1 },
                    ],
                    series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
                    axes: [
                        {
                            type: 'number',
                            position: 'bottom',
                        },
                        {
                            type: 'unit-time',
                            position: 'left',
                            gridLine: {
                                style: [
                                    { fill: 'pink', stroke: 'red' },
                                    { fill: 'lightblue', stroke: 'blue' },
                                ],
                            },
                        },
                    ],
                });

                await compare();
            });
        });
    });

    test('do not draw empty styles', async () => {
        chart = AgCharts.create({
            ...opts,
            data: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
            axes: [
                {
                    type: 'number',
                    position: 'bottom',
                    // Should draw no grid line
                    gridLine: { style: [{}] },
                },
                {
                    type: 'number',
                    position: 'left',
                    // Should draw only half of the grid lines
                    gridLine: { style: [{}, { lineDash: [5, 5, 1] }] },
                },
            ],
        });

        await compare();
    });
});
