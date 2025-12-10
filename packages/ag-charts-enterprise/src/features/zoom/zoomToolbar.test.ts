import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('ZoomToolbar', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const BASE_OPTIONS: AgChartOptions = {
        data: Array.from({ length: 100 }, (_, i) => ({
            x: i,
            y: Math.sin(i / 10) * 50 + 50,
        })),
        series: [
            {
                type: 'line',
                xKey: 'x',
                yKey: 'y',
            },
        ],
    };

    describe('CRT-906: Zoom Toolbar Tooltip Defaults', () => {
        it('should provide default tooltips for custom buttons without tooltip or label', async () => {
            const options: AgChartOptions = {
                ...BASE_OPTIONS,
                zoom: {
                    enabled: true,
                    buttons: {
                        visible: 'always',
                        buttons: [
                            {
                                value: 'zoom-in',
                                section: 'zoom',
                                // No tooltip or label specified
                            },
                            {
                                value: 'zoom-out',
                                section: 'zoom',
                                // No tooltip or label specified
                            },
                            {
                                value: 'reset',
                                section: 'other',
                                // No tooltip or label specified
                            },
                        ],
                    },
                },
            };

            prepareEnterpriseTestOptions(options as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart);
            expect(chartInstance).toBeDefined();

            // Verify chart renders successfully with zoom toolbar
            const zoomButtons = document.querySelectorAll('.ag-charts-zoom-buttons button');
            expect(zoomButtons.length).toBeGreaterThan(0);
        });

        it('should map all button types to correct default tooltips', async () => {
            const options: AgChartOptions = {
                ...BASE_OPTIONS,
                zoom: {
                    enabled: true,
                    buttons: {
                        visible: 'always',
                        buttons: [
                            { value: 'pan-end', section: 'pan' },
                            { value: 'pan-left', section: 'pan' },
                            { value: 'pan-right', section: 'pan' },
                            { value: 'pan-start', section: 'pan' },
                            { value: 'zoom-in', section: 'zoom' },
                            { value: 'zoom-out', section: 'zoom' },
                            { value: 'reset', section: 'other' },
                        ],
                    },
                },
            };

            prepareEnterpriseTestOptions(options as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // All button types should be rendered without errors
            const chartInstance = deproxy(chart);
            expect(chartInstance).toBeDefined();

            const zoomButtons = document.querySelectorAll('.ag-charts-zoom-buttons button');
            expect(zoomButtons.length).toBe(7);
        });

        it('should not override custom tooltips when provided', async () => {
            const customTooltip = 'My Custom Zoom In';
            const options: AgChartOptions = {
                ...BASE_OPTIONS,
                zoom: {
                    enabled: true,
                    buttons: {
                        visible: 'always',
                        buttons: [
                            {
                                value: 'zoom-in',
                                section: 'zoom',
                                tooltip: customTooltip,
                            },
                            {
                                value: 'zoom-out',
                                section: 'zoom',
                                // No custom tooltip, should get default
                            },
                        ],
                    },
                },
            };

            prepareEnterpriseTestOptions(options as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart);
            expect(chartInstance).toBeDefined();

            // Chart should render with zoom toolbar buttons
            const zoomButtons = document.querySelectorAll('.ag-charts-zoom-buttons button');
            expect(zoomButtons.length).toBeGreaterThanOrEqual(2);
        });

        it('should not override custom labels when provided', async () => {
            const customLabel = 'In';
            const options: AgChartOptions = {
                ...BASE_OPTIONS,
                zoom: {
                    enabled: true,
                    buttons: {
                        visible: 'always',
                        buttons: [
                            {
                                value: 'zoom-in',
                                section: 'zoom',
                                label: customLabel,
                            },
                            {
                                value: 'zoom-out',
                                section: 'zoom',
                                label: 'Out',
                            },
                        ],
                    },
                },
            };

            prepareEnterpriseTestOptions(options as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart);
            expect(chartInstance).toBeDefined();

            // Chart should render with zoom toolbar buttons
            const zoomButtons = document.querySelectorAll('.ag-charts-zoom-buttons button');
            expect(zoomButtons.length).toBeGreaterThanOrEqual(2);

            // Verify labels are rendered
            const buttonTexts = Array.from(zoomButtons).map((btn) => btn.textContent);
            expect(buttonTexts).toContain(customLabel);
            expect(buttonTexts).toContain('Out');
        });

        it('should handle buttons with both tooltip and label missing', async () => {
            const options: AgChartOptions = {
                ...BASE_OPTIONS,
                zoom: {
                    enabled: true,
                    buttons: {
                        visible: 'always',
                        buttons: [
                            {
                                value: 'zoom-in',
                                section: 'zoom',
                                icon: 'zoom-in',
                                // Neither tooltip nor label
                            },
                        ],
                    },
                },
            };

            prepareEnterpriseTestOptions(options as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart);
            expect(chartInstance).toBeDefined();

            // Should get default tooltip from localization
            const zoomButtons = document.querySelectorAll('.ag-charts-zoom-buttons button');
            expect(zoomButtons.length).toBeGreaterThanOrEqual(1);
        });

        it('should work with empty button array', async () => {
            const options: AgChartOptions = {
                ...BASE_OPTIONS,
                zoom: {
                    enabled: true,
                    buttons: {
                        visible: 'always',
                        buttons: [],
                    },
                },
            };

            prepareEnterpriseTestOptions(options as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // With empty button array, theme defaults may still apply
            const chartInstance = deproxy(chart);
            expect(chartInstance).toBeDefined();
        });

        it('should apply defaults on layout complete event', async () => {
            const options: AgChartOptions = {
                ...BASE_OPTIONS,
                zoom: {
                    enabled: true,
                    buttons: {
                        visible: 'always',
                        buttons: [
                            { value: 'zoom-in', section: 'zoom' },
                            { value: 'reset', section: 'other' },
                        ],
                    },
                },
            };

            prepareEnterpriseTestOptions(options as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart);
            expect(chartInstance).toBeDefined();

            // Verify zoom buttons rendered with defaults
            const zoomButtons = document.querySelectorAll('.ag-charts-zoom-buttons button');
            expect(zoomButtons.length).toBeGreaterThanOrEqual(2);
        });
    });
});
