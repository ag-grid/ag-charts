import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import { Transformable } from 'ag-charts-core';
import type { Node, Rect, Sector } from 'ag-charts-core';

import { HIERARCHY_SHADOW_DATA, collectShapes, prepareEnterpriseTestOptions } from '../test/utils';
import { ukData } from './map-test/ukData';
import ukTopology from './map-test/ukTopology.json';

type Pixel = number[];

const WHITE: Pixel = [255, 255, 255, 255];
const BLACK: Pixel = [0, 0, 0, 255];

// A shadow with no blur and a solid colour, so that a pixel is either lit by the shadow or it is not.
const SOLID_SHADOW = { enabled: true, color: '#000000', xOffset: 8, yOffset: 0, blur: 0 };

describe('layer shadow batching of enterprise series', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const create = async (options: AgChartOptions) => {
        prepareEnterpriseTestOptions(options);
        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);
        return chart.series[0];
    };

    const context = () => chart.ctx.scene.canvas.context as CanvasRenderingContext2D;

    const pixelAt = (x: number, y: number): Pixel => [
        ...context().getImageData(Math.round(x), Math.round(y), 1, 1).data,
    ];

    const canvasPoint = (node: Node, x: number, y: number) => {
        const { canvasX, canvasY } = Transformable.toCanvasPoint(node, x, y);
        return { x: canvasX, y: canvasY };
    };

    describe('treemap', () => {
        // The groups cast the same shadow as the tiles, so that they would batch with them were it not for their depth.
        const createTreemap = (tileShadow: typeof SOLID_SHADOW | undefined) =>
            create({
                data: HIERARCHY_SHADOW_DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'size',
                        fills: ['#c3dafe', '#fbd38d'],
                        group: { fill: '#ffffff', stroke: 'transparent', gap: 12, padding: 10, shadow: SOLID_SHADOW },
                        tile: { shadow: tileShadow },
                    },
                ],
            });

        /** The tiles, with the canvas position of the middle of the strip of their group that lies to their right. */
        const tileGaps = (series: any) => {
            const gaps: { x: number; y: number }[] = [];
            series.datumSelection.each((rect: Rect, node: any) => {
                if (!rect.visible || node.children.length > 0) return;
                gaps.push(canvasPoint(rect.parentNode!, rect.x + rect.width + 4, rect.y + rect.height / 2));
            });
            return gaps;
        };

        it('should show the shadow of a tile on its parent group', async () => {
            // The group is drawn under its tiles, and fills the strip beside a tile: the shadow of the tile lands on it.
            const series = await createTreemap(SOLID_SHADOW);

            const gaps = tileGaps(series);
            expect(gaps).toHaveLength(4);
            for (const { x, y } of gaps) {
                expect(pixelAt(x, y)).toEqual(BLACK);
            }
        });

        it('should not shadow the group beside a tile when only the groups cast a shadow', async () => {
            const series = await createTreemap(undefined);

            for (const { x, y } of tileGaps(series)) {
                expect(pixelAt(x, y)).toEqual(WHITE);
            }
        });
    });

    describe('sunburst', () => {
        const createSunburst = (shadow: typeof SOLID_SHADOW | undefined) =>
            create({
                data: HIERARCHY_SHADOW_DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [{ type: 'sunburst', labelKey: 'name', sizeKey: 'size', fills: ['#c3dafe'], shadow }],
            });

        const sectors = (series: any) => {
            const found: Sector[] = [];
            series.datumSelection.each((sector: Sector) => sector.visible && found.push(sector));
            return found;
        };

        /** The outer sector of the widest angle, and the unit vector from the centre through its middle. */
        const widestLeaf = (series: any) => {
            const [leaf] = sectors(series)
                .filter((sector) => sector.innerRadius === Math.max(...sectors(series).map((s) => s.innerRadius)))
                .sort((a, b) => b.endAngle - b.startAngle - (a.endAngle - a.startAngle));
            const angle = (leaf.startAngle + leaf.endAngle) / 2;
            return { leaf, ux: Math.cos(angle), uy: Math.sin(angle) };
        };

        it('should show the shadow of an outer ring on the ring inside it', async () => {
            // Find where the outer ring is, then shift its shadow 10px towards the centre, over the ring within.
            const probe = await createSunburst(undefined);
            const { leaf, ux, uy } = widestLeaf(probe);
            chart.destroy();

            const shadow = { ...SOLID_SHADOW, xOffset: -10 * ux, yOffset: -10 * uy };
            const series = await createSunburst(shadow);
            const { leaf: shadowed } = widestLeaf(series);
            expect(shadowed.innerRadius).toBe(leaf.innerRadius);

            // A point of the inner ring, 4px inside the outer ring, which only the shadow of the outer ring reaches.
            const { x, y } = canvasPoint(
                shadowed.parentNode!,
                shadowed.centerX + ux * (shadowed.innerRadius - 4),
                shadowed.centerY + uy * (shadowed.innerRadius - 4)
            );
            expect(pixelAt(x, y)).toEqual(BLACK);
        });

        it('should not shadow the ring inside an outer ring when there is no shadow', async () => {
            const probe = await createSunburst(undefined);
            const { leaf, ux, uy } = widestLeaf(probe);

            const { x, y } = canvasPoint(
                leaf.parentNode!,
                leaf.centerX + ux * (leaf.innerRadius - 4),
                leaf.centerY + uy * (leaf.innerRadius - 4)
            );
            expect(pixelAt(x, y)).not.toEqual(BLACK);
        });
    });

    describe('map-shape highlight', () => {
        // A shadow of a pure colour, so that its pixels tell the hovered shape from the others.
        const RED_SHADOW = { enabled: true, color: '#ff0000', xOffset: 6, yOffset: 6, blur: 0 };
        const BLUE_SHADOW = { enabled: true, color: '#0000ff', xOffset: 6, yOffset: 6, blur: 0 };

        const createMap = async (
            shadow: typeof RED_SHADOW | undefined,
            highlightShadow?: typeof RED_SHADOW,
            highlightStyle: object = {}
        ) => {
            const series = await create({
                data: ukData,
                topology: ukTopology,
                animation: { enabled: false },
                legend: { enabled: false },
                highlight: { drawingMode: 'cutout' },
                series: [
                    {
                        type: 'map-shape',
                        idKey: 'name',
                        shadow,
                        highlight: { highlightedItem: { ...highlightStyle, shadow: highlightShadow } },
                    },
                ],
            } as AgChartOptions);
            const [datum] = series.contextNodeData.nodeData;
            chart.ctx.highlightManager.updateHighlight(chart.id, datum);
            await waitForChartStability(chart);
            return series;
        };

        /** The count of pixels of the colour, inside and outside the box around the hovered shape. */
        const countPixels = (series: any, isColour: (pixel: Pixel) => boolean) => {
            const [highlighted] = collectShapes(series.highlightNodeGroup);
            const { x, y, width, height } = Transformable.toCanvas(highlighted);
            const reach = 8;
            const box = { x: x - reach, y: y - reach, width: width + 2 * reach, height: height + 2 * reach };
            const { data, width: canvasWidth, height: canvasHeight } = context().getImageData(0, 0, 800, 600);
            let inside = 0;
            let outside = 0;
            for (let py = 0; py < canvasHeight; py++) {
                for (let px = 0; px < canvasWidth; px++) {
                    const i = (py * canvasWidth + px) * 4;
                    if (!isColour([data[i], data[i + 1], data[i + 2], data[i + 3]])) continue;
                    const within = px >= box.x && px <= box.x + box.width && py >= box.y && py <= box.y + box.height;
                    if (within) inside++;
                    else outside++;
                }
            }
            return { inside, outside };
        };

        const isRed = ([r, g, b]: Pixel) => r > 240 && g < 15 && b < 15;
        // The items that are not hovered fade, and so cast a fainter shadow: a tint of blue rather than blue itself.
        const isBlue = ([r, g, b]: Pixel) => b > 240 && b - r > 80 && b - g > 80;

        /** The sum of the brightness of the pixels in the box around the first highlighted shape. */
        const brightness = (series: any) => {
            const [highlighted] = collectShapes(series.highlightNodeGroup);
            const { x, y, width, height } = Transformable.toCanvas(highlighted);
            const { data } = context().getImageData(Math.floor(x), Math.floor(y), Math.ceil(width), Math.ceil(height));
            let sum = 0;
            for (let i = 0; i < data.length; i += 4) sum += data[i] + data[i + 1] + data[i + 2];
            return sum;
        };

        it('should cast the shadow of a cutout highlight beneath its translucent fill', async () => {
            // The cutout erases what is beneath the shape before it is drawn, but the shape then casts its own shadow, which
            // shows through its translucent fill. The shadow it casts is not erased.
            const options = { fill: 'blue', fillOpacity: 0.4 };
            const withShadow = brightness(await createMap(BLUE_SHADOW, undefined, options));
            chart.destroy();
            const withoutShadow = brightness(await createMap(undefined, undefined, options));

            expect(withShadow).toBeLessThan(withoutShadow * 0.93);
        });

        it('should cast the highlighted item shadow from the hovered shape only', async () => {
            const series = await createMap(BLUE_SHADOW, RED_SHADOW);

            const red = countPixels(series, isRed);
            expect(red.inside).toBeGreaterThan(0);
            expect(red.outside).toBe(0);
        });

        it('should keep the series shadow on the shapes that are not hovered', async () => {
            const series = await createMap(BLUE_SHADOW, RED_SHADOW);

            expect(countPixels(series, isBlue).outside).toBeGreaterThan(0);
        });

        it('should cast the series shadow from the hovered shape when it has no shadow of its own', async () => {
            const series = await createMap(BLUE_SHADOW);

            // Nothing is red, and the series shadow still shows around the hovered shape that casts it from the highlight.
            expect(countPixels(series, isRed)).toEqual({ inside: 0, outside: 0 });
            expect(countPixels(series, isBlue).inside).toBeGreaterThan(0);
        });
    });

    describe('wicks and whiskers with a spread', () => {
        const SPREAD_SHADOW = { enabled: true, color: '#ff0000', xOffset: 0, yOffset: 0, blur: 0, spread: 6 };
        const OHLC = [
            { x: 'Q1', open: 6, high: 8, low: 3, close: 4 },
            { x: 'Q2', open: 5, high: 8, low: 4, close: 7 },
            { x: 'Q3', open: 4, high: 6, low: 2, close: 5 },
        ];
        const BOX_PLOT = [
            { x: 'Q1', min: 3, q1: 4, median: 5, q3: 6, max: 8 },
            { x: 'Q2', min: 4, q1: 5, median: 6, q3: 7, max: 9 },
            { x: 'Q3', min: 2, q1: 3, median: 4, q3: 5, max: 7 },
        ];

        /** The series with the paint of a wick, whisker or stroke as the only paint of its items that is not transparent. */
        const candlestick = (wick: string, shadow: typeof SPREAD_SHADOW | undefined) => {
            const item = { fill: 'transparent', stroke: 'transparent', wick: { stroke: wick, strokeWidth: 3 } };
            return {
                data: OHLC,
                series: [
                    {
                        type: 'candlestick',
                        xKey: 'x',
                        openKey: 'open',
                        highKey: 'high',
                        lowKey: 'low',
                        closeKey: 'close',
                        item: { up: item, down: item },
                        shadow,
                    },
                ],
            };
        };
        const ohlc = (stroke: string, shadow: typeof SPREAD_SHADOW | undefined) => {
            const item = { stroke, strokeWidth: 3 };
            return {
                data: OHLC,
                series: [
                    {
                        type: 'ohlc',
                        xKey: 'x',
                        openKey: 'open',
                        highKey: 'high',
                        lowKey: 'low',
                        closeKey: 'close',
                        item: { up: item, down: item },
                        shadow,
                    },
                ],
            };
        };
        const boxPlot = (whisker: string, shadow: typeof SPREAD_SHADOW | undefined) => ({
            data: BOX_PLOT,
            series: [
                {
                    type: 'box-plot',
                    xKey: 'x',
                    minKey: 'min',
                    q1Key: 'q1',
                    medianKey: 'median',
                    q3Key: 'q3',
                    maxKey: 'max',
                    fill: 'transparent',
                    stroke: 'transparent',
                    cap: { lengthRatio: 0 },
                    whisker: { stroke: whisker, strokeWidth: 3 },
                    shadow,
                },
            ],
        });

        const render = async (options: object) => {
            await create({ animation: { enabled: false }, legend: { enabled: false }, ...options } as AgChartOptions);
            const { width, height } = chart.ctx.scene.canvas;
            const pixels = [...context().getImageData(0, 0, width, height).data];
            chart.destroy();
            return pixels;
        };

        /** The number of pixels that the shadow changes. */
        const shadowPixels = async (build: (shadow: typeof SPREAD_SHADOW | undefined) => object) => {
            const without = await render(build({ ...SPREAD_SHADOW, enabled: false }));
            const withShadow = await render(build(SPREAD_SHADOW));
            let changed = 0;
            for (let i = 0; i < without.length; i += 4) {
                if (without[i] !== withShadow[i] || without[i + 1] !== withShadow[i + 1]) changed++;
            }
            return changed;
        };

        describe.each([
            ['candlestick', 'wick', candlestick],
            ['box plot', 'whisker', boxPlot],
            ['ohlc', 'stroke', ohlc],
        ])('%s', (_, part, build) => {
            it(`should cast the shadow of a ${part} from its colour`, async () => {
                expect(await shadowPixels((shadow) => build('navy', shadow))).toBeGreaterThan(0);
            });

            it.each(['transparent', 'rgba(0, 0, 0, 0)', 'rgba(10, 20, 30, 0)'])(
                `should cast no shadow from a ${part} of colour %s`,
                async (colour) => {
                    expect(await shadowPixels((shadow) => build(colour, shadow))).toBe(0);
                }
            );
        });
    });
});
