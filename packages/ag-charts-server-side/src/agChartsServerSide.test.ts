import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';
import { setupMockConsole } from 'ag-charts-test';

import { AgChartsServerSide } from './agChartsServerSide';
import type { AgFinancialChartRenderOptions, AgGaugeRenderOptions, AgRenderOptions } from './types';

// Register community modules for testing
ModuleRegistry.registerModules(AllCommunityModule);

const IMAGE_SNAPSHOT_OPTIONS = {
    failureThreshold: 0,
    failureThresholdType: 'percent' as const,
};

describe('AgChartsServerSide', () => {
    afterEach(() => {
        const errorMock = console.error as jest.Mock;
        const unexpectedErrors = errorMock.mock.calls
            .map((args) => String(args[0] ?? ''))
            .filter((msg) => !msg.startsWith('*'));
        errorMock.mockClear();
        expect(unexpectedErrors).toEqual([]);
    });

    setupMockConsole();

    describe('render', () => {
        it('should render a simple line chart to buffer', async () => {
            const renderOptions: AgRenderOptions = {
                options: {
                    data: [
                        { x: 1, y: 10 },
                        { x: 2, y: 20 },
                        { x: 3, y: 15 },
                    ],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                },
                width: 400,
                height: 300,
                format: 'png',
            };

            const buffer = await AgChartsServerSide.render(renderOptions);

            // Verify PNG format
            expect(buffer[0]).toBe(0x89);
            expect(buffer[1]).toBe(0x50); // P
            expect(buffer[2]).toBe(0x4e); // N
            expect(buffer[3]).toBe(0x47); // G

            // Verify image content
            expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
        });

        it('should render a bar chart to buffer', async () => {
            const renderOptions: AgRenderOptions = {
                options: {
                    data: [
                        { category: 'A', value: 10 },
                        { category: 'B', value: 20 },
                        { category: 'C', value: 15 },
                    ],
                    series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
                },
                width: 400,
                height: 300,
            };

            const buffer = await AgChartsServerSide.render(renderOptions);

            expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
        });

        it('should render JPEG format when specified', async () => {
            const renderOptions: AgRenderOptions = {
                options: {
                    data: [
                        { x: 1, y: 10 },
                        { x: 2, y: 20 },
                    ],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                },
                width: 400,
                height: 300,
                format: 'jpeg',
                quality: 80,
            };

            const buffer = await AgChartsServerSide.render(renderOptions);

            // NOTE: jest-image-snapshot only supports PNG snapshots so its not possible to test JPEG output
            // so we just verify the magic bytes and that the buffer is not empty

            // Verify JPEG format (magic bytes) and non-empty output
            expect(buffer[0]).toBe(0xff);
            expect(buffer[1]).toBe(0xd8);
            expect(buffer.length).toBeGreaterThan(1000); // JPEG should have substantial content
        });

        it('should respect pixelRatio 1x', async () => {
            const buffer = await AgChartsServerSide.render({
                options: {
                    data: [
                        { x: 1, y: 10 },
                        { x: 2, y: 20 },
                    ],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                },
                width: 200,
                height: 150,
                pixelRatio: 1,
            });

            expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
        });

        it('should respect pixelRatio 2x', async () => {
            const buffer = await AgChartsServerSide.render({
                options: {
                    data: [
                        { x: 1, y: 10 },
                        { x: 2, y: 20 },
                    ],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                },
                width: 200,
                height: 150,
                pixelRatio: 2,
            });

            expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
        });

        it('should throw error for invalid dimensions', async () => {
            const renderOptions: AgRenderOptions = {
                options: {
                    data: [],
                    series: [],
                },
                width: 0,
                height: 300,
            };

            await expect(AgChartsServerSide.render(renderOptions)).rejects.toThrow('Invalid dimensions');
        });

        it('should throw error for negative dimensions', async () => {
            const renderOptions: AgRenderOptions = {
                options: {
                    data: [],
                    series: [],
                },
                width: -100,
                height: 300,
            };

            await expect(AgChartsServerSide.render(renderOptions)).rejects.toThrow('Invalid dimensions');
        });

        it('should throw error for zero pixelRatio', async () => {
            const renderOptions: AgRenderOptions = {
                options: {
                    data: [],
                    series: [],
                },
                width: 400,
                height: 300,
                pixelRatio: 0,
            };

            await expect(AgChartsServerSide.render(renderOptions)).rejects.toThrow('Invalid pixelRatio');
        });

        it('should throw error for negative pixelRatio', async () => {
            const renderOptions: AgRenderOptions = {
                options: {
                    data: [],
                    series: [],
                },
                width: 400,
                height: 300,
                pixelRatio: -1,
            };

            await expect(AgChartsServerSide.render(renderOptions)).rejects.toThrow('Invalid pixelRatio');
        });
    });

    describe('concurrent rendering', () => {
        it('should handle multiple concurrent renders with different options', async () => {
            // Use different data and dimensions to verify canvas isolation
            const renderConfigs = [
                {
                    data: [
                        { x: 1, y: 10 },
                        { x: 2, y: 20 },
                    ],
                    width: 200,
                    height: 150,
                },
                {
                    data: [
                        { x: 1, y: 30 },
                        { x: 2, y: 40 },
                    ],
                    width: 250,
                    height: 180,
                },
                {
                    data: [
                        { x: 1, y: 50 },
                        { x: 2, y: 60 },
                        { x: 3, y: 70 },
                    ],
                    width: 300,
                    height: 200,
                },
                {
                    data: [
                        { x: 1, y: 5 },
                        { x: 2, y: 15 },
                        { x: 3, y: 25 },
                        { x: 4, y: 35 },
                    ],
                    width: 350,
                    height: 220,
                },
                {
                    data: [
                        { x: 1, y: 100 },
                        { x: 2, y: 80 },
                    ],
                    width: 180,
                    height: 140,
                },
            ];

            const promises = renderConfigs.map((config) =>
                AgChartsServerSide.render({
                    options: {
                        data: config.data,
                        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    },
                    width: config.width,
                    height: config.height,
                })
            );

            const buffers = await Promise.all(promises);

            expect(buffers).toHaveLength(5);

            // Each buffer should match its own unique snapshot
            for (const buffer of buffers) {
                expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
            }
        });
    });

    describe('visual regression', () => {
        it('should render line chart correctly', async () => {
            const buffer = await AgChartsServerSide.render({
                options: {
                    data: [
                        { x: 1, y: 10 },
                        { x: 2, y: 25 },
                        { x: 3, y: 15 },
                        { x: 4, y: 30 },
                        { x: 5, y: 20 },
                    ],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                },
                width: 400,
                height: 300,
            });

            expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
        });

        it('should render bar chart correctly', async () => {
            const buffer = await AgChartsServerSide.render({
                options: {
                    data: [
                        { category: 'A', value: 30 },
                        { category: 'B', value: 45 },
                        { category: 'C', value: 25 },
                        { category: 'D', value: 60 },
                    ],
                    series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
                },
                width: 400,
                height: 300,
            });

            expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
        });

        it('should render pie chart correctly', async () => {
            const buffer = await AgChartsServerSide.render({
                options: {
                    data: [
                        { label: 'A', value: 30 },
                        { label: 'B', value: 45 },
                        { label: 'C', value: 25 },
                    ],
                    series: [{ type: 'pie', angleKey: 'value', legendItemKey: 'label' }],
                },
                width: 400,
                height: 300,
            });

            expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
        });

        it('should render area chart correctly', async () => {
            const buffer = await AgChartsServerSide.render({
                options: {
                    data: [
                        { x: 1, y: 10 },
                        { x: 2, y: 25 },
                        { x: 3, y: 15 },
                        { x: 4, y: 30 },
                    ],
                    series: [{ type: 'area', xKey: 'x', yKey: 'y' }],
                },
                width: 400,
                height: 300,
            });

            expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
        });
    });
});

