import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance, AgChartOptions } from 'ag-charts-community';
import {
    deproxy,
    getSeriesContextNodeData,
    getSeriesSelectionNodes,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Transformable } from 'ag-charts-core';
import type { Node, Rect, Sector } from 'ag-charts-core';

import { getSeriesGroup } from '../test/enterpriseSeriesAccessors';
import { HIERARCHY_SHADOW_DATA, collectShapes, createEnterpriseChart } from '../test/utils';
import type { BoxPlotNode } from './box-plot/boxPlotNode';
import type { CandlestickNode } from './candlestick/candlestickNode';
import type { HierarchyNode } from './hierarchy/hierarchySeries';
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

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
    });

    const create = async (options: AgChartOptions) => {
        chart = await createEnterpriseChart(options);
    };

    const context = () => deproxy(chart).ctx.scene.canvas.context;

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
        const tileGaps = () => {
            const gaps: { x: number; y: number }[] = [];
            for (const rect of getSeriesSelectionNodes<Rect<HierarchyNode>>(chart, 'datumSelection')) {
                if (!rect.visible || rect.datum!.children.length > 0) continue;
                gaps.push(canvasPoint(rect.parentNode!, rect.x + rect.width + 4, rect.y + rect.height / 2));
            }
            return gaps;
        };

        it('should show the shadow of a tile on its parent group', async () => {
            // The group is drawn under its tiles, and fills the strip beside a tile: the shadow of the tile lands on it.
            await createTreemap(SOLID_SHADOW);

            const gaps = tileGaps();
            expect(gaps).toHaveLength(4);
            for (const { x, y } of gaps) {
                expect(pixelAt(x, y)).toEqual(BLACK);
            }
        });

        it('should not shadow the group beside a tile when only the groups cast a shadow', async () => {
            await createTreemap(undefined);

            for (const { x, y } of tileGaps()) {
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

        const sectors = () =>
            getSeriesSelectionNodes<Sector>(chart, 'datumSelection').filter((sector) => sector.visible);

        /** The outer sector of the widest angle, and the unit vector from the centre through its middle. */
        const widestLeaf = () => {
            const [leaf] = sectors()
                .filter((sector) => sector.innerRadius === Math.max(...sectors().map((s) => s.innerRadius)))
                .sort((a, b) => b.endAngle - b.startAngle - (a.endAngle - a.startAngle));
            const angle = (leaf.startAngle + leaf.endAngle) / 2;
            return { leaf, ux: Math.cos(angle), uy: Math.sin(angle) };
        };

        it('should show the shadow of an outer ring on the ring inside it', async () => {
            // Find where the outer ring is, then shift its shadow 10px towards the centre, over the ring within.
            await createSunburst(undefined);
            const { leaf, ux, uy } = widestLeaf();
            chart.destroy();

            const shadow = { ...SOLID_SHADOW, xOffset: -10 * ux, yOffset: -10 * uy };
            await createSunburst(shadow);
            const { leaf: shadowed } = widestLeaf();
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
            await createSunburst(undefined);
            const { leaf, ux, uy } = widestLeaf();

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
            await create({
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
            });
            const [datum] = getSeriesContextNodeData(chart).nodeData;
            const { ctx, id } = deproxy(chart);
            ctx.highlightManager.updateHighlight(id, datum);
            await waitForChartStability(chart);
        };

        /** The count of pixels of the colour, inside and outside the box around the hovered shape. */
        const countPixels = (isColour: (pixel: Pixel) => boolean) => {
            const [highlighted] = collectShapes(getSeriesGroup(chart, 'highlightNodeGroup'));
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
        const brightness = () => {
            const [highlighted] = collectShapes(getSeriesGroup(chart, 'highlightNodeGroup'));
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
            await createMap(BLUE_SHADOW, undefined, options);
            const withShadow = brightness();
            chart.destroy();
            await createMap(undefined, undefined, options);
            const withoutShadow = brightness();

            expect(withShadow).toBeLessThan(withoutShadow * 0.93);
        });

        it('should cast the highlighted item shadow from the hovered shape only', async () => {
            await createMap(BLUE_SHADOW, RED_SHADOW);

            const red = countPixels(isRed);
            expect(red.inside).toBeGreaterThan(0);
            expect(red.outside).toBe(0);
        });

        it('should keep the series shadow on the shapes that are not hovered', async () => {
            await createMap(BLUE_SHADOW, RED_SHADOW);

            expect(countPixels(isBlue).outside).toBeGreaterThan(0);
        });

        it('should cast the series shadow from the hovered shape when it has no shadow of its own', async () => {
            await createMap(BLUE_SHADOW);

            // Nothing is red, and the series shadow still shows around the hovered shape that casts it from the highlight.
            expect(countPixels(isRed)).toEqual({ inside: 0, outside: 0 });
            expect(countPixels(isBlue).inside).toBeGreaterThan(0);
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
        const candlestick = (wick: string, shadow: typeof SPREAD_SHADOW | undefined): AgCartesianChartOptions => {
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
        const ohlc = (stroke: string, shadow: typeof SPREAD_SHADOW | undefined): AgCartesianChartOptions => {
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
        const boxPlot = (whisker: string, shadow: typeof SPREAD_SHADOW | undefined): AgCartesianChartOptions => ({
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

        const render = async (options: AgCartesianChartOptions) => {
            await create({ animation: { enabled: false }, legend: { enabled: false }, ...options });
            const { width, height } = deproxy(chart).ctx.scene.canvas;
            const pixels = [...context().getImageData(0, 0, width, height).data];
            chart.destroy();
            return pixels;
        };

        /** The number of pixels that the shadow changes. */
        const shadowPixels = async (build: (shadow: typeof SPREAD_SHADOW | undefined) => AgCartesianChartOptions) => {
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

    describe('silhouette where a stroke meets a fill', () => {
        // The first item is high on the chart, and its shadow lies in the gap to its right, which the other items are too
        // low to reach. The stroke is centred on the edge of the item, so that it overlaps the fill on the inside.
        const XOFFSET = 200;
        const STROKE_WIDTH = 8;
        const HALF_BLACK_SHADOW = { enabled: true, color: 'rgba(0, 0, 0, 0.5)', xOffset: XOFFSET, yOffset: 0, blur: 0 };
        const paint = { fill: 'red', fillOpacity: 1, stroke: 'blue', strokeWidth: STROKE_WIDTH };

        const candlestick: AgCartesianChartOptions = {
            data: [
                { x: 'A', open: 6, high: 9, low: 5, close: 8 },
                ...['B', 'C', 'D'].map((x) => ({ x, open: 2, high: 3, low: 1, close: 2.5 })),
            ],
            series: [
                {
                    type: 'candlestick',
                    xKey: 'x',
                    openKey: 'open',
                    highKey: 'high',
                    lowKey: 'low',
                    closeKey: 'close',
                    item: { up: { ...paint, wick: { stroke: 'blue' } }, down: { ...paint, wick: { stroke: 'blue' } } },
                    shadow: HALF_BLACK_SHADOW,
                },
            ],
        };
        const boxPlot: AgCartesianChartOptions = {
            data: [
                { x: 'A', min: 5, q1: 6, median: 7, q3: 8, max: 9 },
                ...['B', 'C', 'D'].map((x) => ({ x, min: 1, q1: 1.5, median: 2, q3: 2.5, max: 3 })),
            ],
            series: [
                {
                    type: 'box-plot',
                    xKey: 'x',
                    minKey: 'min',
                    q1Key: 'q1',
                    medianKey: 'median',
                    q3Key: 'q3',
                    maxKey: 'max',
                    ...paint,
                    whisker: { stroke: 'blue' },
                    shadow: HALF_BLACK_SHADOW,
                },
            ],
        };

        const visibleItems = <TItem extends Node>() =>
            getSeriesSelectionNodes<TItem>(chart, 'datumSelection').filter((node) => node.visible);

        /** The first item drawn, with the canvas position of the middle of its body. */
        const firstCandlestick = () => {
            const [item] = visibleItems<CandlestickNode<unknown>>();
            return { item, middle: canvasPoint(item, item.centerX, (item.yOpen + item.yClose) / 2) };
        };
        const firstBoxPlot = () => {
            const [item] = visibleItems<BoxPlotNode>();
            return { item, middle: canvasPoint(item, item.center, (item.q1 + item.q3) / 2) };
        };

        it.each([
            ['candlestick', candlestick, firstCandlestick],
            ['box plot', boxPlot, firstBoxPlot],
        ])(
            'should cast a %s shadow of one strength under where its stroke meets its fill',
            async (_, options, firstItem) => {
                await create({
                    animation: { enabled: false },
                    legend: { enabled: false },
                    ...options,
                });
                const { item, middle } = firstItem();
                const { x, width } = Transformable.toCanvas(item);

                // A row through the middle of the first item, whose shadow is clear of every item.
                const { y } = middle;
                const row = [];
                for (let dx = -STROKE_WIDTH; dx <= width + STROKE_WIDTH; dx++) row.push(pixelAt(x + dx + XOFFSET, y));

                // The shadow is half black where it lies on the white, and nowhere darker, as it is where the fill and the
                // stroke would add up were they cast one after the other.
                const darkest = Math.min(...row.map(([r]) => r));
                expect(darkest).toBeGreaterThanOrEqual(125);
                expect(row.filter(([r]) => Math.abs(r - 127.5) <= 2).length).toBeGreaterThan(width * 0.9);
            }
        );
    });
});
