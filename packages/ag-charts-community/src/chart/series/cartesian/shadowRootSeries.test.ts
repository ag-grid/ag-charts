import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Group, Transformable } from 'ag-charts-core';
import type { Node } from 'ag-charts-core';
import type { AgBarSeriesOptions, AgCartesianChartOptions, AgChartOptions, AgDropShadowOptions } from 'ag-charts-types';

import { STRIPPED_NUMBER_AXES } from '../../test/bigintExamples';
import { getSeriesSelectionNodes } from '../../test/seriesAccessors';
import {
    type Chart,
    createChart,
    deproxy,
    getSeriesDataNodeGroup,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

// A shadow with no blur and an exact offset, so that the alpha of a pixel is the strength of the shadow cast on it.
const shadowAt = (xOffset: number, yOffset = 0): AgDropShadowOptions => ({
    enabled: true,
    color: 'rgba(0, 0, 0, 0.5)',
    xOffset,
    yOffset,
    blur: 0,
});

const RED = [255, 0, 0, 255];
const GREEN = [0, 128, 0, 255];
const WHITE = [255, 255, 255, 255];

const isHalfBlack = (pixel: number[]) => pixel.slice(0, 3).every((channel) => Math.abs(channel - 128) <= 2);

const AXES = {
    x: { ...STRIPPED_NUMBER_AXES.x, type: 'number' as const, min: 0, max: 10 },
    y: { ...STRIPPED_NUMBER_AXES.y, type: 'number' as const, min: 0, max: 10 },
};

describe('cartesian series shadow root', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart | undefined;

    beforeEach(() => {
        chart = undefined;
    });

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        vi.restoreAllMocks();
    });

    const create = async (options: AgChartOptions) => {
        chart?.destroy();
        const created = deproxy(
            await createChart({ animation: { enabled: false }, legend: { enabled: false }, ...options })
        );
        chart = created;
        await waitForChartStability(created);
        return created;
    };

    const scene = () => {
        expect(chart).toBeDefined();
        return chart!.ctx.scene;
    };

    const pixelAt = (x: number, y: number) => [
        ...scene().canvas.context.getImageData(Math.round(x), Math.round(y), 1, 1).data,
    ];

    const allPixels = () => {
        const { width, height } = scene().canvas;
        return Array.from(scene().canvas.context.getImageData(0, 0, width, height).data as ArrayLike<number>);
    };

    /** The canvas boxes of the items of a series that are drawn, in the order that they are drawn. */
    const itemBoxes = (seriesIndex: number) =>
        getSeriesSelectionNodes<Node>(chart!, 'datumSelection', seriesIndex)
            .filter((node) => node.visible)
            .map((node) => Transformable.toCanvas(node));

    /** The canvas position of the centre of each item of a series, in the order that they are drawn. */
    const itemCentres = (seriesIndex: number) =>
        itemBoxes(seriesIndex).map(({ x, y, width, height }) => ({ x: x + width / 2, y: y + height / 2 }));

    /** Gathers nothing for the root to cast, so that every group batches its own shadows, as it does without a root. */
    const withoutRoot = () => {
        vi.spyOn(Group.prototype, 'gatherShadowChildren').mockImplementation(() => {});
    };

    describe('bars (the first repro)', () => {
        const data = [{ category: 'A', first: 6, second: 6 }];
        const bars = (shadow: AgDropShadowOptions | undefined): AgCartesianChartOptions => ({
            data,
            series: [
                { type: 'bar', xKey: 'category', yKey: 'first', fill: 'red', fillOpacity: 1, strokeWidth: 0, shadow },
                { type: 'bar', xKey: 'category', yKey: 'second', fill: 'blue', fillOpacity: 1, strokeWidth: 0, shadow },
            ],
        });

        /** The shadow that carries the bar of the second series onto that of the first, whatever the layout. */
        const shadowOntoFirst = async () => {
            await create(bars(undefined));
            const [first] = itemCentres(0);
            const [second] = itemCentres(1);
            return shadowAt(Math.round(first.x - second.x));
        };

        it('should not draw the shadow of a later series over the bars of an earlier series', async () => {
            const shadow = await shadowOntoFirst();
            await create(bars(shadow));

            const [first] = itemCentres(0);
            expect(pixelAt(first.x, first.y)).toEqual(RED);
        });

        it('should draw the shadow of the later series, beneath the earlier one, where nothing else is', async () => {
            const shadow = await shadowOntoFirst();
            await create(bars(shadow));

            // The shadow of the first series falls the same distance to the left of it, on nothing.
            const [first] = itemCentres(0);
            const [second] = itemCentres(1);
            expect(isHalfBlack(pixelAt(first.x + (first.x - second.x), first.y))).toBe(true);
        });

        it('should draw the shadow over the earlier bars when the root cannot cast, as it did before', async () => {
            const shadow = await shadowOntoFirst();
            withoutRoot();
            await create(bars(shadow));

            const [first] = itemCentres(0);
            const [second] = itemCentres(1);
            // All or nothing: the series batch their own shadows, so the later one covers the earlier bar ...
            expect(pixelAt(first.x, first.y)).not.toEqual(RED);
            // ... and the shadow of the earlier series is still cast, once.
            expect(isHalfBlack(pixelAt(first.x + (first.x - second.x), first.y))).toBe(true);
        });

        it('should draw one series the same through the root as through its own batch', async () => {
            const options = (shadow: AgDropShadowOptions): AgCartesianChartOptions => ({
                data,
                series: [{ type: 'bar', xKey: 'category', yKey: 'first', fill: 'red', strokeWidth: 0, shadow }],
            });
            await create(options(shadowAt(0)));
            const [{ x, y }] = itemCentres(0);
            await create(options(shadowAt(30, 10)));
            const through = allPixels();
            expect(pixelAt(x, y)).toEqual(RED);

            withoutRoot();
            await create(options(shadowAt(30, 10)));
            expect(allPixels()).toEqual(through);
        });
    });

    describe('areas (the second repro)', () => {
        const SHADOW = shadowAt(30);
        const areas: AgCartesianChartOptions = {
            data: [
                { x: 1, low: 3, high: 6 },
                { x: 4, low: 3, high: 6 },
            ],
            axes: AXES,
            series: [
                {
                    type: 'area',
                    xKey: 'x',
                    yKey: 'low',
                    fill: 'red',
                    fillOpacity: 1,
                    marker: { enabled: true },
                    shadow: SHADOW,
                },
                { type: 'area', xKey: 'x', yKey: 'high', fill: 'blue', fillOpacity: 1, shadow: SHADOW },
            ],
        };

        /** A pixel beside the right edge of both areas, below the line of each, so that both of them cast on it. */
        const besideBothAreas = () => {
            const last = itemCentres(0).at(-1)!;
            return pixelAt(last.x + 15, last.y + 30);
        };

        it('should cast the shadow once where the shadows of two areas overlap, not stack them', async () => {
            await create(areas);

            expect(isHalfBlack(besideBothAreas())).toBe(true);
        });

        it('should not stack the shadow, whatever the number of areas', async () => {
            const copies = Array.from({ length: 6 }, (_, i) => ({
                type: 'area' as const,
                xKey: 'x',
                yKey: i % 2 === 0 ? 'low' : 'high',
                ...(i === 0 ? { marker: { enabled: true } } : {}),
                shadow: SHADOW,
            }));
            await create({ ...areas, series: copies } as AgCartesianChartOptions);

            expect(isHalfBlack(besideBothAreas())).toBe(true);
        });

        it('should not draw the shadow of a later area over an earlier area', async () => {
            // The shadow of the upper area falls on the lower area, to the left of its own edge.
            const options = (shadow: AgDropShadowOptions | undefined): AgCartesianChartOptions => ({
                ...areas,
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'low',
                        fill: 'red',
                        fillOpacity: 1,
                        strokeWidth: 0,
                        marker: { enabled: true },
                    },
                    { type: 'area', xKey: 'x', yKey: 'high', fill: 'blue', fillOpacity: 0, strokeWidth: 0, shadow },
                ],
            });
            await create(options(undefined));
            const [start] = itemCentres(0);
            const last = itemCentres(0).at(-1)!;
            const inside = { x: (start.x + last.x) / 2, y: last.y + 40 };

            await create(options({ ...shadowAt(0, 0) }));
            expect(pixelAt(inside.x, inside.y)).toEqual(RED);
            // A shadow of the same size that lands on the red area, with the area above it drawn first or last.
            await create(options(shadowAt(0, 20)));
            expect(pixelAt(inside.x, inside.y)).toEqual(RED);
        });

        it('should stack the shadows when the root cannot cast, as before', async () => {
            withoutRoot();
            await create(areas);

            expect(isHalfBlack(besideBothAreas())).toBe(false);
            expect(besideBothAreas()[0]).toBeLessThan(WHITE[0]);
        });
    });

    describe('series with segments', () => {
        const segmented = (shadow: AgDropShadowOptions | undefined, segments: boolean): AgCartesianChartOptions => ({
            data: [
                { x: 'A', y: 10 },
                { x: 'B', y: 20 },
                { x: 'C', y: 15 },
                { x: 'D', y: 25 },
            ],
            series: [
                {
                    type: 'bar',
                    xKey: 'x',
                    yKey: 'y',
                    fill: 'red',
                    fillOpacity: 1,
                    strokeWidth: 0,
                    shadow,
                    ...(segments
                        ? {
                              segmentation: {
                                  key: 'x',
                                  segments: [{ start: 'B', stop: 'C', fill: 'red', strokeWidth: 0 }],
                              },
                          }
                        : {}),
                },
            ],
            axes: { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } },
        });

        it.each([
            ['without segments', false],
            ['with segments', true],
        ])('should draw a series through the root as it does through its own batch, %s', async (_name, segments) => {
            await create(segmented(shadowAt(25, 15), segments));
            const through = allPixels();
            expect(through.some((value, i) => i % 4 !== 3 && value !== 255)).toBe(true);

            withoutRoot();
            await create(segmented(shadowAt(25, 15), segments));
            expect(allPixels()).toEqual(through);
        });

        describe('after an earlier series', () => {
            const options = (shadow: AgDropShadowOptions | undefined): AgCartesianChartOptions => ({
                data: [{ category: 'A', first: 6, second: 6 }],
                series: [
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'first',
                        fill: 'red',
                        fillOpacity: 1,
                        strokeWidth: 0,
                        shadow,
                    },
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'second',
                        fill: 'blue',
                        fillOpacity: 1,
                        strokeWidth: 0,
                        shadow,
                        segmentation: { key: 'y', segments: [{ start: 0, stop: 4, fill: 'blue', strokeWidth: 0 }] },
                    },
                ],
            });

            /** A pixel on the earlier bar, in the part of it above the segment, where the shadow of the later series is not clipped. */
            const aboveSegment = async () => {
                await create(options(undefined));
                const [first] = itemBoxes(0);
                const [second] = itemBoxes(1);
                const shadow = shadowAt(Math.round(first.x - second.x));
                await create(options(shadow));
                expect(getSeriesDataNodeGroup(chart!, 1).segments).toHaveLength(1);
                return { x: first.x + first.width / 2, y: first.y + 3 };
            };

            it('should not draw the shadow of a segmented series over an earlier series', async () => {
                const { x, y } = await aboveSegment();

                expect(pixelAt(x, y)).toEqual(RED);
            });

            it('should draw the shadow over the earlier series when the root does not cast, so that the test tells them apart', async () => {
                withoutRoot();
                const { x, y } = await aboveSegment();

                expect(pixelAt(x, y)).not.toEqual(RED);
            });
        });
    });

    describe('marker shadows', () => {
        const data = [
            { x: 3, y: 5, z: 0 },
            { x: 6, y: 0, z: 5 },
        ];
        const square = { shape: 'square' as const, size: 20, fill: 'red', fillOpacity: 1, strokeWidth: 0 };

        const scatters = (shadow: AgDropShadowOptions | undefined): AgCartesianChartOptions => ({
            data,
            axes: AXES,
            series: [
                { type: 'scatter', xKey: 'x', yKey: 'y', ...square },
                { type: 'scatter', xKey: 'x', yKey: 'z', ...square, fill: 'blue', shadow },
            ],
        });

        const lines = (shadow: AgDropShadowOptions | undefined): AgCartesianChartOptions => ({
            data,
            axes: AXES,
            series: [
                { type: 'line', xKey: 'x', yKey: 'y', strokeWidth: 0, marker: { enabled: true, ...square } },
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'z',
                    strokeWidth: 0,
                    marker: { enabled: true, ...square, fill: 'blue', shadow },
                },
            ],
        });

        describe.each([
            ['scatter', scatters],
            ['line', lines],
        ])('%s markers', (_name, build) => {
            /** The shadow that carries the first marker of the later series onto the first marker of the earlier one. */
            const shadowOntoFirst = async () => {
                await create(build(undefined));
                const [first] = itemCentres(0);
                const [second] = itemCentres(1);
                return { shadow: shadowAt(Math.round(first.x - second.x), Math.round(first.y - second.y)), first };
            };

            it('should not draw the shadow of the markers of a later series over those of an earlier series', async () => {
                const { shadow, first } = await shadowOntoFirst();
                await create(build(shadow));

                expect(pixelAt(first.x, first.y)).toEqual(RED);
            });

            it('should cast that shadow, over the earlier markers, when the root does not cast', async () => {
                const { shadow, first } = await shadowOntoFirst();
                withoutRoot();
                await create(build(shadow));

                expect(pixelAt(first.x, first.y)).not.toEqual(RED);
            });
        });
    });

    describe('opacity', () => {
        const options = (extra: Partial<AgBarSeriesOptions>, shadow = shadowAt(30, 10)): AgCartesianChartOptions => ({
            data: [{ category: 'A', value: 6 }],
            series: [{ type: 'bar', xKey: 'category', yKey: 'value', fill: 'red', strokeWidth: 0, shadow, ...extra }],
        });

        it.each([
            ['a half-opaque fill', { fillOpacity: 0.5 }],
            ['a faint fill', { fillOpacity: 0.2 }],
        ])('should cast a shadow at the same opacity as its own batch did, with %s', async (_name, extra) => {
            await create(options(extra));
            const through = allPixels();
            expect(through.some((value, i) => i % 4 !== 3 && value !== 255)).toBe(true);

            withoutRoot();
            await create(options(extra));
            const local = allPixels();

            expect(through).toHaveLength(local.length);
            expect(through.every((value, i) => Math.abs(value - local[i]) <= 1)).toBe(true);
        });
    });

    describe('highlight', () => {
        const data = [{ category: 'A', first: 6, second: 6 }];
        const options = (shadow: AgDropShadowOptions | undefined): AgCartesianChartOptions => ({
            data,
            highlight: { drawingMode: 'overlay' },
            series: [
                {
                    type: 'bar',
                    xKey: 'category',
                    yKey: 'first',
                    fill: 'red',
                    fillOpacity: 1,
                    strokeWidth: 0,
                    highlight: { unhighlightedSeries: { opacity: 1 } },
                },
                {
                    type: 'bar',
                    xKey: 'category',
                    yKey: 'second',
                    fill: 'blue',
                    fillOpacity: 1,
                    strokeWidth: 0,
                    highlight: { highlightedItem: { fill: 'green', shadow } },
                },
            ],
        });

        /** Hovers the bar of the later series, whose highlight casts its shadow onto the bar of the earlier series. */
        const hover = async () => {
            await create(options(undefined));
            const [first] = itemCentres(0);
            const [second] = itemCentres(1);
            await create(options(shadowAt(Math.round(first.x - second.x))));
            await hoverAction(second.x, second.y)(chart!);
            await waitForChartStability(chart!);
            expect(pixelAt(second.x, second.y)).toEqual(GREEN);
            return first;
        };

        it('should draw the shadow of the highlighted item above the earlier series, as it is drawn without a root', async () => {
            const first = await hover();
            const through = allPixels();
            // The shadow lands on the earlier bar, and covers it.
            expect(pixelAt(first.x, first.y)).not.toEqual(RED);

            withoutRoot();
            await hover();

            expect(allPixels()).toEqual(through);
        });

        it('should hover a chart whose series cast shadows, through the root or through their own batches', async () => {
            const shadowed = (): AgCartesianChartOptions => {
                const base = options(shadowAt(0));
                return {
                    ...base,
                    series: base.series!.map((series) => ({ ...series, shadow: shadowAt(30, 10) })),
                } as AgCartesianChartOptions;
            };
            await create(shadowed());
            const [{ x, y }] = itemCentres(1);
            await hoverAction(x, y)(chart!);
            await waitForChartStability(chart!);
            const through = allPixels();

            withoutRoot();
            await create(shadowed());
            await hoverAction(x, y)(chart!);
            await waitForChartStability(chart!);

            expect(allPixels()).toEqual(through);
        });
    });
});
