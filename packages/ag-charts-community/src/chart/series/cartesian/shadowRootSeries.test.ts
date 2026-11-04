import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Group, Transformable } from 'ag-charts-core';
import type { InternalAgDropShadowOptions, Node, Shape } from 'ag-charts-core';
import type { AgBarSeriesOptions, AgCartesianChartOptions, AgChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../../core/eventsHub';
import { STRIPPED_NUMBER_AXES } from '../../test/bigintExamples';
import { expectSamePixels } from '../../test/expectSamePixels';
import { getSeriesNodeData, getSeriesSelectionNodes } from '../../test/seriesAccessors';
import { internalOptions } from '../../test/shadowFixtures';
import {
    type Chart,
    createChart,
    deproxy,
    getSeriesDataNodeGroup,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

// A shadow with no blur and an exact offset, so that the alpha of a pixel is the strength of the shadow cast on it.
const shadowAt = (xOffset: number, yOffset = 0): InternalAgDropShadowOptions => ({
    enabled: true,
    fill: 'rgba(0, 0, 0, 0.5)',
    xOffset,
    yOffset,
    blur: 0,
});

const RED = [255, 0, 0, 255];
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

    /** Raises the highlight on the first item of a series, as the pointer would, which dims the other series. */
    const hoverSeries = async (seriesIndex: number) => {
        const [datum] = getSeriesNodeData<HighlightNodeDatum>(chart!, seriesIndex);
        chart!.ctx.highlightManager.updateHighlight(chart!.id, datum);
        await waitForChartStability(chart!);
    };

    /** How the markers of a series that are drawn are drawing, which is `cutout` while a highlight dims their series. */
    const drawingModes = (seriesIndex: number) =>
        getSeriesSelectionNodes<Shape>(chart!, 'datumSelection', seriesIndex)
            .filter((node) => node.visible)
            .map((node) => node.drawingMode);

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
        const bars = (shadow: InternalAgDropShadowOptions | undefined): AgCartesianChartOptions => ({
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
            const options = (shadow: InternalAgDropShadowOptions): AgCartesianChartOptions => ({
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
            // The fill opacity is the default of the theme, which is translucent.
            const translucent = (series: AgCartesianChartOptions['series']): AgCartesianChartOptions => ({
                ...areas,
                series: series!.map((item) => ({
                    ...item,
                    fillOpacity: undefined,
                })) as AgCartesianChartOptions['series'],
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
            const overlapping = (shadow: InternalAgDropShadowOptions | undefined): AgCartesianChartOptions => ({
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
            // An opaque fill, so that a shadow beneath it can't show, and one over it darkens the fill.
            const withMarkerShadows: AgCartesianChartOptions = internalOptions<AgCartesianChartOptions>({
                ...areas,
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'high',
                        fill: 'red',
                        fillOpacity: 1,
                        strokeWidth: 0,
                        marker: { enabled: true, size: 8, fill: 'blue', shadow: shadowAt(0, 20) },
                    },
                ],
            });

            /** A pixel of the fill below the first marker, where the shadow of that marker falls. */
            const belowMarker = async () => {
                await create(withMarkerShadows);
                const [{ x, y }] = itemCentres(0);
                return { x, y: y + 20 };
            };

            it('should not draw the shadow over the fill', async () => {
                const { x, y } = await belowMarker();

                expect(pixelAt(x, y)).toEqual(RED);
            });

            it('should draw the shadow over the fill when the root cannot cast, so that the test tells them apart', async () => {
                withoutRoot();
                const { x, y } = await belowMarker();

                expect(pixelAt(x, y)).not.toEqual(RED);
                expect(pixelAt(x, y)[0]).toBeLessThan(RED[0]);
            });

            it('should still cast the shadow where nothing else is drawn', async () => {
                await create(
                    internalOptions<AgCartesianChartOptions>({
                        ...withMarkerShadows,
                        series: [
                            {
                                ...(withMarkerShadows.series![0] as object),
                                marker: { enabled: true, size: 8, fill: 'blue', shadow: shadowAt(-30) },
                            },
                        ],
                    })
                );
                const [{ x, y }] = itemCentres(0);

                // Left of the first point of the area, there is neither fill nor marker to cover it.
                expect(isHalfBlack(pixelAt(x - 30, y))).toBe(true);
            });
        });

        describe('while a highlight dims the area', () => {
            // The shadow is opaque, but dimmed to the strength of the markers that cast it, so what it lets through
            // of the area's fill, which is translucent while it is dimmed, depends on whether it falls beneath or over it.
            const dimmed = (shadow: InternalAgDropShadowOptions): AgCartesianChartOptions =>
                internalOptions<AgCartesianChartOptions>({
                    ...areas,
                    highlight: { drawingMode: 'cutout' },
                    series: [
                        {
                            type: 'area',
                            xKey: 'x',
                            yKey: 'high',
                            fill: 'red',
                            fillOpacity: 1,
                            strokeWidth: 0,
                            marker: { enabled: true, size: 8, fill: 'blue', fillOpacity: 1, shadow },
                        },
                        { type: 'line', xKey: 'x', yKey: 'low' },
                    ],
                });
            const SOLID = { ...shadowAt(0, 20), fill: 'black' };

            const dim = async (shadow: InternalAgDropShadowOptions) => {
                await create(dimmed(shadow));
                const [{ x, y }] = itemCentres(0);
                await hoverSeries(1);
                expect(drawingModes(0)).toEqual(['cutout', 'cutout']);
                return { x, y };
            };

            it('should draw the shadow of a marker beneath the fill of its area', async () => {
                const { x, y } = await dim(SOLID);
                const through = pixelAt(x, y + 20);

                withoutRoot();
                await dim(SOLID);
                const local = pixelAt(x, y + 20);

                // Red under a black shadow is darkened by it; beneath a fill that is red too, it shows through less.
                expect(through[0]).toBeLessThan(RED[0]);
                expect(through[0]).toBeGreaterThan(local[0]);
            });

            it('should leave the shadow whole beneath a marker that cuts out the layer above it', async () => {
                // The shadow of a marker falls on the marker itself, which erases the layer above the shadow.
                const { x, y } = await dim(shadowAt(0, 0));
                const shadowed = pixelAt(x, y);

                await dim({ ...shadowAt(0, 0), enabled: false });

                expect(shadowed[0]).toBeLessThan(pixelAt(x, y)[0]);
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
        const segmented = (
            shadow: InternalAgDropShadowOptions | undefined,
            segments: boolean
        ): AgCartesianChartOptions => ({
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
            const options = (shadow: InternalAgDropShadowOptions | undefined): AgCartesianChartOptions => ({
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

        const scatters = (shadow: InternalAgDropShadowOptions | undefined): AgCartesianChartOptions =>
            internalOptions<AgCartesianChartOptions>({
                data,
                axes: AXES,
                series: [
                    { type: 'scatter', xKey: 'x', yKey: 'y', ...square },
                    { type: 'scatter', xKey: 'x', yKey: 'z', ...square, fill: 'blue', shadow },
                ],
            });

        const lines = (shadow: InternalAgDropShadowOptions | undefined): AgCartesianChartOptions =>
            internalOptions<AgCartesianChartOptions>({
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

    describe('marker shadows while a highlight dims the series', () => {
        const data = [
            { x: 3, y: 5, z: 0, w: 9 },
            { x: 6, y: 0, z: 5, w: 9 },
        ];
        const square = { shape: 'square' as const, size: 20, fill: 'red', fillOpacity: 1, strokeWidth: 0 };
        // Solid, so that a shadow beneath a translucent marker is plainly apart from one over it.
        const SOLID = 'black';

        const lines = (shadow: InternalAgDropShadowOptions | undefined): AgCartesianChartOptions =>
            internalOptions<AgCartesianChartOptions>({
                data,
                axes: AXES,
                highlight: { drawingMode: 'cutout' },
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y', strokeWidth: 0, marker: { enabled: true, ...square } },
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'z',
                        strokeWidth: 0,
                        marker: { enabled: true, ...square, fill: 'blue', shadow },
                    },
                    { type: 'line', xKey: 'x', yKey: 'w', strokeWidth: 0, marker: { enabled: true, ...square } },
                ],
            });

        describe('line markers', () => {
            /** Dims the first two series by raising the highlight on the third, and returns the marker that the shadow falls on. */
            const dim = async (shadow?: InternalAgDropShadowOptions) => {
                await create(lines(undefined));
                const [first] = itemCentres(0);
                const [second] = itemCentres(1);
                const cast = shadow ?? {
                    ...shadowAt(Math.round(first.x - second.x), Math.round(first.y - second.y)),
                    color: SOLID,
                };
                await create(lines(cast));
                await hoverSeries(2);
                expect(drawingModes(1)).toEqual(['cutout', 'cutout']);
                return first;
            };

            it('should cast the shadow beneath the markers of an earlier series', async () => {
                const first = await dim();
                const through = pixelAt(first.x, first.y);

                withoutRoot();
                await dim();
                const local = pixelAt(first.x, first.y);

                // Red is darkened by a black shadow over it, and shows through a translucent marker above one.
                expect(through[0]).toBeLessThan(RED[0]);
                expect(through[0]).toBeGreaterThan(local[0]);
            });

            it('should still cast the shadow where it falls on nothing', async () => {
                await create(lines(undefined));
                const [second] = itemCentres(1);
                await create(lines({ ...shadowAt(0, 40), fill: SOLID }));
                await hoverSeries(2);
                expect(drawingModes(1)).toEqual(['cutout', 'cutout']);

                // Below the marker that casts it, a cutout erases nothing that the root drew.
                expect(pixelAt(second.x, second.y + 40)[0]).toBeLessThan(WHITE[0]);
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
});
