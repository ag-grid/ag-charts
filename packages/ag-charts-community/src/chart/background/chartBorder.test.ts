import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance, AgChartThemeParams } from 'ag-charts-types';

import { SIMPLE_COLUMN_CHART_EXAMPLE } from '../test/examples';
import { expectSamePixels } from '../test/expectSamePixels';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    createChart,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

const EXAMPLE: AgCartesianChartOptions = { ...SIMPLE_COLUMN_CHART_EXAMPLE, animation: { enabled: false } };

const BASE_PARAMS: AgChartThemeParams = { borderColor: '#112233', borderWidth: 2, borderRadius: 6 };

describe('Chart border', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const create = async (options: AgCartesianChartOptions) => {
        chart?.destroy();
        chart = await createChart({ ...EXAMPLE, ...options });
        return deproxy(chart);
    };

    const canvasImage = () => {
        const { canvas } = deproxy(chart!).ctx.scene;
        return canvas.context.getImageData(0, 0, canvas.width, canvas.height);
    };

    const expectRendered = (image: ImageData) => {
        expect(new Set(new Uint32Array(image.data.buffer)).size).toBeGreaterThan(1);
    };

    const resolvedBorder = () => deproxy(chart!).ctx.chartState.getValue('options', 'border');

    describe('theme resolution', () => {
        it.each([
            ['unset', {}, undefined, { enabled: false }],
            ['chartBorder: true', { chartBorder: true }, {}, { enabled: true, stroke: '#112233', strokeWidth: 2 }],
            ['chartBorder width', { chartBorder: { width: 3 } }, {}, { enabled: true, strokeWidth: 3 }],
            ['chartBorder color', { chartBorder: { color: '#445566' } }, {}, { enabled: true, stroke: '#445566' }],
            ['chartBorderRadius', { chartBorder: true, chartBorderRadius: 10 }, {}, { cornerRadius: 10 }],
            ['default corner radius', { chartBorder: true }, {}, { cornerRadius: 6 }],
            [
                'enabled through options with chartBorder: false',
                { chartBorder: false },
                { enabled: true },
                { enabled: true, stroke: '#112233', strokeWidth: 2 },
            ],
            ['auto-enabled by a user stroke', {}, { stroke: 'red' }, { enabled: true, stroke: 'red' }],
        ] as const)('%s', async (_name, params, border, expected) => {
            await create({ theme: { params: { ...BASE_PARAMS, ...params } }, border });
            expect(resolvedBorder()).toMatchObject(expected);
        });
    });

    describe('default off', () => {
        it.each([
            [
                'a disabled border with a width and radius',
                {},
                { border: { enabled: false, strokeWidth: 10, cornerRadius: 20 } },
            ],
            [
                'a chartBorder theme param with the border disabled',
                { theme: { params: {} } },
                { theme: { params: { chartBorder: { width: 10 } } }, border: { enabled: false } },
            ],
        ] as const)('renders %s identically to no border', async (_name, baseline, options) => {
            await create(baseline);
            const expected = canvasImage();
            expectRendered(expected);
            await create(options);
            expectSamePixels(canvasImage(), expected);
        });
    });

    it('shrinks the layout by the border width before the padding', async () => {
        const without = (await create({ padding: 0 })).seriesRect!.clone();
        const withBorder = (await create({ padding: 0, border: { enabled: true, strokeWidth: 5 } })).seriesRect!;

        expect(withBorder.x - without.x).toBeCloseTo(5);
        expect(withBorder.y - without.y).toBeCloseTo(5);
        expect(without.width - withBorder.width).toBeCloseTo(10);
        expect(without.height - withBorder.height).toBeCloseTo(10);
    });

    it('applies and removes the border on update', async () => {
        const border = { enabled: true, strokeWidth: 4 };
        await create({ border });
        const bordered = canvasImage();
        await create({});
        const plain = canvasImage();
        expectRendered(plain);

        await chart!.updateDelta({ border });
        await waitForChartStability(chart!);
        expectSamePixels(canvasImage(), bordered);

        await chart!.updateDelta({ border: { enabled: false } });
        await waitForChartStability(chart!);
        expectSamePixels(canvasImage(), plain);
    });

    describe('rendering', () => {
        it.each([
            ['the theme defaults', { border: { enabled: true } }],
            [
                'a custom stroke and corner radius',
                {
                    background: { fill: '#ffe0b0' },
                    border: { stroke: '#1060c0', strokeWidth: 6, strokeOpacity: 0.8, cornerRadius: 16 },
                },
            ],
            ['no padding', { padding: 0, border: { stroke: '#1060c0', strokeWidth: 4 } }],
            [
                'the background hidden',
                { background: { visible: false }, border: { stroke: '#1060c0', strokeWidth: 4 } },
            ],
            ['the chartBorder theme param', { theme: { params: { chartBorder: true } } }],
            ['the dark theme defaults', { theme: { baseTheme: 'ag-default-dark' }, border: { enabled: true } }],
        ] as AgCartesianChartOptions[][])('renders with %s', async (_name, options) => {
            await create(options);
            expect(resolvedBorder()).toMatchObject({ enabled: true, strokeWidth: expect.any(Number) });
            await compareImageSnapshot(chart!, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it.each([
            [4, 8],
            [6, 8],
            [16, 6],
        ])(
            'rounds the border and background to the same outer radius %d with stroke width %d',
            async (cornerRadius, strokeWidth) => {
                await create({
                    background: { fill: '#0000ff' },
                    border: { stroke: '#ff0000', strokeWidth, cornerRadius },
                });
                const { context, pixelRatio } = deproxy(chart!).ctx.scene.canvas;
                const pixel = (css: number) => {
                    const device = Math.floor(css * pixelRatio);
                    return [...context.getImageData(device, device, 1, 1).data];
                };
                const justInsideCurve = cornerRadius * (1 - Math.SQRT1_2) + 1;

                expect(pixel(0)[3]).toBe(0);
                expect(pixel(justInsideCurve)).toEqual([255, 0, 0, 255]);
            }
        );

        it('draws the border while the background is hidden', async () => {
            const edgePixel = () => {
                const { context, height } = deproxy(chart!).ctx.scene.canvas;
                return [...context.getImageData(1, Math.round(height / 2), 1, 1).data];
            };
            await create({ background: { visible: false } });
            const plain = edgePixel();
            await create({ background: { visible: false }, border: { stroke: '#1060c0', strokeWidth: 4 } });
            expect(edgePixel()).not.toEqual(plain);
        });
    });
});
