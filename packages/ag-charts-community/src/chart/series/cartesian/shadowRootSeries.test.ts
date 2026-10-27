import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Group, Transformable } from 'ag-charts-core';
import type { Node } from 'ag-charts-core';
import type { AgBarSeriesOptions, AgCartesianChartOptions, AgChartOptions, AgDropShadowOptions } from 'ag-charts-types';

import { STRIPPED_NUMBER_AXES } from '../../test/bigintExamples';
import { expectSamePixels } from '../../test/expectSamePixels';
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

    /** The pixel of an image taken of the canvas, whatever the canvas shows now. */
    const pixelIn = ({ data, width }: { data: ArrayLike<number>; width: number }, x: number, y: number) => {
        const offset = (Math.round(y) * width + Math.round(x)) * 4;
        return Array.from({ length: 4 }, (_, i) => data[offset + i]);
    };

    const canvasImage = () => {
        const { width, height } = scene().canvas;
        return scene().canvas.context.getImageData(0, 0, width, height);
    };

    /** Whether the image has a pixel with a channel that is not white, so that a comparison of it is not of two blank canvases. */
    const hasColour = ({ data }: { data: ArrayLike<number> }) =>
        Array.from(data).some((value, i) => i % 4 !== 3 && value !== 255);

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

    /** Builds the chart through the root, and then again with the root unable to cast, and returns the canvas of each. */
    const renderBothWays = async (build: () => Promise<unknown>) => {
        await build();
        const through = canvasImage();
        withoutRoot();
        await build();
        return { through, local: canvasImage() };
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
            const through = canvasImage();
            expect(pixelAt(x, y)).toEqual(RED);

            withoutRoot();
            await create(options(shadowAt(30, 10)));
            expectSamePixels(canvasImage(), through);
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

        it('should cast the shadow of translucent areas once where they overlap, as it is cast for one of them', async () => {
            const translucent = (series: AgCartesianChartOptions['series']): AgCartesianChartOptions => ({
                ...areas,
                series: series!.map((item) => ({ ...item, fillOpacity: 0.8 })) as AgCartesianChartOptions['series'],
            });
            // The shadow of the lower area is within that of the taller one, so the second adds nothing to it.
            await create(translucent(areas.series));
            const last = itemCentres(0).at(-1)!;
            const [x, y] = [last.x + 15, last.y + 30];
            const both = pixelAt(x, y);
            expect(both[3]).toBeGreaterThan(0);

            await create(translucent([areas.series![1]]));

            expect(both).toEqual(pixelAt(x, y));
        });

        it('should not stack the shadow, whatever the number of areas', async () => {
            const copies = Array.from({ length: 6 }, (_, i) => ({
                type: 'area' as const,
                xKey: 'x',
                yKey: i % 2 === 0 ? 'low' : 'high',
                fillOpacity: 1,
                ...(i === 0 ? { marker: { enabled: true } } : {}),
                shadow: SHADOW,
            }));
            await create({ ...areas, series: copies } as AgCartesianChartOptions);

            expect(isHalfBlack(besideBothAreas())).toBe(true);
        });

        describe('an opaque later area whose shadow falls on an earlier area', () => {
            // The earlier area is the taller, so it shows above the top of the later one, where the later shadow falls.
            const overlapping = (shadow: AgDropShadowOptions | undefined): AgCartesianChartOptions => ({
                ...areas,
                series: [
                    { type: 'area', xKey: 'x', yKey: 'high', fill: 'red', fillOpacity: 1, strokeWidth: 0 },
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'low',
                        fill: 'blue',
                        fillOpacity: 1,
                        strokeWidth: 0,
                        marker: { enabled: true },
                        shadow,
                    },
                ],
            });

            /** A pixel of the earlier area, between the line of the later area and the end of its shadow. */
            const onEarlierArea = () => {
                const [start, end] = itemCentres(1);
                return pixelAt((start.x + end.x) / 2, start.y - 10);
            };

            it('should not draw the shadow over the earlier area', async () => {
                await create(overlapping(shadowAt(0, -30)));

                expect(onEarlierArea()).toEqual(RED);
            });

            it('should draw the shadow over the earlier area when the root cannot cast, as before', async () => {
                withoutRoot();
                await create(overlapping(shadowAt(0, -30)));

                expect(onEarlierArea()).not.toEqual(RED);
                expect(onEarlierArea()[0]).toBeLessThan(RED[0]);
            });
        });

        describe('markers whose shadows fall on the fill of their own area', () => {
            const withMarkerShadows: AgCartesianChartOptions = {
                ...areas,
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'high',
                        fill: 'red',
                        fillOpacity: 0.8,
                        strokeWidth: 0,
                        marker: { enabled: true, size: 8, fill: 'blue', shadow: shadowAt(0, 20) },
                    },
                ],
            };

            /** A pixel of the fill below the first marker, where the shadow of that marker falls. */
            const belowMarker = async () => {
                await create(withMarkerShadows);
                const [{ x, y }] = itemCentres(0);
                return { x, y: y + 20 };
            };

            it('should draw the shadow over the fill, not beneath it', async () => {
                const { x, y } = await belowMarker();

                // Half black over a fill of 0.8 red darkens the red channel; beneath it, the channel stays above 200.
                expect(pixelAt(x, y)[0]).toBeLessThan(140);
            });

            it('should draw the same through the root as when the root cannot cast', async () => {
                const { through, local } = await renderBothWays(() => create(withMarkerShadows));

                expectSamePixels(through, local);
            });
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
            const { through, local } = await renderBothWays(() => create(segmented(shadowAt(25, 15), segments)));

            expect(hasColour(through)).toBe(true);
            expectSamePixels(through, local);
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
            const { through, local } = await renderBothWays(() => create(options(extra)));

            expect(hasColour(through)).toBe(true);
            expectSamePixels(through, local, 1);
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
            let first!: Awaited<ReturnType<typeof hover>>;
            const { through, local } = await renderBothWays(async () => {
                first = await hover();
            });

            // The shadow lands on the earlier bar, and covers it.
            expect(hasColour(through)).toBe(true);
            expectSamePixels(through, local);
            expect(pixelIn(through, first.x, first.y)).not.toEqual(RED);
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
            const { through, local } = await renderBothWays(async () => {
                await create(shadowed());
                await hoverAction(x, y)(chart!);
                await waitForChartStability(chart!);
            });

            expectSamePixels(through, local);
        });
    });
});
