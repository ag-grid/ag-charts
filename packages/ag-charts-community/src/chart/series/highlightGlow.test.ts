import { afterEach, describe, expect, it, vi } from 'vitest';

import { Group, Rect, Sector, Shape, Transformable } from 'ag-charts-core';
import type { Node } from 'ag-charts-core';
import type { AgChartOptions, AgDropShadowOptions, AgGlowOptions } from 'ag-charts-types';

import { Marker } from '../marker/marker';
import { getSeriesSelectionNodes } from '../test/seriesAccessors';
import { HIGHLIGHT_GLOW, SERIES_SHADOW } from '../test/shadowFixtures';
import { createChart, deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from '../test/utils';

const XY_DATA = [
    { x: 1, y: 5, size: 10 },
    { x: 2, y: 8, size: 20 },
    { x: 3, y: 3, size: 30 },
];
const CATEGORY_DATA = [
    { category: 'A', value: 5 },
    { category: 'B', value: 8 },
    { category: 'C', value: 3 },
];
const HISTOGRAM_DATA = [{ x: 1 }, { x: 2 }, { x: 2.5 }, { x: 4 }, { x: 5 }, { x: 5.5 }, { x: 7 }];

/** The four highlight styles that accept a `glow` on a series with series states. */
const BUCKETS = ['highlightedItem', 'unhighlightedItem', 'highlightedSeries', 'unhighlightedSeries'] as const;

function shapesOf<T extends Shape>(root: Group, kind: abstract new (...args: any[]) => T): T[] {
    const found: T[] = [];
    const visit = (node: unknown) => {
        if (node instanceof kind) found.push(node);
        if (node instanceof Group) {
            for (const child of node.children()) visit(child);
        }
    };
    visit(root);
    return found;
}

const casts = (shape: Shape) => shape.fillShadow?.enabled === true;

/** The shadow a glow casts: the same blurred silhouette as a shadow, centred on the item. */
const glowShadow = (glow: AgGlowOptions) => ({ ...glow, xOffset: 0, yOffset: 0 });

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

    let chart: any;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
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

        const [series] = chart.series;
        const datum = series.getNodeData()[0];
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
                expect(highlighted[0].fillShadow?.color).not.toBe(SERIES_SHADOW.color);
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

        it('takes glow fields from highlightedItem over highlightedSeries, field by field', async () => {
            const { highlighted } = await hoverFirstItem(testCase, undefined, {
                highlightedSeries: { glow: { enabled: true, color: '#0000ff', blur: 9, spread: 4 } },
                highlightedItem: { glow: { enabled: true, color: '#ff0000', blur: 5, spread: 3 } },
            });

            expect(highlighted[0].fillShadow).toMatchObject({
                enabled: true,
                color: '#ff0000',
                blur: 5,
                spread: 3,
                xOffset: 0,
                yOffset: 0,
            });
        });

        it('moves the glow from one hovered item to the next and ends it with the hover', async () => {
            const { series } = await hoverFirstItem(testCase, undefined, { highlightedItem: { glow: HIGHLIGHT_GLOW } });
            const [first, next] = series.getNodeData();
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
            chart.ctx.highlightManager.updateHighlight(chart.id, chart.series[1].getNodeData()[0]);
            await waitForChartStability(chart);
        };

        /** The bars of the two series sit side by side; how many pixels apart the first ends and the second begins. */
        const gapBetweenBars = async () => {
            await create(bars({}));
            const [left, right] = box(0).x < box(1).x ? [box(0), box(1)] : [box(1), box(0)];
            return { left, right, gap: right.x - (left.x + left.width), firstIsLeft: box(0).x < box(1).x };
        };

        it('draws the glow of the hovered item above its neighbour, but only as far as the glow reaches', async () => {
            const { gap, firstIsLeft } = await gapBetweenBars();
            const reach = Math.ceil(gap) + 4;
            await create(
                bars({
                    second: {
                        highlight: {
                            highlightedItem: { glow: { enabled: true, color: '#00aa00', blur: 0, spread: reach } },
                        },
                    },
                })
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
        });

        it('does not tint the neighbour at all when the glow does not reach it', async () => {
            const { gap } = await gapBetweenBars();
            await create(
                bars({
                    second: {
                        highlight: {
                            highlightedItem: {
                                glow: {
                                    enabled: true,
                                    color: '#00aa00',
                                    blur: 0,
                                    spread: Math.max(0, Math.floor(gap) - 2),
                                },
                            },
                        },
                    },
                })
            );
            await hoverSecond();

            const first = box(0);
            for (const fraction of [0.05, 0.5, 0.95]) {
                expect(pixelAt(first.x + first.width * fraction, first.y + first.height / 2)).toEqual(RED);
            }
        });

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
                const shadow = { enabled: true, color: 'rgba(0, 0, 0, 0.5)', xOffset, yOffset: 0, blur: 0 };
                await create(
                    bars(
                        {
                            second: {
                                shadow,
                                highlight: {
                                    unhighlightedSeries: { opacity: 1 },
                                    highlightedItem: { glow: { enabled: true, color: '#00aa00', blur: 0, spread: 1 } },
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
        const resolvedBuckets = async (theme: 'ag-default' | 'ag-default-dark') => {
            chart = deproxy(
                await createChart({
                    theme,
                    data: CATEGORY_DATA,
                    animation: { enabled: false },
                    series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
                } as AgChartOptions)
            );
            const { highlight } = chart.series[0].options;
            return BUCKETS.map((bucket) => [bucket, highlight[bucket]?.glow] as const);
        };

        it.each(BUCKETS)(
            'has the %s glow off, with the light values ready for when it is turned on',
            async (bucket) => {
                const buckets = Object.fromEntries(await resolvedBuckets('ag-default'));

                expect(buckets[bucket]).toMatchObject({
                    enabled: false,
                    color: 'rgba(0, 0, 0, 0.35)',
                    blur: 6,
                    spread: 1,
                });
            }
        );

        it.each(BUCKETS)('has the %s glow off, with the dark values ready for when it is turned on', async (bucket) => {
            const buckets = Object.fromEntries(await resolvedBuckets('ag-default-dark'));

            expect(buckets[bucket]).toMatchObject({
                enabled: false,
                color: 'rgba(255, 255, 255, 0.6)',
                blur: 4,
                spread: 1,
            });
        });

        it('does not apply the dark shadow colour to the glow', async () => {
            const buckets = Object.fromEntries(await resolvedBuckets('ag-default-dark'));

            expect(buckets.highlightedItem?.color).not.toBe('#000');
        });

        it('casts the light default glow once it is enabled, without any other glow field', async () => {
            const { highlighted } = await hoverFirstItem(SERIES[0], undefined, {
                highlightedItem: { glow: { enabled: true } },
            });

            expect(highlighted[0].fillShadow).toMatchObject({
                enabled: true,
                color: 'rgba(0, 0, 0, 0.35)',
                blur: 6,
                spread: 1,
                xOffset: 0,
                yOffset: 0,
            });
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

            expect(chart.series[0].options.highlight[bucket]).not.toHaveProperty('shadow');
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
});
