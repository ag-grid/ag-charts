import { afterEach, describe, expect, it } from 'vitest';

import { type AgChartLegendPosition, type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    deproxy,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../test/utils';

describe('GradientLegend', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const EXAMPLE_OPTIONS: AgChartOptions = {
        data: [
            { year: '2020', person: 'Florian', spending: 10 },
            { year: '2020', person: 'Julian', spending: 20 },
            { year: '2020', person: 'Martian', spending: 30 },
            { year: '2021', person: 'Florian', spending: 20 },
            { year: '2021', person: 'Julian', spending: 30 },
            { year: '2021', person: 'Martian', spending: 40 },
            { year: '2022', person: 'Florian', spending: 30 },
            { year: '2022', person: 'Julian', spending: 40 },
            { year: '2022', person: 'Martian', spending: 50 },
        ],
        series: [
            {
                type: 'heatmap',
                xKey: 'year',
                yKey: 'person',
                colorKey: 'spending',
                colorScale: {
                    fills: [
                        { color: 'white' },
                        { color: 'yellow' },
                        { color: 'red' },
                        { color: 'blue' },
                        { color: 'black' },
                    ],
                },
            },
        ],
        legend: {
            enabled: true,
        },
        gradientLegend: {
            gradient: {
                preferredLength: 200,
            },
        },
    };

    const compare = async () => {
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('AG-7868 gradientLegend.position', () => {
        async function testPosition(position: AgChartLegendPosition) {
            const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
            prepareEnterpriseTestOptions(options as any);
            options.gradientLegend!.position = position;
            chart = AgCharts.create(options);
            await compare();
        }

        test('top', async () => {
            await testPosition('top');
        });
        test('top-right', async () => {
            await testPosition('top-right');
        });
        test('top-left', async () => {
            await testPosition('top-left');
        });
        test('bottom', async () => {
            await testPosition('bottom');
        });
        test('bottom-right', async () => {
            await testPosition('bottom-right');
        });
        test('bottom-left', async () => {
            await testPosition('bottom-left');
        });
        test('right', async () => {
            await testPosition('right');
        });
        test('right-top', async () => {
            await testPosition('right-top');
        });
        test('right-bottom', async () => {
            await testPosition('right-bottom');
        });
        test('left', async () => {
            await testPosition('left');
        });
        test('left-top', async () => {
            await testPosition('left-top');
        });
        test('left-bottom', async () => {
            await testPosition('left-bottom');
        });
    });

    describe('CRT-1108 top-position label placement', () => {
        it('should position labels below the gradient bar for top placement', async () => {
            const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
            prepareEnterpriseTestOptions(options as any);
            options.gradientLegend!.position = 'top';
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart);
            const gradientLegend: any = chartInstance.modulesManager.getModule('gradientLegend');
            const axisTicks = gradientLegend.axisTicks[0];
            const gradientRect = gradientLegend.gradientRectSelection.at(0);

            expect(axisTicks.translationY).toBeGreaterThanOrEqual(gradientRect.y + gradientRect.height);
        });

        it('should position labels below the gradient bar for bottom placement', async () => {
            const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
            prepareEnterpriseTestOptions(options as any);
            options.gradientLegend!.position = 'bottom';
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart);
            const gradientLegend: any = chartInstance.modulesManager.getModule('gradientLegend');
            const axisTicks = gradientLegend.axisTicks[0];
            const gradientRect = gradientLegend.gradientRectSelection.at(0);

            expect(axisTicks.translationY).toBeGreaterThanOrEqual(gradientRect.y + gradientRect.height);
        });
    });

    it('should render fill and border as expected', async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            gradientLegend: {
                ...EXAMPLE_OPTIONS.gradientLegend,
                position: 'bottom',
                border: { stroke: 'green', strokeWidth: 10 },
                fill: 'red',
                fillOpacity: 0.2,
                cornerRadius: 14,
                padding: 50,
            },
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await compare();
    });

    it('AG-16729 should not show arrow when highlight.enabled is false', async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: [
                {
                    type: 'heatmap',
                    xKey: 'year',
                    yKey: 'person',
                    colorKey: 'spending',
                    colorScale: {
                        fills: [
                            { color: 'white' },
                            { color: 'yellow' },
                            { color: 'red' },
                            { color: 'blue' },
                            { color: 'black' },
                        ],
                    },
                    highlight: { enabled: false },
                },
            ],
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        const chartInstance = deproxy(chart);
        const gradientLegend: any = chartInstance.modulesManager.getModule('gradientLegend');

        // Before hover - arrow should be hidden
        expect(gradientLegend?.arrowSelection.at(0)?.visible).toBe(false);

        // Hover over a heatmap cell (center of chart)
        await hoverAction(300, 200)(chart);
        await waitForChartStability(chart);

        // After hover - arrow should still be hidden because highlight.enabled is false
        expect(gradientLegend?.arrowSelection.at(0)?.visible).toBe(false);
    });

    describe('AG-16045 named stop labels', () => {
        const HEATMAP_SERIES = {
            type: 'heatmap' as const,
            xKey: 'year',
            yKey: 'person',
            colorKey: 'spending',
        };
        const GRADIENT_LEGEND = { gradient: { preferredLength: 200 } };

        it('should render named labels for continuous colorScale', async () => {
            const options = prepareEnterpriseTestOptions({
                data: EXAMPLE_OPTIONS.data,
                series: [
                    {
                        ...HEATMAP_SERIES,
                        colorScale: {
                            fills: [
                                { color: 'red', stop: 10, name: 'Low' },
                                { color: 'yellow', stop: 30, name: 'Mid' },
                                { color: 'green', name: 'High' },
                            ],
                        },
                    },
                ],
                gradientLegend: GRADIENT_LEGEND,
            });
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render named labels for discrete colorScale', async () => {
            const options = prepareEnterpriseTestOptions({
                data: EXAMPLE_OPTIONS.data,
                series: [
                    {
                        ...HEATMAP_SERIES,
                        colorScale: {
                            fills: [
                                { color: 'red', stop: 20, name: 'Low' },
                                { color: 'yellow', stop: 35, name: 'Medium' },
                                { color: 'green', name: 'High' },
                            ],
                            mode: 'discrete' as const,
                        },
                    },
                ],
                legend: { enabled: false },
                gradientLegend: { ...GRADIENT_LEGEND, enabled: true },
            });
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render only named labels (partial names)', async () => {
            const options = prepareEnterpriseTestOptions({
                data: EXAMPLE_OPTIONS.data,
                series: [
                    {
                        ...HEATMAP_SERIES,
                        colorScale: {
                            fills: [
                                { color: 'red', stop: 10, name: 'Negative' },
                                { color: 'red' },
                                { color: 'ivory', stop: 30, name: 'Neutral' },
                                { color: 'green', name: 'Positive' },
                            ],
                        },
                    },
                ],
                gradientLegend: GRADIENT_LEGEND,
            });
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render named labels in vertical position', async () => {
            const options = prepareEnterpriseTestOptions({
                data: EXAMPLE_OPTIONS.data,
                series: [
                    {
                        ...HEATMAP_SERIES,
                        colorScale: {
                            fills: [
                                { color: 'red', stop: 10, name: 'Low' },
                                { color: 'yellow', stop: 30, name: 'Mid' },
                                { color: 'green', name: 'High' },
                            ],
                        },
                    },
                ],
                gradientLegend: {
                    ...GRADIENT_LEGEND,
                    position: 'right',
                },
            });
            chart = AgCharts.create(options);
            await compare();
        });
    });

    it('AG-16729 should show arrow when highlight.enabled is true (default)', async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        const chartInstance = deproxy(chart);
        const gradientLegend: any = chartInstance.modulesManager.getModule('gradientLegend');

        // Before hover - arrow should be hidden
        expect(gradientLegend?.arrowSelection.at(0)?.visible).toBe(false);

        // Hover over a heatmap cell (center of chart)
        await hoverAction(300, 200)(chart);
        await waitForChartStability(chart);

        // After hover - arrow should be visible because highlight is enabled
        expect(gradientLegend?.arrowSelection.at(0)?.visible).toBe(true);
    });

    it('AG-9758 should hide arrow when hovered value is outside colorScale.domain', async () => {
        // Data values span 10-50. With an explicit domain of [45, 100], the
        // centre cell (value 30) falls outside the visible axis range, so the
        // highlight arrow must not render — otherwise it points off-scale.
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: [
                {
                    type: 'heatmap',
                    xKey: 'year',
                    yKey: 'person',
                    colorKey: 'spending',
                    colorScale: {
                        fills: [{ color: 'white' }, { color: 'black' }],
                        domain: [45, 100],
                    },
                },
            ],
        };
        prepareEnterpriseTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        const chartInstance = deproxy(chart);
        const gradientLegend: any = chartInstance.modulesManager.getModule('gradientLegend');

        await hoverAction(300, 200)(chart);
        await waitForChartStability(chart);

        expect(gradientLegend?.arrowSelection.at(0)?.visible).toBe(false);
    });

    describe('AG-16048 multi-series gradient legend', () => {
        const SCATTER_DATA = [
            { x: 1, y1: 10, y2: 12, temp: 5, pressure: 100 },
            { x: 2, y1: 20, y2: 22, temp: 15, pressure: 200 },
            { x: 3, y1: 30, y2: 32, temp: 25, pressure: 300 },
            { x: 4, y1: 40, y2: 42, temp: 35, pressure: 400 },
            { x: 5, y1: 50, y2: 52, temp: 45, pressure: 500 },
        ];

        it('should render two gradient bars for two scatter series (bottom)', async () => {
            const options = prepareEnterpriseTestOptions({
                data: SCATTER_DATA,
                series: [
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y1',
                        colorKey: 'temp',
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 5 },
                                { color: 'red', stop: 45 },
                            ],
                        },
                    },
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y2',
                        colorKey: 'pressure',
                        colorScale: {
                            fills: [
                                { color: 'green', stop: 100 },
                                { color: 'yellow', stop: 500 },
                            ],
                        },
                    },
                ],
                gradientLegend: { enabled: true, gradient: { preferredLength: 150 } },
            });
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render two gradient bars for two scatter series (right)', async () => {
            const options = prepareEnterpriseTestOptions({
                data: SCATTER_DATA,
                series: [
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y1',
                        colorKey: 'temp',
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 5 },
                                { color: 'red', stop: 45 },
                            ],
                        },
                    },
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y2',
                        colorKey: 'pressure',
                        colorScale: {
                            fills: [
                                { color: 'green', stop: 100 },
                                { color: 'yellow', stop: 500 },
                            ],
                        },
                    },
                ],
                gradientLegend: { enabled: true, position: 'right', gradient: { preferredLength: 150 } },
            });
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render gradient bars for scatter and bubble with different domains', async () => {
            const options = prepareEnterpriseTestOptions({
                data: SCATTER_DATA,
                series: [
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y1',
                        colorKey: 'temp',
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 5 },
                                { color: 'red', stop: 45 },
                            ],
                        },
                    },
                    {
                        type: 'bubble' as const,
                        xKey: 'x',
                        yKey: 'y2',
                        sizeKey: 'pressure',
                        colorKey: 'pressure',
                        colorScale: {
                            fills: [
                                { color: 'white', stop: 100 },
                                { color: 'purple', stop: 500 },
                            ],
                        },
                    },
                ],
                gradientLegend: { enabled: true, gradient: { preferredLength: 150 } },
            });
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render a single gradient bar when only one series has colorKey', async () => {
            const options = prepareEnterpriseTestOptions({
                data: SCATTER_DATA,
                series: [
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y1',
                        colorKey: 'temp',
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 5 },
                                { color: 'red', stop: 45 },
                            ],
                        },
                    },
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y2',
                    },
                ],
                gradientLegend: { enabled: true, gradient: { preferredLength: 150 } },
            });
            chart = AgCharts.create(options);
            await compare();
        });

        it('should render named labels per gradient bar for multiple series', async () => {
            const options = prepareEnterpriseTestOptions({
                data: SCATTER_DATA,
                series: [
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y1',
                        colorKey: 'temp',
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 5, name: 'Cold' },
                                { color: 'red', stop: 45, name: 'Hot' },
                            ],
                        },
                    },
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y2',
                        colorKey: 'pressure',
                        colorScale: {
                            fills: [
                                { color: 'green', stop: 100, name: 'Low' },
                                { color: 'yellow', stop: 500, name: 'High' },
                            ],
                        },
                    },
                ],
                gradientLegend: { enabled: true, gradient: { preferredLength: 150 } },
            });
            chart = AgCharts.create(options);
            await compare();
        });

        it('should only render gradient bar for continuous series when mixed with discrete', async () => {
            const options = prepareEnterpriseTestOptions({
                data: SCATTER_DATA,
                series: [
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y1',
                        colorKey: 'temp',
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 5 },
                                { color: 'red', stop: 45 },
                            ],
                            mode: 'discrete' as const,
                        },
                    },
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y2',
                        colorKey: 'pressure',
                        colorScale: {
                            fills: [
                                { color: 'green', stop: 100 },
                                { color: 'yellow', stop: 500 },
                            ],
                        },
                    },
                ],
                gradientLegend: { enabled: true, gradient: { preferredLength: 150 } },
            });
            chart = AgCharts.create(options);
            await compare();
        });

        it('should auto-enable gradient legend when series[0] has no colorKey but later series does', async () => {
            const options = prepareEnterpriseTestOptions({
                data: SCATTER_DATA,
                series: [
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y1',
                        // No colorKey on series[0]
                    },
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y2',
                        colorKey: 'pressure',
                        colorScale: {
                            fills: [
                                { color: 'green', stop: 100 },
                                { color: 'yellow', stop: 500 },
                            ],
                        },
                    },
                ],
                // NOT setting gradientLegend.enabled — relying on theme auto-enable
                gradientLegend: { gradient: { preferredLength: 150 } },
            });
            chart = AgCharts.create(options);
            await compare();
        });

        it('should show arrow on correct gradient bar when hovering series data', async () => {
            const options = prepareEnterpriseTestOptions({
                data: SCATTER_DATA,
                series: [
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y1',
                        colorKey: 'temp',
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 5 },
                                { color: 'red', stop: 45 },
                            ],
                        },
                    },
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y2',
                        colorKey: 'pressure',
                        colorScale: {
                            fills: [
                                { color: 'green', stop: 100 },
                                { color: 'yellow', stop: 500 },
                            ],
                        },
                    },
                ],
                gradientLegend: { enabled: true, gradient: { preferredLength: 150 } },
            });
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Hover over a data point to trigger the arrow indicator.
            await hoverAction(300, 200)(chart);
            await waitForChartStability(chart);

            await compare();
        });

        // Regression for AG-16048 QA feedback point 2: an empty user-supplied `colorScale: {}`
        // must still pick up the theme's diverging palette for `fills` via the `$map` theme
        // expression. Guard against a regression to the ColorScale constructor defaults.
        it('AG-16048 should apply the theme fills palette when user supplies an empty colorScale', async () => {
            const options = prepareEnterpriseTestOptions({
                data: SCATTER_DATA,
                series: [
                    {
                        type: 'scatter' as const,
                        xKey: 'x',
                        yKey: 'y1',
                        colorKey: 'temp',
                        colorScale: {},
                    },
                ],
            });
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart);
            const series: any = chartInstance.series[0];
            expect(series.colorScale.range).toHaveLength(3);
            expect(series.colorScale.range).not.toEqual(['red', 'blue']);
        });
    });
});