describe('AgChartsServerSide enterprise licensing', () => {
    // Define afterEach BEFORE setupMockConsole so it runs first (Jest runs afterEach in registration order)
    afterEach(() => {
        // Allow expected license messages (start with *), fail on unexpected errors
        const errorMock = console.error as jest.Mock;
        const unexpectedErrors = errorMock.mock.calls
            .map((args) => String(args[0] ?? ''))
            .filter((msg) => !msg.startsWith('*'));
        errorMock.mockClear();
        expect(unexpectedErrors).toEqual([]);
    });

    setupMockConsole();

    beforeAll(async () => {
        // Dynamic import required: static import would cause enterprise module registration
        // at file load time, affecting community tests that run first in this file
        const { AllEnterpriseModule } = await import('ag-charts-enterprise');
        ModuleRegistry.registerModules(AllEnterpriseModule);
    });

    beforeEach(async () => {
        // Reset license key (also resets LicenseManager.licenseOutputLogged)
        const { LicenseManager } = await import('ag-charts-enterprise');
        LicenseManager.setLicenseKey(undefined);
    });

    it('should render watermark when enterprise registered without license', async () => {
        const buffer = await AgChartsServerSide.render({
            options: {
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                    { x: 3, y: 15 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            },
            width: 400,
            height: 300,
        });

        expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
    });

    it('should render watermark on bar chart when unlicensed', async () => {
        const buffer = await AgChartsServerSide.render({
            options: {
                data: [
                    { category: 'A', value: 30 },
                    { category: 'B', value: 45 },
                    { category: 'C', value: 25 },
                ],
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            },
            width: 400,
            height: 300,
        });

        expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
    });

    it('should render financial chart without unknown option warnings', async () => {
        const renderOptions: AgFinancialChartRenderOptions = {
            options: {
                data: [
                    { date: new Date('2024-01-02'), open: 150, high: 155, low: 148, close: 153, volume: 1000 },
                    { date: new Date('2024-01-03'), open: 153, high: 158, low: 151, close: 157, volume: 1200 },
                    { date: new Date('2024-01-04'), open: 157, high: 160, low: 154, close: 155, volume: 900 },
                    { date: new Date('2024-01-05'), open: 155, high: 162, low: 153, close: 161, volume: 1100 },
                    { date: new Date('2024-01-08'), open: 161, high: 165, low: 159, close: 163, volume: 1300 },
                ],
            },
            width: 600,
            height: 400,
        };

        const buffer = await AgChartsServerSide.renderFinancialChart(renderOptions);

        expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
    });

    it('should render gauge chart', async () => {
        const renderOptions: AgGaugeRenderOptions = {
            options: {
                type: 'radial-gauge',
                value: 75,
                scale: { min: 0, max: 100 },
            },
            width: 400,
            height: 400,
        };

        const buffer = await AgChartsServerSide.renderGauge(renderOptions);

        expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
    });
});

describe('AgChartsServerSide community-only watermark', () => {
    // These tests verify watermark rendering with only AllCommunityModule registered
    // (no AllEnterpriseModule). The enterpriseRegistry is still populated from the
    // side-effect import of ag-charts-enterprise in the SSR package.

    // Define afterEach BEFORE setupMockConsole so it runs first
    afterEach(() => {
        const errorMock = console.error as jest.Mock;
        const unexpectedErrors = errorMock.mock.calls
            .map((args) => String(args[0] ?? ''))
            .filter((msg) => !msg.startsWith('*'));
        errorMock.mockClear();
        expect(unexpectedErrors).toEqual([]);
    });

    setupMockConsole();

    beforeEach(async () => {
        // Reset license state — no license key set means watermark should appear
        const { LicenseManager } = await import('ag-charts-enterprise');
        LicenseManager.setLicenseKey(undefined);
    });

    it('should render watermark on line chart without enterprise', async () => {
        const buffer = await AgChartsServerSide.render({
            options: {
                data: [
                    { x: 1, y: 10 },
                    { x: 2, y: 20 },
                    { x: 3, y: 15 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            },
            width: 400,
            height: 300,
        });

        expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
    });

    it('should render watermark on bar chart without enterprise', async () => {
        const buffer = await AgChartsServerSide.render({
            options: {
                data: [
                    { category: 'A', value: 30 },
                    { category: 'B', value: 45 },
                    { category: 'C', value: 25 },
                ],
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
            },
            width: 400,
            height: 300,
        });

        expect(buffer).toMatchImageSnapshot(IMAGE_SNAPSHOT_OPTIONS);
    });
});
