import { afterEach, describe, expect, it } from 'vitest';

import { Transformable } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { Chart } from '../chart';
import { Marker } from '../marker/marker';
import { getSeriesAt, getSeriesNodeData } from '../test/seriesAccessors';
import { XY_DATA, shapesOf } from '../test/shadowFixtures';
import {
    MIN_UNHIGHLIGHT_DELAY,
    createChart,
    delay,
    deproxy,
    expectWarningMessages,
    focusIndicatorContainsCanvasPoint,
    hoverAction,
    hoverLegendItem,
    setupMockCanvas,
    setupMockConsole,
    tabIntoChart,
    waitForChartStability,
} from '../test/utils';

const BUCKETS = ['highlightedItem', 'unhighlightedItem', 'highlightedSeries', 'unhighlightedSeries'] as const;
type Bucket = (typeof BUCKETS)[number];

const BASE_SIZE = 12;
const SIZES: Record<Bucket, number> = {
    highlightedItem: 30,
    unhighlightedItem: 6,
    highlightedSeries: 22,
    unhighlightedSeries: 4,
};

const DATA = XY_DATA.map((datum, i) => ({ ...datum, w: i + 2 }));

interface SeriesCase {
    name: string;
    series: (yKey: 'y' | 'w', highlight: object, styler?: () => { size: number }) => object;
}

const SERIES: SeriesCase[] = [
    {
        name: 'line',
        series: (yKey, highlight, styler) => ({
            type: 'line',
            xKey: 'x',
            yKey,
            marker: { enabled: true, size: BASE_SIZE, itemStyler: styler },
            highlight,
        }),
    },
    {
        name: 'area',
        series: (yKey, highlight, styler) => ({
            type: 'area',
            xKey: 'x',
            yKey,
            marker: { enabled: true, size: BASE_SIZE, itemStyler: styler },
            highlight,
        }),
    },
    {
        name: 'scatter',
        series: (yKey, highlight, styler) => ({
            type: 'scatter',
            xKey: 'x',
            yKey,
            size: BASE_SIZE,
            itemStyler: styler,
            highlight,
        }),
    },
    {
        name: 'bubble',
        series: (yKey, highlight, styler) => ({
            type: 'bubble',
            xKey: 'x',
            yKey,
            sizeKey: 'size',
            minSize: BASE_SIZE,
            maxSize: BASE_SIZE,
            itemStyler: styler,
            highlight,
        }),
    },
];

const BUBBLE_SIZED = (highlight: object, extra: object = {}) => ({
    type: 'bubble',
    xKey: 'x',
    yKey: 'y',
    sizeKey: 'size',
    minSize: 8,
    maxSize: 24,
    highlight,
    ...extra,
});

