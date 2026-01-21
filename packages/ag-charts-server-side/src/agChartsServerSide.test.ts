import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

import { AgChartsServerSide } from './agChartsServerSide';
import type { RenderOptions } from './types';

// Register community modules for testing
ModuleRegistry.registerModules(AllCommunityModule);

const IMAGE_SNAPSHOT_OPTIONS = {
    failureThreshold: 0,
    failureThresholdType: 'percent' as const,
};

describe('AgChartsServerSide', () => {
    describe('render', () => {
        it('should render a simple line chart to buffer', async () => {
            const renderOptions: RenderOptions = {
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
            const renderOptions: RenderOptions = {
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
            const renderOptions: RenderOptions = {
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
            const renderOptions: RenderOptions = {
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
            const renderOptions: RenderOptions = {
                options: {
                    data: [],
                    series: [],
                },
                width: -100,
                height: 300,
            };

            await expect(AgChartsServerSide.render(renderOptions)).rejects.toThrow('Invalid dimensions');
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
    beforeAll(async () => {
        // Register enterprise modules for this test suite using dynamic import
        const { AllEnterpriseModule } = await import('ag-charts-enterprise');
        ModuleRegistry.registerModules(AllEnterpriseModule);
    });

    beforeEach(async () => {
        // Reset license state between tests
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
});
