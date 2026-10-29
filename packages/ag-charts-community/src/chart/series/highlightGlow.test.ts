import { afterEach, describe, expect, it, vi } from 'vitest';

import { Rect, Sector, Shape, Transformable, overrideTintableShadows } from 'ag-charts-core';
import type { Node } from 'ag-charts-core';
import type { AgBarSeriesOptions, AgChartOptions, AgDropShadowOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { Chart } from '../chart';
import { Marker } from '../marker/marker';
import { getSeriesAt, getSeriesNodeData, getSeriesOptions, getSeriesSelectionNodes } from '../test/seriesAccessors';
import {
    CATEGORY_DATA,
    HIGHLIGHT_GLOW,
    HISTOGRAM_DATA,
    SERIES_SHADOW,
    XY_DATA,
    glowShadow,
    shapesOf,
} from '../test/shadowFixtures';
import { createChart, deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from '../test/utils';
import { HighlightState } from './seriesTypes';

/** The four highlight styles that accept a `glow` on a series with series states. */
const BUCKETS = ['highlightedItem', 'unhighlightedItem', 'highlightedSeries', 'unhighlightedSeries'] as const;

const STATES = {
    highlightedItem: HighlightState.Item,
    unhighlightedItem: HighlightState.OtherItem,
    highlightedSeries: HighlightState.Series,
    unhighlightedSeries: HighlightState.OtherSeries,
} as const;

const casts = (shape: Shape) => shape.fillShadow?.enabled === true;

interface SeriesCase {
    name: string;
    /** The series options, with `shadow` placed where this series reads it from. */
    series: (shadow: AgDropShadowOptions | undefined, extra: object) => object;
    data: object[];
    kind: abstract new (...args: any[]) => Shape;
}

const SERIES: SeriesCase[] = [
    {
        name: 'bar',
        data: CATEGORY_DATA,
        kind: Rect,
        series: (shadow, extra) => ({ type: 'bar', xKey: 'category', yKey: 'value', shadow, ...extra }),
    },
    {
        name: 'histogram',
        data: HISTOGRAM_DATA,
        kind: Rect,
        series: (shadow, extra) => ({
            type: 'histogram',
            xKey: 'x',
            bins: [
                [0, 2],
                [2, 4],
                [4, 6],
                [6, 8],
            ],
            shadow,
            ...extra,
        }),
    },
    {
        name: 'donut',
        data: CATEGORY_DATA,
        kind: Sector,
        series: (shadow, extra) => ({
            type: 'donut',
            angleKey: 'value',
            calloutLabelKey: 'category',
            shadow,
            ...extra,
        }),
    },
    {
        name: 'scatter',
        data: XY_DATA,
        kind: Marker,
        series: (shadow, extra) => ({ type: 'scatter', xKey: 'x', yKey: 'y', shadow, ...extra }),
    },
    {
        name: 'bubble',
        data: XY_DATA,
        kind: Marker,
        series: (shadow, extra) => ({ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'size', shadow, ...extra }),
    },
    {
        name: 'line markers',
        data: XY_DATA,
        kind: Marker,
        series: (shadow, extra) => ({
            type: 'line',
            xKey: 'x',
            yKey: 'y',
            marker: { enabled: true, shadow },
            ...extra,
        }),
    },
    {
        name: 'area markers',
        data: XY_DATA,
        kind: Marker,
        series: (shadow, extra) => ({
            type: 'area',
            xKey: 'x',
            yKey: 'y',
            marker: { enabled: true, shadow },
            ...extra,
        }),
    },
];

describe('highlight glow', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        chart?.destroy();
        vi.restoreAllMocks();
    });

    const hoverFirstItem = async (
        testCase: SeriesCase,
        shadow: AgDropShadowOptions | undefined,
        highlight: object = {},
        drawingMode: 'cutout' | 'overlay' = 'cutout'
    ) => {
        const options = {
            data: testCase.data,
            animation: { enabled: false },
            legend: { enabled: false },
            highlight: { drawingMode },
            series: [testCase.series(shadow, { highlight })],
        } as AgChartOptions;
        chart = deproxy(await createChart(options));

        const series = getSeriesAt(chart);
        const [datum] = getSeriesNodeData<HighlightNodeDatum>(chart);
        chart.ctx.highlightManager.updateHighlight(chart.id, datum);
        await waitForChartStability(chart);

        return {
            series,
            inPlace: shapesOf(series.contentGroup, testCase.kind),
            // Some series keep an invisible highlight copy of every item, and show only the hovered one.
            highlighted: shapesOf(series.highlightNodeGroup, testCase.kind).filter((shape) => shape.visible),
        };
    };

    describe.each(SERIES)('$name', (testCase) => {
        it('gives the itemStyler params no glow, in any highlight state', async () => {
            const params: object[] = [];
            const itemStyler = (itemParams: object) => {
                params.push(itemParams);
                return {};
            };
            // Marker series take the styler on the marker, the others on the series.
            const styled: SeriesCase = {
                ...testCase,
                series: (shadow, extra) => {
                    const options = testCase.series(shadow, extra) as Record<string, any>;
                    if ('marker' in options) return { ...options, marker: { ...options.marker, itemStyler } };
                    return { ...options, itemStyler };
                },
            };
            await hoverFirstItem(styled, undefined, {
                highlightedItem: { glow: HIGHLIGHT_GLOW },
                unhighlightedItem: { glow: HIGHLIGHT_GLOW },
                highlightedSeries: { glow: HIGHLIGHT_GLOW },
                unhighlightedSeries: { glow: HIGHLIGHT_GLOW },
            });

            expect(params.length).toBeGreaterThan(0);
            for (const itemParams of params) expect(itemParams).not.toHaveProperty('glow');
        });

        it.each(['cutout', 'overlay'] as const)(
            'casts only the highlightedItem glow from the hovered item in %s mode',
            async (drawingMode) => {
                const { highlighted } = await hoverFirstItem(
                    testCase,
                    undefined,
                    { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                    drawingMode
                );

                expect(highlighted).toHaveLength(1);
                expect(highlighted[0].fillShadow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));
            }
        );

        it('casts no glow unless it is enabled', async () => {
            const { highlighted } = await hoverFirstItem(testCase, undefined);

            expect(highlighted).toHaveLength(1);
            expect(highlighted.filter(casts)).toHaveLength(0);
        });

        it('casts no glow when it is configured but disabled', async () => {
            const { highlighted } = await hoverFirstItem(testCase, undefined, {
                highlightedItem: { glow: { ...HIGHLIGHT_GLOW, enabled: false } },
            });

            expect(highlighted.filter(casts)).toHaveLength(0);
        });

        it.each(['cutout', 'overlay'] as const)(
            'keeps the base shadow on every in-place item and off the highlight copy in %s mode',
            async (drawingMode) => {
                const { inPlace, highlighted } = await hoverFirstItem(
                    testCase,
                    SERIES_SHADOW,
                    { highlightedItem: { glow: HIGHLIGHT_GLOW } },
                    drawingMode
                );

                // Every in-place item, the hovered one included, casts the base shadow ...
                expect(inPlace.length).toBeGreaterThan(1);
                for (const shape of inPlace) expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);

                // ... and the highlight copy casts the glow alone, never merged with the base shadow.
                expect(highlighted).toHaveLength(1);
                expect(highlighted[0].fillShadow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));
                expect(highlighted[0].fillShadow?.fill).not.toBe(SERIES_SHADOW.fill);
                expect(highlighted[0].fillShadow?.xOffset).toBe(0);
                expect(highlighted[0].fillShadow?.yOffset).toBe(0);
            }
        );

        it.each(['cutout', 'overlay'] as const)(
            'does not cast the base shadow from the highlight copy when there is no glow in %s mode',
            async (drawingMode) => {
                const { inPlace, highlighted } = await hoverFirstItem(testCase, SERIES_SHADOW, {}, drawingMode);

                expect(highlighted).toHaveLength(1);
                expect(highlighted.filter(casts)).toHaveLength(0);
                for (const shape of inPlace) expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);
            }
        );

        it('casts no glow from the highlight copy when only the base shadow is configured', async () => {
            const { highlighted } = await hoverFirstItem(testCase, SERIES_SHADOW, {
                highlightedItem: { fill: 'orange' },
            });

            expect(highlighted.filter(casts)).toHaveLength(0);
        });

        it('takes the glow fields highlightedItem sets, and the rest from highlightedSeries', async () => {
            const { highlighted } = await hoverFirstItem(testCase, undefined, {
                highlightedSeries: { glow: { enabled: true, fill: '#0000ff', blur: 9, spread: 4 } },
                highlightedItem: { glow: { fill: '#ff0000', spread: 3 } },
            });

            // The item bucket sets the colour and spread alone; `enabled` and `blur` fall through to the series bucket.
            expect(highlighted[0].fillShadow).toMatchObject({
                enabled: true,
                fill: '#ff0000',
                blur: 9,
                spread: 3,
                xOffset: 0,
                yOffset: 0,
            });
        });

        it('lets highlightedItem switch off a glow that highlightedSeries turns on', async () => {
            const { highlighted } = await hoverFirstItem(testCase, undefined, {
                highlightedSeries: { glow: HIGHLIGHT_GLOW },
                highlightedItem: { glow: { enabled: false } },
            });

            expect(highlighted.filter(casts)).toHaveLength(0);
        });

        it('moves the glow from one hovered item to the next and ends it with the hover', async () => {
            const { series } = await hoverFirstItem(testCase, undefined, { highlightedItem: { glow: HIGHLIGHT_GLOW } });
            const [first, next] = getSeriesNodeData<HighlightNodeDatum>(chart);
            expect(next.datumIndex).not.toBe(first.datumIndex);

            chart.ctx.highlightManager.updateHighlight(chart.id, next);
            await waitForChartStability(chart);
            const moved = shapesOf(series.highlightNodeGroup, testCase.kind).filter((shape) => shape.visible);
            expect(moved).toHaveLength(1);
            expect(moved[0].fillShadow).toMatchObject(glowShadow(HIGHLIGHT_GLOW));

            chart.ctx.highlightManager.updateHighlight(chart.id);
            await waitForChartStability(chart);
            // The highlight layer is hidden, so nothing it holds is drawn.
            expect(series.highlightGroup.visible).toBe(false);
            expect(shapesOf(series.contentGroup, testCase.kind).filter(casts)).toHaveLength(0);
        });
    });

    describe('layering against a neighbouring series', () => {
        const RED = [255, 0, 0, 255];
        const GLOW_COLOR = [0, 170, 0, 255];
        const data = [{ category: 'A', first: 6, second: 6 }];

        const bars = (series: { first?: object; second?: object }, drawingMode: 'cutout' | 'overlay' = 'overlay') =>
            ({
                data,
                animation: { enabled: false },
                legend: { enabled: false },
                highlight: { drawingMode },
                series: [
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'first',
                        fill: 'red',
                        fillOpacity: 1,
                        strokeWidth: 0,
                        highlight: { unhighlightedSeries: { opacity: 1 } },
                        ...series.first,
                    },
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'second',
                        fill: 'blue',
                        fillOpacity: 1,
                        strokeWidth: 0,
                        highlight: { unhighlightedSeries: { opacity: 1 } },
                        ...series.second,
                    },
                ],
            }) as AgChartOptions;

        const create = async (options: AgChartOptions) => {
            chart?.destroy();
            chart = deproxy(await createChart(options));
            await waitForChartStability(chart);
        };

        const box = (seriesIndex: number) => {
            const [visible] = getSeriesSelectionNodes<Node>(chart, 'datumSelection', seriesIndex).filter(
                (node) => node.visible
            );
            return Transformable.toCanvas(visible);
        };

        const pixelAt = (x: number, y: number) => [
            ...chart.ctx.scene.canvas.context.getImageData(Math.round(x), Math.round(y), 1, 1).data,
        ];

        const hoverSecond = async () => {
            chart.ctx.highlightManager.updateHighlight(chart.id, getSeriesNodeData<HighlightNodeDatum>(chart, 1)[0]);
            await waitForChartStability(chart);
        };

        /** The bars of the two series sit side by side; how many pixels apart the first ends and the second begins. */
        const gapBetweenBars = async () => {
            await create(bars({}));
            const [left, right] = box(0).x < box(1).x ? [box(0), box(1)] : [box(1), box(0)];
            return { left, right, gap: right.x - (left.x + left.width), firstIsLeft: box(0).x < box(1).x };
        };

        it.each(['cutout', 'overlay'] as const)(
            'draws the glow of the hovered item above its neighbour, but only as far as the glow reaches in %s mode',
            async (drawingMode) => {
                const { gap, firstIsLeft } = await gapBetweenBars();
                const reach = Math.ceil(gap) + 4;
                await create(
                    bars(
                        {
                            second: {
                                highlight: {
                                    highlightedItem: {
                                        glow: {
                                            enabled: true,
                                            fill: '#00aa00',
                                            fillOpacity: 1,
                                            blur: 0,
                                            spread: reach,
                                        },
                                    },
                                },
                            },
                        },
                        drawingMode
                    )
                );
                await hoverSecond();

                const first = box(0);
                const second = box(1);
                const y = first.y + first.height / 2;
                // The edge of the neighbour that faces the hovered bar, and the one that faces away from it.
                const near = firstIsLeft ? first.x + first.width - 1 : first.x + 1;
                const far = firstIsLeft ? first.x + 1 : first.x + first.width - 1;
                const outsideGlow =
                    (firstIsLeft ? first.x + first.width : first.x) + (firstIsLeft ? -(reach + 2) : reach + 2);

                // The glow reaches into the neighbour, and sits above it ...
                expect(pixelAt(near, y)).toEqual(GLOW_COLOR);
                // ... and stops where its spread stops, so the rest of the neighbour keeps its own colour.
                expect(pixelAt(outsideGlow, y)).toEqual(RED);
                expect(pixelAt(far, y)).toEqual(RED);
                expect(pixelAt(first.x + first.width / 2, y)).toEqual(RED);
                expect(second.width).toBeGreaterThan(0);
            }
        );

        it.each(['cutout', 'overlay'] as const)(
            'does not tint the neighbour at all when the glow does not reach it in %s mode',
            async (drawingMode) => {
                const { gap } = await gapBetweenBars();
                await create(
                    bars(
                        {
                            second: {
                                highlight: {
                                    highlightedItem: {
                                        glow: {
                                            enabled: true,
                                            fill: '#00aa00',
                                            fillOpacity: 1,
                                            blur: 0,
                                            spread: Math.max(0, Math.floor(gap) - 2),
                                        },
                                    },
                                },
                            },
                        },
                        drawingMode
                    )
                );
                await hoverSecond();

                const first = box(0);
                for (const fraction of [0.05, 0.5, 0.95]) {
                    expect(pixelAt(first.x + first.width * fraction, first.y + first.height / 2)).toEqual(RED);
                }
            }
        );

        it.each(['cutout', 'overlay'] as const)(
            'keeps the base shadow of the hovered series beneath the neighbouring series in %s mode',
            async (drawingMode) => {
                const { left, right, firstIsLeft } = await gapBetweenBars();
                // A shadow that falls from the second series' bar onto the middle of the first one's.
                const xOffset = Math.round(
                    firstIsLeft
                        ? left.x + left.width / 2 - (right.x + right.width / 2)
                        : right.x + right.width / 2 - (left.x + left.width / 2)
                );
                const shadow = { enabled: true, fill: 'rgba(0, 0, 0, 0.5)', xOffset, yOffset: 0, blur: 0 };
                await create(
                    bars(
                        {
                            second: {
                                shadow,
                                highlight: {
                                    unhighlightedSeries: { opacity: 1 },
                                    highlightedItem: {
                                        glow: { enabled: true, fill: '#00aa00', fillOpacity: 1, blur: 0, spread: 1 },
                                    },
                                },
                            },
                        },
                        drawingMode
                    )
                );
                const first = box(0);
                const centre = [first.x + first.width / 2, first.y + first.height / 2] as const;
                expect(pixelAt(...centre)).toEqual(RED);

                await hoverSecond();

                // The shadow stays behind the earlier series while the later one is hovered.
                expect(pixelAt(...centre)).toEqual(RED);
            }
        );
    });

    describe('theme defaults', () => {
        const createBar = async (theme: 'ag-default' | 'ag-default-dark') => {
            chart = deproxy(
                await createChart({
                    theme,
                    data: CATEGORY_DATA,
                    animation: { enabled: false },
                    series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
                } as AgChartOptions)
            );
        };

        /** The glow the series resolves for an item in the bucket's highlight state, through its real cascade. */
        const resolvedGlow = (bucket: (typeof BUCKETS)[number]) => getSeriesAt(chart).getHighlightGlow(STATES[bucket]);

        it('puts the glow theme defaults on the series buckets only, so a series glow reaches the items', async () => {
            await createBar('ag-default');
            const { highlight } = getSeriesOptions<AgBarSeriesOptions>(chart);

            expect(highlight?.highlightedSeries?.glow).toBeDefined();
            expect(highlight?.unhighlightedSeries?.glow).toBeDefined();
            expect(highlight?.highlightedItem?.glow).toBeUndefined();
            expect(highlight?.unhighlightedItem?.glow).toBeUndefined();
        });

        it.each(BUCKETS)(
            'has the %s glow off, with the light values ready for when it is turned on',
            async (bucket) => {
                await createBar('ag-default');

                expect(resolvedGlow(bucket)).toEqual({ enabled: false, fillOpacity: 0.4, blur: 2, spread: 4 });
            }
        );

        it.each(BUCKETS)('has the %s glow off, with the dark values ready for when it is turned on', async (bucket) => {
            await createBar('ag-default-dark');

            expect(resolvedGlow(bucket)).toEqual({ enabled: false, fillOpacity: 0.4, blur: 2, spread: 4 });
        });

        it('leaves the glow fill to the item, whatever the theme', async () => {
            await createBar('ag-default-dark');

            expect(resolvedGlow('highlightedItem')?.fill).toBeUndefined();
        });

        it('casts the light default glow once it is enabled, without any other glow field', async () => {
            const { highlighted } = await hoverFirstItem(SERIES[0], undefined, {
                highlightedItem: { glow: { enabled: true } },
            });

            expect(highlighted[0].fillShadow).toMatchObject({
                enabled: true,
                fillOpacity: 0.4,
                blur: 2,
                spread: 4,
                xOffset: 0,
                yOffset: 0,
            });
            expect(highlighted[0].getCastShadow()?.fill).toBe(highlighted[0].fill);
        });
    });

    describe('highlight shadow is rejected', () => {
        const warnings = () => vi.mocked(console.warn).mock.calls.map(([message]) => String(message));

        const createWith = async (series: object) => {
            chart = deproxy(
                await createChart({
                    data: CATEGORY_DATA,
                    animation: { enabled: false },
                    legend: { enabled: false },
                    series: [series],
                } as AgChartOptions)
            );
            await waitForChartStability(chart);
        };

        it.each(BUCKETS)('warns about an unknown option for highlight.%s.shadow', async (bucket) => {
            await createWith({
                type: 'bar',
                xKey: 'category',
                yKey: 'value',
                highlight: { [bucket]: { shadow: SERIES_SHADOW } },
            });

            const messages = warnings().filter((message) => message.includes(`highlight.${bucket}.shadow`));
            expect(messages).toHaveLength(1);
            expect(messages[0]).toMatch(/unknown|not supported|invalid/i);
            vi.mocked(console.warn).mockClear();
        });

        it.each(BUCKETS)('drops highlight.%s.shadow from the resolved options', async (bucket) => {
            await createWith({
                type: 'bar',
                xKey: 'category',
                yKey: 'value',
                highlight: { [bucket]: { shadow: SERIES_SHADOW } },
            });

            expect(getSeriesOptions<AgBarSeriesOptions>(chart).highlight?.[bucket]).not.toHaveProperty('shadow');
            vi.mocked(console.warn).mockClear();
        });

        it('casts nothing from the highlight copy for a rejected highlightedItem.shadow', async () => {
            const { highlighted } = await hoverFirstItem(SERIES[0], undefined, {
                highlightedItem: { shadow: SERIES_SHADOW },
            });

            expect(highlighted.filter(casts)).toHaveLength(0);
            vi.mocked(console.warn).mockClear();
        });

        it('still accepts glow on the same bucket without a warning', async () => {
            await createWith({
                type: 'bar',
                xKey: 'category',
                yKey: 'value',
                highlight: { highlightedItem: { glow: HIGHLIGHT_GLOW } },
            });

            expect(warnings()).toEqual([]);
        });

        it('rejects a glow offset, which the glow does not have', async () => {
            await createWith({
                type: 'bar',
                xKey: 'category',
                yKey: 'value',
                highlight: { highlightedItem: { glow: { ...HIGHLIGHT_GLOW, xOffset: 4 } } },
            });

            expect(warnings().filter((message) => message.includes('glow.xOffset'))).toHaveLength(1);
            vi.mocked(console.warn).mockClear();
        });

        it('warns about a negative glow spread and ignores it', async () => {
            await createWith({
                type: 'bar',
                xKey: 'category',
                yKey: 'value',
                highlight: { highlightedItem: { glow: { ...HIGHLIGHT_GLOW, spread: -3 } } },
            });

            expect(warnings().filter((message) => message.includes('glow.spread'))).toHaveLength(1);
            vi.mocked(console.warn).mockClear();
        });
    });

    describe('glow fill', () => {
        const warnings = () => vi.mocked(console.warn).mock.calls.map(([message]) => String(message));
        const GLOW = { enabled: true } as const;

        describe.each(SERIES)('$name', (testCase) => {
            it('takes the fill of the item that it surrounds when it sets none', async () => {
                const { highlighted } = await hoverFirstItem(testCase, undefined, { highlightedItem: { glow: GLOW } });

                expect(highlighted).toHaveLength(1);
                const [shape] = highlighted;
                expect(typeof shape.fill).toBe('string');
                expect(shape.getCastShadow()).toMatchObject({ enabled: true, fill: shape.fill, fillOpacity: 0.4 });
            });

            it('takes the fill of the highlight style, where the item is highlighted with another', async () => {
                const { highlighted } = await hoverFirstItem(testCase, undefined, {
                    highlightedItem: { fill: 'orange', glow: GLOW },
                });

                expect(highlighted[0].getCastShadow()?.fill).toBe('orange');
            });

            it('casts its own fill, and not that of the item, when it sets one', async () => {
                const { highlighted } = await hoverFirstItem(testCase, undefined, {
                    highlightedItem: { fill: 'orange', glow: { ...GLOW, fill: '#123456' } },
                });

                expect(highlighted[0].getCastShadow()).toMatchObject({ fill: '#123456', fillOpacity: 0.4 });
            });

            it('casts at the fillOpacity that it sets, and at that of the theme where it sets none', async () => {
                const set = await hoverFirstItem(testCase, undefined, {
                    highlightedItem: { glow: { ...GLOW, fillOpacity: 0.7 } },
                });
                expect(set.highlighted[0].getCastShadow()?.fillOpacity).toBe(0.7);
                chart.destroy();

                const unset = await hoverFirstItem(testCase, undefined, { highlightedItem: { glow: GLOW } });
                expect(unset.highlighted[0].getCastShadow()?.fillOpacity).toBe(0.4);
            });

            it.each(BUCKETS)('takes fill and fillOpacity in the %s bucket', async (bucket) => {
                const glow = { enabled: true, fill: '#abcdef', fillOpacity: 0.9, blur: 1, spread: 1 };
                const { series } = await hoverFirstItem(testCase, undefined, { [bucket]: { glow } });

                expect(warnings()).toEqual([]);
                expect(series.getHighlightGlow(STATES[bucket])).toMatchObject(glow);
            });

            it('rejects a glow colour, which a glow no longer has', async () => {
                const { highlighted } = await hoverFirstItem(testCase, undefined, {
                    highlightedItem: { glow: { ...GLOW, color: '#ff00ff' } },
                });

                const messages = warnings().filter((message) => message.includes('glow.color'));
                expect(messages).toHaveLength(1);
                expect(messages[0]).toMatch(/unknown|not supported|invalid/i);
                expect(highlighted[0].fillShadow).not.toHaveProperty('color');
                expect(highlighted[0].getCastShadow()?.fill).toBe(highlighted[0].fill);
                vi.mocked(console.warn).mockClear();
            });
        });

        describe('where the item has no fill of its own to take', () => {
            const marker = (extra: object) => ({
                ...SERIES[3],
                series: (shadow: AgDropShadowOptions | undefined, options: object) => ({
                    type: 'scatter',
                    xKey: 'x',
                    yKey: 'y',
                    shadow,
                    ...extra,
                    ...options,
                }),
            });

            it('takes the stroke of a marker with no fill', async () => {
                const { highlighted } = await hoverFirstItem(
                    marker({ fill: 'none', stroke: 'blue', strokeWidth: 2 }),
                    undefined,
                    {
                        highlightedItem: { glow: GLOW },
                    }
                );

                expect(highlighted[0].getCastShadow()?.fill).toBe('blue');
            });

            it('takes the stroke of a marker whose fill is fully transparent', async () => {
                const { highlighted } = await hoverFirstItem(
                    marker({ fill: 'red', fillOpacity: 0, stroke: 'blue', strokeWidth: 2 }),
                    undefined,
                    { highlightedItem: { glow: GLOW } }
                );

                expect(highlighted[0].getCastShadow()?.fill).toBe('blue');
            });

            it('takes the stroke of a marker whose fill is transparent in its own colour', async () => {
                const { highlighted } = await hoverFirstItem(
                    marker({ fill: 'rgba(255, 0, 0, 0)', fillOpacity: 1, stroke: 'blue', strokeWidth: 2 }),
                    undefined,
                    { highlightedItem: { glow: GLOW } }
                );

                expect(highlighted[0].getCastShadow()?.fill).toBe('blue');
            });

            it('prefers the fill to the stroke', async () => {
                const { highlighted } = await hoverFirstItem(
                    marker({ fill: 'red', fillOpacity: 1, stroke: 'blue', strokeWidth: 2 }),
                    undefined,
                    { highlightedItem: { glow: GLOW } }
                );

                expect(highlighted[0].getCastShadow()?.fill).toBe('red');
            });

            it('casts no glow, and not a black one, from a marker with neither a fill nor a stroke', async () => {
                const { highlighted } = await hoverFirstItem(
                    marker({ fill: 'none', stroke: 'none', strokeWidth: 2 }),
                    undefined,
                    { highlightedItem: { glow: GLOW } }
                );

                expect(highlighted).toHaveLength(1);
                expect(highlighted[0].getCastShadow()).toBeUndefined();
            });

            it('still casts a glow with a fill of its own from a marker with neither', async () => {
                const { highlighted } = await hoverFirstItem(
                    marker({ fill: 'none', stroke: 'none', strokeWidth: 2 }),
                    undefined,
                    { highlightedItem: { glow: { ...GLOW, fill: 'green' } } }
                );

                expect(highlighted[0].getCastShadow()?.fill).toBe('green');
            });

            it('casts a solid colour, and not the gradient, from an item with a gradient fill', async () => {
                const stops = [
                    { color: '#ff0000', stop: 0 },
                    { color: '#0000ff', stop: 1 },
                ];
                const { highlighted } = await hoverFirstItem(
                    {
                        ...SERIES[0],
                        series: (shadow, options) => ({
                            ...SERIES[0].series(shadow, options),
                            fill: { type: 'gradient', colorStops: stops },
                        }),
                    },
                    undefined,
                    { highlightedItem: { glow: GLOW } }
                );

                const fill = highlighted[0].getCastShadow()?.fill;
                expect(typeof fill).toBe('string');
                expect(stops.map((stop) => stop.color)).toContain(fill);
            });
        });

        describe('the pixels of a glow that takes the stroke of an item with no fill', () => {
            const BLUE = [0, 0, 255, 255];
            const WHITE = [255, 255, 255, 255];
            const GREEN = [0, 255, 0, 255];
            const GREEN_FILL = '#00ff00';
            const glow = (extra: object) => ({ enabled: true, fillOpacity: 1, ...extra });

            const hoveredPixels = async (
                testCase: SeriesCase,
                options: object,
                bucketGlow: object,
                drawingMode: 'cutout' | 'overlay' = 'cutout'
            ) => {
                const { highlighted } = await hoverFirstItem(
                    {
                        ...testCase,
                        series: (shadow, extra) => ({ ...testCase.series(shadow, extra), ...options }),
                    },
                    undefined,
                    { highlightedItem: { glow: bucketGlow } },
                    drawingMode
                );
                const { x, y, width } = Transformable.toCanvas(highlighted[0]);
                const pixelAt = (px: number, py: number) => [
                    ...chart.ctx.scene.canvas.context.getImageData(Math.round(px), Math.round(py), 1, 1).data,
                ];
                // Sampled above the shape and off its centre line, clear of the crosshair that the hover draws.
                return { above: (offset: number) => pixelAt(x + width / 2 + 4, y - offset) };
            };

            const NO_FILL_MARKER = { fill: 'none', stroke: 'blue', strokeWidth: 2, size: 24 };
            const NO_FILL_BAR = { fill: 'red', fillOpacity: 0, stroke: 'blue', strokeWidth: 2 };

            it.each([
                ['a marker with no fill', SERIES[3], NO_FILL_MARKER],
                ['a bar whose fill is fully transparent', SERIES[0], NO_FILL_BAR],
            ] as const)('draws a spread glow in the stroke colour around %s', async (_name, testCase, options) => {
                const pixels = await hoveredPixels(testCase, options, glow({ spread: 4, blur: 0 }));

                expect(pixels.above(2)).toEqual(BLUE);
                expect(pixels.above(12)).toEqual(WHITE);
            });

            it.each([
                ['a marker with no fill', SERIES[3], NO_FILL_MARKER],
                ['a bar whose fill is fully transparent', SERIES[0], NO_FILL_BAR],
            ] as const)('draws a blur-only glow in the stroke colour around %s', async (_name, testCase, options) => {
                const pixels = await hoveredPixels(testCase, options, glow({ spread: 0, blur: 8 }));
                const [red, , blue] = pixels.above(2);

                // Over the white background, a blue glow lowers red and keeps blue.
                expect(red).toBeLessThan(blue);
                expect(blue).toBe(255);
            });

            it('draws no glow around a marker with neither a fill nor a stroke', async () => {
                const pixels = await hoveredPixels(
                    SERIES[3],
                    { fill: 'none', stroke: 'none', strokeWidth: 2, size: 24 },
                    glow({ spread: 4, blur: 0 })
                );

                expect(pixels.above(2)).toEqual(WHITE);
            });

            it.each([
                ['a marker with no fill', SERIES[3], NO_FILL_MARKER],
                ['a bar whose fill is fully transparent', SERIES[0], NO_FILL_BAR],
            ] as const)(
                'draws a glow in its own fill around %s, cast from the stroke',
                async (_name, testCase, options) => {
                    const pixels = await hoveredPixels(
                        testCase,
                        options,
                        glow({ spread: 4, blur: 0, fill: GREEN_FILL })
                    );

                    expect(pixels.above(2)).toEqual(GREEN);
                    expect(pixels.above(12)).toEqual(WHITE);
                }
            );

            it('draws a blur-only glow in its own fill around a marker with no fill', async () => {
                const pixels = await hoveredPixels(
                    SERIES[3],
                    NO_FILL_MARKER,
                    glow({ spread: 0, blur: 8, fill: GREEN_FILL })
                );
                const [red, green, blue] = pixels.above(2);

                // Over the white background, a green glow lowers red and blue and keeps green.
                expect(green).toBe(255);
                expect(red).toBeLessThan(green);
                expect(blue).toBeLessThan(green);
            });

            it('draws no glow in its own fill around a marker with neither a fill nor a stroke', async () => {
                const pixels = await hoveredPixels(
                    SERIES[3],
                    { fill: 'none', stroke: 'none', strokeWidth: 2, size: 24 },
                    glow({ spread: 4, blur: 0, fill: GREEN_FILL })
                );

                expect(pixels.above(2)).toEqual(WHITE);
            });

            it('draws a glow in its own fill from the fill alone, not the stroke, around a marker that has a fill', async () => {
                // The stroke reaches 5px past the edge of the fill, which the 4px of spread of a glow cast from the fill stays within.
                const pixels = await hoveredPixels(
                    SERIES[3],
                    { fill: 'red', fillOpacity: 1, stroke: 'blue', strokeWidth: 10, size: 24 },
                    glow({ spread: 4, blur: 0, fill: GREEN_FILL })
                );
                const sampled = [0, 2, 4, 6, 8, 10, 12].map((offset) => pixels.above(offset));

                expect(sampled).not.toContainEqual(GREEN);
            });

            it('draws a glow of the item fill, and not the stroke, around a marker that has a fill', async () => {
                const pixels = await hoveredPixels(
                    SERIES[3],
                    { fill: 'red', fillOpacity: 1, stroke: 'blue', strokeWidth: 2, size: 24 },
                    glow({ spread: 4, blur: 0 })
                );

                expect(pixels.above(3)).toEqual([255, 0, 0, 255]);
            });

            describe('around a stroked item whose fill has no colour to take', () => {
                // 1x1 transparent PNG: an image fill has no colour, and the stroke gives the glow its colour.
                const IMAGE = {
                    type: 'image',
                    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
                };
                const CLEAR_FIRST_STOP = {
                    type: 'gradient',
                    colorStops: [
                        { color: 'rgba(255, 0, 0, 0)', stop: 0 },
                        { color: 'rgba(255, 0, 0, 1)', stop: 1 },
                    ],
                };
                const PAINTS = [
                    ['an image fill', IMAGE],
                    ['a gradient whose first stop is transparent', CLEAR_FIRST_STOP],
                ] as const;
                const SHAPES = [
                    ['bar', SERIES[0], { stroke: 'blue', strokeWidth: 2 }],
                    [
                        'marker',
                        SERIES[3],
                        { shape: 'square', fillOpacity: 1, stroke: 'blue', strokeWidth: 2, size: 24 },
                    ],
                ] as const;

                /** The pixels above the shape, one for each pixel of distance from its top edge. */
                const column = async (testCase: SeriesCase, options: object, bucketGlow: object) => {
                    const pixels = await hoveredPixels(testCase, options, bucketGlow);
                    const sampled = Array.from({ length: 14 }, (_, offset) => pixels.above(offset));
                    chart.destroy();
                    return sampled;
                };
                const covered = (sampled: number[][]) => sampled.map((pixel) => pixel.join() !== WHITE.join());

                describe.each(SHAPES)('a %s', (_shape, testCase, stroke) => {
                    it.each(PAINTS)(
                        'casts the same silhouette with and without a glow fill, with %s',
                        async (_p, fill) => {
                            const options = { ...stroke, fill };
                            const inferred = await column(testCase, options, glow({ spread: 4, blur: 0 }));
                            const explicit = await column(
                                testCase,
                                options,
                                glow({ spread: 4, blur: 0, fill: GREEN_FILL })
                            );

                            expect(covered(inferred)).toContain(true);
                            expect(covered(explicit)).toEqual(covered(inferred));
                            // The colour of the glow is the only difference: the stroke's, or the fill that was set.
                            expect(inferred[3]).toEqual(BLUE);
                            expect(explicit[3]).toEqual(GREEN);
                            // The glow of a fill reaches 4px past the fill, 3px past the stroke.
                            expect(explicit[8]).toEqual(WHITE);
                        }
                    );
                });
            });

            describe('parity of the routes that cast a glow', () => {
                const TRANSLUCENT = { fill: 'rgba(255, 0, 0, 0.5)', fillOpacity: 1, strokeWidth: 0, size: 24 };
                const TRANSLUCENT_FILL = 'rgba(255, 0, 0, 0.5)';
                const PARITY_CASES = [
                    ['bar', SERIES[0]],
                    ['marker', SERIES[3]],
                ] as const;

                afterEach(() => overrideTintableShadows());

                const glowPixel = async (
                    testCase: SeriesCase,
                    bucketGlow: object,
                    drawingMode: 'cutout' | 'overlay',
                    canTint: boolean | undefined
                ) => {
                    overrideTintableShadows(canTint);
                    const pixels = await hoveredPixels(testCase, TRANSLUCENT, bucketGlow, drawingMode);
                    const pixel = pixels.above(2);
                    chart.destroy();
                    return pixel;
                };

                describe.each(PARITY_CASES)('a %s', (_name, testCase) => {
                    describe.each(['cutout', 'overlay'] as const)('in %s mode', (drawingMode) => {
                        const spread = glow({ spread: 4, blur: 0 });

                        it('applies the alpha of the colour to both the colour and the strength', async () => {
                            const [red, green, blue, alpha] = await glowPixel(testCase, spread, drawingMode, undefined);

                            // A half of a half, over white: 255 * (1 - 0.25).
                            expect(red).toBe(255);
                            expect(Math.abs(green - 191)).toBeLessThanOrEqual(2);
                            expect(Math.abs(blue - 191)).toBeLessThanOrEqual(2);
                            expect(alpha).toBe(255);
                        });

                        it.each([undefined, false])(
                            'casts the same pixels from an inferred fill as from the same fill set, with tinting %s',
                            async (canTint) => {
                                const inferred = await glowPixel(testCase, spread, drawingMode, canTint);
                                const explicit = await glowPixel(
                                    testCase,
                                    { ...spread, fill: TRANSLUCENT_FILL },
                                    drawingMode,
                                    canTint
                                );

                                for (let i = 0; i < 4; i++)
                                    expect(Math.abs(inferred[i] - explicit[i])).toBeLessThanOrEqual(2);
                            }
                        );

                        it.each([
                            ['inferred', {}],
                            ['set', { fill: TRANSLUCENT_FILL }],
                        ])('casts the same pixels where the canvas cannot tint, with a fill %s', async (_f, extra) => {
                            const tinted = await glowPixel(testCase, { ...spread, ...extra }, drawingMode, undefined);
                            const perColour = await glowPixel(testCase, { ...spread, ...extra }, drawingMode, false);

                            for (let i = 0; i < 4; i++)
                                expect(Math.abs(tinted[i] - perColour[i])).toBeLessThanOrEqual(2);
                        });
                    });
                });
            });
        });

        it('casts no glow from an item that has no fill and no stroke, while the other items keep their shadow', async () => {
            const { inPlace, highlighted } = await hoverFirstItem(
                {
                    ...SERIES[3],
                    series: (shadow, options) => ({
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        shadow,
                        fill: 'none',
                        stroke: 'none',
                        ...options,
                    }),
                },
                SERIES_SHADOW,
                { highlightedItem: { glow: GLOW } }
            );

            expect(highlighted[0].getCastShadow()).toBeUndefined();
            for (const shape of inPlace) expect(shape.getCastShadow()).toMatchObject(SERIES_SHADOW);
        });

        it('takes the fill of each item in turn as the hover moves', async () => {
            const colours = ['#ff0000', '#00ff00', '#0000ff'];
            const testCase: SeriesCase = {
                ...SERIES[0],
                series: (shadow, options) => ({
                    ...SERIES[0].series(shadow, options),
                    itemStyler: ({ datum }: { datum: object }) => ({
                        fill: colours[CATEGORY_DATA.indexOf(datum as never)],
                    }),
                }),
            };
            const { series } = await hoverFirstItem(testCase, undefined, { highlightedItem: { glow: GLOW } });
            const nodeData = getSeriesNodeData<HighlightNodeDatum>(chart);

            for (const datum of nodeData) {
                chart.ctx.highlightManager.updateHighlight(chart.id, datum);
                await waitForChartStability(chart);
                const [shape] = shapesOf(series.highlightNodeGroup, Rect).filter((node) => node.visible);
                expect(shape.getCastShadow()?.fill).toBe(shape.fill);
                expect(shape.getCastShadow()?.fill).toBe(colours[datum.datumIndex]);
            }
        });
    });
});
