import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartOptions, AgDropShadowOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { Group } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';
import { Sector } from '../../scene/shape/sector';
import { Shape } from '../../scene/shape/shape';
import { Marker } from '../marker/marker';
import { HIGHLIGHT_SHADOW, SERIES_SHADOW } from '../test/shadowFixtures';
import {
    deproxy,
    expectWarningMessages,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

const XY_DATA = [
    { x: 1, y: 5, size: 10 },
    { x: 2, y: 8, size: 20 },
    { x: 3, y: 3, size: 30 },
];
const HISTOGRAM_DATA = [{ x: 1 }, { x: 2 }, { x: 2.5 }, { x: 4 }, { x: 5 }, { x: 5.5 }, { x: 7 }];
const DONUT_DATA = [
    { category: 'A', value: 5 },
    { category: 'B', value: 8 },
    { category: 'C', value: 3 },
];

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

interface SeriesCase {
    name: string;
    /** The series options, with `shadow` placed where this series reads it from. */
    series: (shadow: AgDropShadowOptions | undefined, extra: object) => object;
    data: object[];
    kind: abstract new (...args: any[]) => Shape;
}

const SERIES: SeriesCase[] = [
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
        data: DONUT_DATA,
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
        series: (shadow, extra) => ({
            type: 'bubble',
            xKey: 'x',
            yKey: 'y',
            sizeKey: 'size',
            shadow,
            ...extra,
        }),
    },
    {
        name: 'line',
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
        name: 'area',
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

describe('highlightedItem.shadow', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    /** The highlight the legend raises for the series' first legend item: per sector, or the whole series. */
    const legendHighlight = (series: any) => {
        const [legendDatum] = series.getLegendData('category');
        if (legendDatum == null) return undefined;
        const { itemId, legendItemName } = legendDatum;
        return typeof itemId === 'number'
            ? { series, itemId: undefined, datum: undefined, datumIndex: itemId, legendItemName }
            : { series, itemId, datum: undefined, datumIndex: Number.NaN, legendItemName };
    };

    const hoverFirstItem = async (
        testCase: SeriesCase,
        shadow: AgDropShadowOptions | undefined,
        highlight: object = {},
        drawingMode: 'cutout' | 'overlay' = 'cutout',
        via: 'item' | 'legend' = 'item'
    ) => {
        const options = {
            data: testCase.data,
            animation: { enabled: false },
            legend: { enabled: false },
            highlight: { drawingMode },
            series: [testCase.series(shadow, { highlight })],
        } as AgChartOptions;
        prepareTestOptions(options);
        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);

        const [series] = chart.series;
        const inPlaceBefore = shapesOf(series.contentGroup, testCase.kind);
        // The shapes are live, so count what they cast now, before the hover changes it.
        const castingBefore = inPlaceBefore.filter(casts).length;
        const datum = via === 'legend' ? legendHighlight(series) : series.getNodeData()[0];
        if (datum != null) chart.ctx.highlightManager.updateHighlight(chart.id, datum);
        await waitForChartStability(chart);

        return {
            series,
            inPlaceBefore,
            castingBefore,
            inPlace: shapesOf(series.contentGroup, testCase.kind),
            // Some series keep an invisible highlight copy of every item, and show only the hovered one.
            highlighted: shapesOf(series.highlightNodeGroup, testCase.kind).filter((shape) => shape.visible),
        };
    };

    describe.each(SERIES)('$name', (testCase) => {
        it('casts one shadow per hover from the highlight layer when the highlight cuts out', async () => {
            const { inPlace, highlighted } = await hoverFirstItem(testCase, SERIES_SHADOW);

            expect(highlighted).toHaveLength(1);
            expect(highlighted[0].fillShadow).toMatchObject(SERIES_SHADOW);

            const [hovered, ...others] = inPlace;
            expect(casts(hovered)).toBe(false);
            expect(others.length).toBeGreaterThan(0);
            for (const shape of others) expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);
        });

        it('casts one shadow per hover from the in-place item when the highlight overlays', async () => {
            const { inPlace, highlighted } = await hoverFirstItem(testCase, SERIES_SHADOW, {}, 'overlay');

            expect(highlighted).toHaveLength(1);
            expect(casts(highlighted[0])).toBe(false);
            for (const shape of inPlace) expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);
        });

        it('keeps every shadow when the item is hovered through the legend', async () => {
            const { castingBefore, inPlace, highlighted } = await hoverFirstItem(
                testCase,
                SERIES_SHADOW,
                {},
                'cutout',
                'legend'
            );

            // A legend highlight has no datum, so a series that draws no copy for it must keep the in-place shadow.
            expect([...inPlace, ...highlighted].filter(casts).length).toBeGreaterThanOrEqual(castingBefore);
        });

        it('moves the shadow from one hovered item to the next', async () => {
            const { series } = await hoverFirstItem(testCase, SERIES_SHADOW);
            const [first, next] = series.getNodeData();

            expect(next.datumIndex).not.toBe(first.datumIndex);
            chart.ctx.highlightManager.updateHighlight(chart.id, next);
            await waitForChartStability(chart);

            // The first item casts again, and only the second one's in-place copy is cut out.
            const [firstShape, nextShape, ...others] = shapesOf(series.contentGroup, testCase.kind);
            expect(firstShape.fillShadow).toMatchObject(SERIES_SHADOW);
            expect(casts(nextShape)).toBe(false);
            for (const shape of others) expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);
        });

        it('restores the in-place shadow when the hover ends', async () => {
            const { series, inPlaceBefore } = await hoverFirstItem(testCase, SERIES_SHADOW);
            expect(casts(shapesOf(series.contentGroup, testCase.kind)[0])).toBe(false);

            chart.ctx.highlightManager.updateHighlight(chart.id);
            await waitForChartStability(chart);

            const shapes = shapesOf(series.contentGroup, testCase.kind);
            expect(shapes).toHaveLength(inPlaceBefore.length);
            for (const shape of shapes) expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);
        });

        it('merges highlightedItem.shadow over the series shadow on the hovered item', async () => {
            const { inPlace, highlighted } = await hoverFirstItem(testCase, SERIES_SHADOW, {
                highlightedItem: { shadow: HIGHLIGHT_SHADOW },
            });

            expect(highlighted).toHaveLength(1);
            expect(highlighted[0].fillShadow).toMatchObject(HIGHLIGHT_SHADOW);

            const [hovered, ...others] = inPlace;
            expect(casts(hovered)).toBe(false);
            for (const shape of others) expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);
        });

        it('casts highlightedItem.shadow from the highlight layer in overlay mode too', async () => {
            const { inPlace, highlighted } = await hoverFirstItem(
                testCase,
                SERIES_SHADOW,
                { highlightedItem: { shadow: HIGHLIGHT_SHADOW } },
                'overlay'
            );

            expect(highlighted[0].fillShadow).toMatchObject(HIGHLIGHT_SHADOW);
            expect(casts(inPlace[0])).toBe(false);
            for (const shape of inPlace.slice(1)) expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);
        });

        it('fills highlightedItem.shadow gaps from the series shadow', async () => {
            const { highlighted } = await hoverFirstItem(testCase, SERIES_SHADOW, {
                highlightedItem: { shadow: { blur: 20 } },
            });

            expect(highlighted[0].fillShadow).toMatchObject({ ...SERIES_SHADOW, blur: 20 });
        });

        it('applies highlightedItem.shadow when the series has no shadow', async () => {
            const { inPlace, highlighted } = await hoverFirstItem(testCase, undefined, {
                highlightedItem: { shadow: HIGHLIGHT_SHADOW },
            });

            expect(highlighted[0].fillShadow).toMatchObject(HIGHLIGHT_SHADOW);
            for (const shape of inPlace) expect(casts(shape)).toBe(false);
        });

        describe('spread', () => {
            const SPREAD_SHADOW = { ...SERIES_SHADOW, spread: 5 };
            // Where the option sits in the path depends on the series: `shadow`, `marker.shadow` or the highlight's.
            const negativeSpreadWarning = (value: number) =>
                expect.stringMatching(
                    new RegExp(
                        `^AG Charts - Option \`series\\[0\\]\\.[\\w.]*shadow\\.spread\` cannot be set to \`${value}\`; expecting a number greater than or equal to 0, ignoring\\.$`
                    )
                );

            it('carries the series shadow spread to every item', async () => {
                const { inPlace, highlighted } = await hoverFirstItem(testCase, SPREAD_SHADOW, {}, 'overlay');

                expect(inPlace.length).toBeGreaterThan(0);
                for (const shape of inPlace) expect(shape.fillShadow).toMatchObject(SPREAD_SHADOW);
                expect(highlighted).toHaveLength(1);
            });

            it('carries the series shadow spread to the hovered item when the highlight cuts out', async () => {
                const { highlighted } = await hoverFirstItem(testCase, SPREAD_SHADOW);

                expect(highlighted).toHaveLength(1);
                expect(highlighted[0].fillShadow).toMatchObject(SPREAD_SHADOW);
            });

            it('has no spread unless configured', async () => {
                const { inPlace } = await hoverFirstItem(testCase, SERIES_SHADOW, {}, 'overlay');

                for (const shape of inPlace) expect(shape.fillShadow?.spread ?? 0).toBe(0);
            });

            it('merges highlightedItem.shadow.spread over the series shadow spread on the hovered item', async () => {
                const { inPlace, highlighted } = await hoverFirstItem(testCase, SPREAD_SHADOW, {
                    highlightedItem: { shadow: { ...HIGHLIGHT_SHADOW, spread: 9 } },
                });

                expect(highlighted[0].fillShadow).toMatchObject({ ...HIGHLIGHT_SHADOW, spread: 9 });
                for (const shape of inPlace.slice(1)) expect(shape.fillShadow).toMatchObject(SPREAD_SHADOW);
            });

            it('fills a missing highlightedItem.shadow.spread from the series shadow', async () => {
                const { highlighted } = await hoverFirstItem(testCase, SPREAD_SHADOW, {
                    highlightedItem: { shadow: { blur: 20 } },
                });

                expect(highlighted[0].fillShadow).toMatchObject({ ...SPREAD_SHADOW, blur: 20 });
            });

            it('applies highlightedItem.shadow.spread when the series has no shadow spread', async () => {
                const { inPlace, highlighted } = await hoverFirstItem(testCase, SERIES_SHADOW, {
                    highlightedItem: { shadow: { spread: 7 } },
                });

                expect(highlighted[0].fillShadow).toMatchObject({ ...SERIES_SHADOW, spread: 7 });
                for (const shape of inPlace.slice(1)) expect(shape.fillShadow?.spread ?? 0).toBe(0);
            });

            it('warns about and ignores a negative series shadow spread', async () => {
                const { inPlace } = await hoverFirstItem(testCase, { ...SERIES_SHADOW, spread: -4 }, {}, 'overlay');

                expectWarningMessages([negativeSpreadWarning(-4)]);
                for (const shape of inPlace) {
                    expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);
                    expect(shape.fillShadow?.spread ?? 0).toBe(0);
                }
            });

            it('warns about and ignores a negative highlightedItem.shadow.spread', async () => {
                const { highlighted } = await hoverFirstItem(
                    testCase,
                    { ...SERIES_SHADOW, spread: 3 },
                    {
                        highlightedItem: { shadow: { spread: -2 } },
                    }
                );

                expectWarningMessages([negativeSpreadWarning(-2)]);
                // The negative value is dropped, so the series shadow's spread shows through.
                expect(highlighted[0].fillShadow).toMatchObject({ ...SERIES_SHADOW, spread: 3 });
            });

            it('accepts a spread of zero without a warning', async () => {
                const { inPlace } = await hoverFirstItem(testCase, { ...SERIES_SHADOW, spread: 0 }, {}, 'overlay');

                expect(console.warn).not.toHaveBeenCalled();
                for (const shape of inPlace) expect(shape.fillShadow?.spread ?? 0).toBe(0);
            });
        });

        it('keeps the highlight shadow off when neither it nor the series shadow is enabled', async () => {
            const { highlighted } = await hoverFirstItem(testCase, undefined, {
                highlightedItem: { shadow: { color: 'rgba(170, 0, 0, 1)' } },
            });

            for (const shape of highlighted) expect(casts(shape)).toBe(false);
        });

        it('has no highlight shadow unless configured', async () => {
            const { series, inPlaceBefore, inPlace, highlighted } = await hoverFirstItem(testCase, undefined);

            expect(series.options.highlight?.highlightedItem?.shadow).toBeUndefined();
            for (const shape of [...inPlaceBefore, ...inPlace, ...highlighted]) expect(casts(shape)).toBe(false);
        });
    });

    describe('shadow state read once per update', () => {
        const testCase = SERIES.find(({ name }) => name === 'histogram')!;

        const createHovered = async (drawingMode: 'cutout' | 'overlay') => {
            const options = {
                data: testCase.data,
                animation: { enabled: false },
                legend: { enabled: false },
                highlight: { drawingMode },
                series: [testCase.series(SERIES_SHADOW, {})],
            } as AgChartOptions;
            prepareTestOptions(options);
            const proxy = AgCharts.create(options);
            chart = deproxy(proxy);
            await waitForChartStability(chart);

            const [series] = chart.series;
            chart.ctx.highlightManager.updateHighlight(chart.id, series.getNodeData()[0]);
            await waitForChartStability(chart);
            return { proxy, options, series };
        };

        it('follows a drawing mode change while the same item stays hovered', async () => {
            const { proxy, options, series } = await createHovered('cutout');
            expect(casts(shapesOf(series.contentGroup, testCase.kind)[0])).toBe(false);

            await proxy.update({ ...options, highlight: { drawingMode: 'overlay' } } as AgChartOptions);
            await waitForChartStability(chart);

            // Overlay mode leaves the hovered item's in-place copy casting, and the highlight copy casts none.
            for (const shape of shapesOf(series.contentGroup, testCase.kind)) {
                expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);
            }
            for (const shape of shapesOf(series.highlightNodeGroup, testCase.kind).filter((s) => s.visible)) {
                expect(casts(shape)).toBe(false);
            }
        });

        it('keeps casting one shadow for the hovered item after a data update', async () => {
            const { proxy, options, series } = await createHovered('cutout');

            const data = testCase.data.map((datum: any) => ({ ...datum, x: datum.x + 0.1 }));
            await proxy.update({ ...options, data } as AgChartOptions);
            await waitForChartStability(chart);

            const inPlace = shapesOf(series.contentGroup, testCase.kind);
            const highlighted = shapesOf(series.highlightNodeGroup, testCase.kind).filter((s) => s.visible);
            // Whether or not the hover survives the update, each item casts exactly one shadow, never two or none.
            const hovered = chart.ctx.highlightManager.getActiveHighlight() != null;
            expect(inPlace.filter(casts).length + highlighted.filter(casts).length).toBe(inPlace.length);
            if (hovered) {
                expect(highlighted).toHaveLength(1);
                expect(casts(highlighted[0])).toBe(true);
                expect(casts(inPlace[0])).toBe(false);
            }
        });
    });

    describe('highlightedSeries', () => {
        it('does not accept shadow', () => {
            const options: AgCartesianChartOptions = {
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'y',
                        highlight: {
                            highlightedItem: { shadow: HIGHLIGHT_SHADOW },
                            // @ts-expect-error highlightedSeries has no `shadow`
                            highlightedSeries: { shadow: HIGHLIGHT_SHADOW },
                        },
                    },
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        highlight: {
                            highlightedItem: { shadow: HIGHLIGHT_SHADOW },
                            // @ts-expect-error highlightedSeries has no `shadow`
                            highlightedSeries: { shadow: HIGHLIGHT_SHADOW },
                        },
                    },
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        highlight: {
                            highlightedItem: { shadow: HIGHLIGHT_SHADOW },
                            // @ts-expect-error highlightedSeries has no `shadow`
                            highlightedSeries: { shadow: HIGHLIGHT_SHADOW },
                        },
                    },
                ],
            };
            expect(options.series).toHaveLength(3);
        });

        it('does not shadow a series highlight', async () => {
            const options: AgCartesianChartOptions = {
                data: XY_DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        shadow: SERIES_SHADOW,
                        // @ts-expect-error highlightedSeries has no `shadow`
                        highlight: { highlightedSeries: { shadow: HIGHLIGHT_SHADOW } },
                    },
                ],
            };
            prepareTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const [series] = chart.series;
            expectWarningMessages([
                'AG Charts - Unknown option `series[0].highlight.highlightedSeries.shadow`, ignoring.',
            ]);
            expect(series.options.highlight?.highlightedSeries?.shadow).toBeUndefined();
            for (const marker of shapesOf(series.contentGroup, Marker)) {
                expect(marker.fillShadow).toMatchObject(SERIES_SHADOW);
            }
        });
    });
});