describe('highlight marker size', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => chart?.destroy());

    const create = async (series: object[], extra: object = {}) => {
        chart = deproxy(
            await createChart({
                data: DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                series,
                ...extra,
            } as AgChartOptions)
        );
    };

    const hoverDatum = async (seriesIndex: number, datumIndex: number) => {
        const marker = shapesOf(getSeriesAt(chart, seriesIndex).contentGroup, Marker)[datumIndex];
        const { x, y } = Transformable.toCanvas(marker).computeCenter();
        await hoverAction(x, y)(chart);
        await waitForChartStability(chart);
    };

    const endHover = async () => {
        await hoverAction(2, 2)(chart);
        await delay(MIN_UNHIGHLIGHT_DELAY);
        await waitForChartStability(chart);
    };

    const inPlaceSizes = (seriesIndex: number) =>
        shapesOf(getSeriesAt(chart, seriesIndex).contentGroup, Marker).map((marker) => marker.size);

    const highlightedSizes = (seriesIndex: number) =>
        shapesOf(getSeriesAt(chart, seriesIndex).highlightNodeGroup, Marker)
            .filter((marker) => marker.visible)
            .map((marker) => marker.size);

    const allVisibleMarkers = () =>
        [0, 1].flatMap((i) => {
            const series = getSeriesAt(chart, i);
            return [...shapesOf(series.contentGroup, Marker), ...shapesOf(series.highlightNodeGroup, Marker)].filter(
                (marker) => marker.visible
            );
        });

    describe.each(SERIES)('$name', ({ series }) => {
        const twoSeries = (highlight: object, styler?: () => { size: number }) =>
            create([series('y', highlight, styler), series('w', highlight, styler)]);

        it.each(BUCKETS)('draws markers in the %s state at that size', async (bucket) => {
            await twoSeries({ [bucket]: { size: SIZES[bucket] } });
            await hoverDatum(0, 0);

            const size = SIZES[bucket];
            const base = BASE_SIZE;
            const expected = {
                highlightedItem: { hovered: [size], others: [base, base], otherSeries: [base, base, base] },
                unhighlightedItem: { hovered: [base], others: [size, size], otherSeries: [base, base, base] },
                highlightedSeries: { hovered: [size], others: [size, size], otherSeries: [base, base, base] },
                unhighlightedSeries: { hovered: [base], others: [base, base], otherSeries: [size, size, size] },
            }[bucket];

            expect({
                hovered: highlightedSizes(0),
                others: inPlaceSizes(0).slice(1),
                otherSeries: inPlaceSizes(1),
            }).toEqual(expected);
        });

        it('restores the configured size when the highlight ends', async () => {
            await twoSeries(Object.fromEntries(BUCKETS.map((bucket) => [bucket, { size: SIZES[bucket] }])));
            await hoverDatum(0, 0);
            expect(inPlaceSizes(1)).toEqual([
                SIZES.unhighlightedSeries,
                SIZES.unhighlightedSeries,
                SIZES.unhighlightedSeries,
            ]);

            await endHover();

            expect(inPlaceSizes(0)).toEqual([BASE_SIZE, BASE_SIZE, BASE_SIZE]);
            expect(inPlaceSizes(1)).toEqual([BASE_SIZE, BASE_SIZE, BASE_SIZE]);
        });

        it('leaves sizes unchanged during a highlight that sets no size', async () => {
            await twoSeries({ highlightedItem: { fill: 'orange' }, unhighlightedSeries: { opacity: 0.5 } });
            await hoverDatum(0, 0);

            expect(inPlaceSizes(0)).toEqual([BASE_SIZE, BASE_SIZE, BASE_SIZE]);
            expect(inPlaceSizes(1)).toEqual([BASE_SIZE, BASE_SIZE, BASE_SIZE]);
            expect(highlightedSizes(0)).toEqual([BASE_SIZE]);
        });

        it('lets the itemStyler size beat every highlight size', async () => {
            const styled = 25;
            await twoSeries(Object.fromEntries(BUCKETS.map((bucket) => [bucket, { size: SIZES[bucket] }])), () => ({
                size: styled,
            }));
            await hoverDatum(0, 0);

            expect(highlightedSizes(0)).toEqual([styled]);
            expect(inPlaceSizes(0)).toEqual([styled, styled, styled]);
            expect(inPlaceSizes(1)).toEqual([styled, styled, styled]);
        });

        it('cascades highlightedSeries.size to the items, and lets highlightedItem.size win', async () => {
            await twoSeries({ highlightedSeries: { size: SIZES.highlightedSeries } });
            await hoverDatum(0, 0);
            expect(highlightedSizes(0)).toEqual([SIZES.highlightedSeries]);
            expect(inPlaceSizes(0).slice(1)).toEqual([SIZES.highlightedSeries, SIZES.highlightedSeries]);
            await endHover();
            chart.destroy();

            await twoSeries({
                highlightedSeries: { size: SIZES.highlightedSeries },
                highlightedItem: { size: SIZES.highlightedItem },
            });
            await hoverDatum(0, 0);
            expect(highlightedSizes(0)).toEqual([SIZES.highlightedItem]);
            expect(inPlaceSizes(0).slice(1)).toEqual([SIZES.highlightedSeries, SIZES.highlightedSeries]);
        });

        it('sizes the series states when the legend item is hovered', async () => {
            await create(
                [
                    series('y', { highlightedSeries: { size: SIZES.highlightedSeries } }),
                    series('w', { unhighlightedSeries: { size: SIZES.unhighlightedSeries } }),
                ],
                { legend: { enabled: true } }
            );
            await hoverLegendItem(chart, 0);

            expect(inPlaceSizes(0)).toEqual([
                SIZES.highlightedSeries,
                SIZES.highlightedSeries,
                SIZES.highlightedSeries,
            ]);
            expect(inPlaceSizes(1)).toEqual([
                SIZES.unhighlightedSeries,
                SIZES.unhighlightedSeries,
                SIZES.unhighlightedSeries,
            ]);
        });
    });

    describe.each(SERIES.slice(0, 2))('$name with markers disabled', ({ series }) => {
        it('draws no markers in any highlight state', async () => {
            const disabled = (yKey: 'y' | 'w') => {
                const options = series(yKey, {
                    highlightedItem: { size: SIZES.highlightedItem },
                    unhighlightedItem: { size: SIZES.unhighlightedItem },
                    highlightedSeries: { size: SIZES.highlightedSeries },
                    unhighlightedSeries: { size: SIZES.unhighlightedSeries },
                }) as { marker: object };
                return { ...options, marker: { ...options.marker, enabled: false } };
            };
            await create([disabled('y'), disabled('w')]);
            expect(allVisibleMarkers()).toHaveLength(0);

            // A markerless series has no node to point at, so the highlight is raised for its datum directly.
            chart.ctx.highlightManager.updateHighlight(chart.id, getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
            await waitForChartStability(chart);

            expect(allVisibleMarkers()).toHaveLength(0);
        });
    });

    describe('bubble with sizeKey and no itemStyler', () => {
        const dataDriven = async () => {
            await create([BUBBLE_SIZED({})]);
            return inPlaceSizes(0);
        };

        it('keeps the data-driven sizes during a highlight that sets no size', async () => {
            const baseline = await dataDriven();
            expect(new Set(baseline).size).toBe(3);
            chart.destroy();

            await create([BUBBLE_SIZED({ highlightedItem: { fill: 'orange' } })]);
            await hoverDatum(0, 1);

            expect(inPlaceSizes(0)).toEqual(baseline);
            expect(highlightedSizes(0)).toEqual([baseline[1]]);
        });

        it('replaces the data-driven size with the highlight size of each state', async () => {
            const baseline = await dataDriven();
            chart.destroy();

            await create([
                BUBBLE_SIZED({
                    highlightedItem: { size: SIZES.highlightedItem },
                    unhighlightedItem: { size: SIZES.unhighlightedItem },
                }),
            ]);
            await hoverDatum(0, 1);

            expect(highlightedSizes(0)).toEqual([SIZES.highlightedItem]);
            expect(inPlaceSizes(0)[0]).toBe(SIZES.unhighlightedItem);
            expect(inPlaceSizes(0)[2]).toBe(SIZES.unhighlightedItem);
            expect(baseline[0]).not.toBe(SIZES.unhighlightedItem);

            await endHover();
            expect(inPlaceSizes(0)).toEqual(baseline);
        });
    });

    describe('keyboard focus indicator', () => {
        const FOCUSED_SIZE = 60;

        describe.each(SERIES.slice(2))('$name', ({ series }) => {
            it.each([
                ['follows highlightedItem.size', { highlightedItem: { size: FOCUSED_SIZE } }, true],
                ['keeps the marker size without it', {}, false],
            ])('%s', async (_name, highlight, reachesOutside) => {
                await create([series('y', highlight)]);
                await tabIntoChart(chart);

                const centre = Transformable.toCanvas(
                    shapesOf(getSeriesAt(chart).contentGroup, Marker)[0]
                ).computeCenter();
                const outside = { canvasX: centre.x + FOCUSED_SIZE / 2 - 4, canvasY: centre.y };

                expect(focusIndicatorContainsCanvasPoint(chart, { canvasX: centre.x, canvasY: centre.y })).toBe(true);
                expect(focusIndicatorContainsCanvasPoint(chart, outside)).toBe(reachesOutside);
            });
        });
    });

    describe('theme overrides', () => {
        it('applies a highlight size set in the theme without warnings', async () => {
            await create([SERIES[0].series('y', {})], {
                theme: {
                    overrides: {
                        line: { series: { highlight: { highlightedItem: { size: SIZES.highlightedItem } } } },
                    },
                },
            });
            await hoverDatum(0, 0);

            expect(highlightedSizes(0)).toEqual([SIZES.highlightedItem]);
        });
    });

    describe('validation', () => {
        it('still rejects the size of a selected item', async () => {
            await create([
                {
                    type: 'scatter',
                    xKey: 'x',
                    yKey: 'y',
                    selection: { enabled: true, selectedItem: { size: 20 } },
                },
            ]);

            expectWarningMessages(['AG Charts - Unknown option `series[0].selection.selectedItem.size`, ignoring.']);
        });

        it('still rejects a highlight size on a series without markers', async () => {
            await create([
                {
                    type: 'bar',
                    xKey: 'x',
                    yKey: 'y',
                    highlight: { highlightedItem: { size: 20 } },
                },
            ]);

            expectWarningMessages(['AG Charts - Unknown option `series[0].highlight.highlightedItem.size`, ignoring.']);
        });
    });
});
