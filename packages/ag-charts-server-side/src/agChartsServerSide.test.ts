import { AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

import { AgChartsServerSide } from './agChartsServerSide';
import type { RenderOptions } from './types';

// Register community modules for testing
ModuleRegistry.registerModules(AllCommunityModule);

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

            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);

            // Check PNG magic bytes
            expect(buffer[0]).toBe(0x89);
            expect(buffer[1]).toBe(0x50); // P
            expect(buffer[2]).toBe(0x4e); // N
            expect(buffer[3]).toBe(0x47); // G
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

            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);
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

            expect(buffer).toBeInstanceOf(Buffer);
            // Check JPEG magic bytes
            expect(buffer[0]).toBe(0xff);
            expect(buffer[1]).toBe(0xd8);
        });

        it('should respect pixelRatio', async () => {
            const baseOptions: RenderOptions = {
                options: {
                    data: [{ x: 1, y: 10 }],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                },
                width: 100,
                height: 100,
            };

            const buffer1x = await AgChartsServerSide.render({ ...baseOptions, pixelRatio: 1 });
            const buffer2x = await AgChartsServerSide.render({ ...baseOptions, pixelRatio: 2 });

            // 2x buffer should be larger due to more pixels
            expect(buffer2x.length).toBeGreaterThan(buffer1x.length);
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
        it('should handle multiple concurrent renders', async () => {
            const createOptions = (id: number): RenderOptions => ({
                options: {
                    data: [
                        { x: id, y: id * 10 },
                        { x: id + 1, y: id * 20 },
                    ],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                },
                width: 200,
                height: 150,
            });

            const promises = [1, 2, 3, 4, 5].map((id) => AgChartsServerSide.render(createOptions(id)));

            const buffers = await Promise.all(promises);

            expect(buffers).toHaveLength(5);
            for (const buffer of buffers) {
                expect(buffer).toBeInstanceOf(Buffer);
                expect(buffer.length).toBeGreaterThan(0);
            }
        });
    });
});
