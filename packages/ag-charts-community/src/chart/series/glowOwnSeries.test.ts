import { afterEach, describe, expect, it } from 'vitest';

import { Sector, Transformable } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { Chart } from '../chart';
import { Marker } from '../marker/marker';
import { getSeriesAt, getSeriesNodeData } from '../test/seriesAccessors';
import { shapesOf } from '../test/shadowFixtures';
import {
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    chartPixelAt,
    countChartPixels,
    createChart,
    deproxy,
    hoverLegendItem,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import type { DonutSeries } from './polar/donutSeries';

const DATA = Array.from({ length: 30 }, (_, i) => ({ x: `P${i}`, y: 5 }));

const STROKE = [255, 0, 0, 255];
const GREEN = [0, 255, 0, 255];
const GLOW = { enabled: true, fill: '#00ff00', fillOpacity: 1, spread: 14, blur: 0 };

/** A series whose line and area fill are opaque, with a `marker.glow` for its other items when one is hovered. */
const series = (type: 'line' | 'area', glow: object | undefined) => ({
    type,
    xKey: 'x',
    yKey: 'y',
    stroke: '#ff0000',
    strokeWidth: 8,
    ...(type === 'area' ? { fill: '#ff0000', fillOpacity: 1 } : undefined),
    marker: { enabled: true, size: 16 },
    highlight: { unhighlightedItem: { opacity: 1, strokeOpacity: 1, glow } },
});

describe('a highlight glow of the markers of a series', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
    });

    /** The pixels between two markers that are not hovered, on the line and in the area fill beneath it. */
    const hover = async (type: 'line' | 'area', glow: object | undefined) => {
        chart = deproxy(
            await createChart({
                data: DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
                series: [series(type, glow)],
            } as AgChartOptions)
        );
        await waitForChartStability(chart);
        chart.ctx.highlightManager.updateHighlight(chart.id, getSeriesNodeData<HighlightNodeDatum>(chart)[0]);
        await waitForChartStability(chart);

        const [a, b] = shapesOf(getSeriesAt(chart).contentGroup, Marker).slice(14, 16);
        const from = Transformable.toCanvas(a).computeCenter();
        const to = Transformable.toCanvas(b).computeCenter();
        const x = Math.round((from.x + to.x) / 2);
        return {
            line: chartPixelAt(chart, x, from.y),
            fill: chartPixelAt(chart, x, from.y + 14),
            beside: chartPixelAt(chart, x, from.y - 14),
        };
    };

    // A marker with a shadow is a caster of the root, and its glow must still reach the group that casts it.
    it.each(['overlay', 'cutout'] as const)(
        'casts the glow of a marker that also casts a shadow (%s)',
        async (mode) => {
            chart = deproxy(
                await createChart({
                    data: DATA,
                    animation: { enabled: false },
                    legend: { enabled: true, position: 'bottom' },
                    ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
                    highlight: { ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP.highlight, drawingMode: mode },
                    series: [
                        {
                            ...series('line', undefined),
                            marker: {
                                enabled: true,
                                size: 16,
                                shadow: { enabled: true, xOffset: 2, yOffset: 2, blur: 2 },
                            },
                            highlight: { highlightedSeries: { glow: GLOW } },
                        },
                    ],
                } as AgChartOptions)
            );
            await waitForChartStability(chart);
            await hoverLegendItem(chart, 0);
            await waitForChartStability(chart);

            expect(countChartPixels(chart, GREEN)).toBeGreaterThan(0);
        }
    );

    // The glow is cast in the overlay above the series, so it covers the line and the fill, which do not glow, as the glow
    // of a hovered marker does. Only the footprint of a marker, which glows, is cut out of it.
    it.each(['line', 'area'] as const)('covers the line and the fill of its own series (%s)', async (type) => {
        const without = await hover(type, undefined);
        chart.destroy();
        const withGlow = await hover(type, GLOW);

        expect(without.line).toEqual(STROKE);
        expect(withGlow.beside).toEqual(GREEN);
        expect(withGlow.line).toEqual(GREEN);
        if (type === 'area') expect(withGlow.fill).toEqual(GREEN);
    });
});

describe('a highlight glow of the sectors of a donut', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
    });

    /**
     * The pixel a little inside the inner edge of the ring, where the glow of its sectors would reach over the inner circle,
     * and the pixel a little outside the ring at the middle of a sector that is not hovered, where the glow shows.
     */
    const hoverRing = async (glow: object | undefined) => {
        chart = deproxy(
            await createChart({
                data: [
                    { asset: 'Stocks', amount: 30 },
                    { asset: 'Bonds', amount: 25 },
                    { asset: 'Cash', amount: 20 },
                ],
                animation: { enabled: false },
                legend: { enabled: true, position: 'bottom' },
                ...SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
                series: [
                    {
                        type: 'donut',
                        angleKey: 'amount',
                        legendItemKey: 'asset',
                        innerRadiusRatio: 0.6,
                        innerCircle: { fill: '#ff0000', fillOpacity: 1 },
                        highlight: { unhighlightedItem: { opacity: 1, glow } },
                    },
                ],
            } as AgChartOptions)
        );
        await waitForChartStability(chart);
        await hoverLegendItem(chart, 0);
        await waitForChartStability(chart);

        const donut = getSeriesAt(chart) as DonutSeries;
        const centre = Transformable.toCanvas(donut.innerCircleSelection.nodes()[0]).computeCenter();
        const { innerRadius } = shapesOf(donut.contentGroup, Sector)[1];
        const { startAngle, endAngle, outerRadius } = shapesOf(donut.contentGroup, Sector)[1];
        const middle = (startAngle + endAngle) / 2;
        return {
            inner: chartPixelAt(chart, centre.x, centre.y - innerRadius + 6),
            outside: chartPixelAt(
                chart,
                centre.x + (outerRadius + 6) * Math.cos(middle),
                centre.y + (outerRadius + 6) * Math.sin(middle)
            ),
        };
    };

    // The inner circle lies beneath the glow overlay, and only labels and error bars cut a series' own glow.
    it('covers the inner circle of its own series, and shows beside the ring', async () => {
        const without = await hoverRing(undefined);
        chart.destroy();
        const withGlow = await hoverRing(GLOW);

        expect(without.inner).toEqual(STROKE);
        expect(withGlow.inner).toEqual(GREEN);
        expect(without.outside).not.toEqual(GREEN);
        expect(withGlow.outside).toEqual(GREEN);
    });
});

describe('the labels of a series with a glow', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
    });

    const LABELS = [STROKE, [255, 0, 255, 255]];

    /** Two grouped bars with a label above each, and a glow on one of them that reaches over both labels. */
    const labelled = (glowing: 0 | 1 | undefined, labels = true): AgChartOptions => ({
        // Narrow bars, so that the glow of one reaches over the label of the bar beside it.
        data: ['A', 'B', 'C', 'D'].map((x) => ({ x, a: 6, b: 6 })),
        animation: { enabled: false },
        legend: { enabled: false },
        axes: { y: { type: 'number', min: 0, max: 10 } },
        series: ['a', 'b'].map((yKey, index) => ({
            type: 'bar',
            xKey: 'x',
            yKey,
            fill: '#0000ff',
            fillOpacity: 1,
            glow: index === glowing ? { ...GLOW, spread: 80 } : undefined,
            label: {
                enabled: labels,
                placement: 'outside-end',
                color: index === 0 ? '#ff0000' : '#ff00ff',
                fontSize: 20,
            },
        })),
    });

    const labelPixels = async (glowing: 0 | 1 | undefined) => {
        chart = deproxy(await createChart(labelled(glowing)));
        const counts = LABELS.map((colour) => countChartPixels(chart, colour));
        chart.destroy();
        return counts;
    };

    it.each([0, 1] as const)(
        'are covered by the glow of the series beside them alone, with series %s glowing',
        async (glowing) => {
            const bare = await labelPixels(undefined);
            const glowed = await labelPixels(glowing);

            expect(bare.every((count) => count > 0)).toBe(true);
            expect(glowed[glowing]).toBe(bare[glowing]);
            expect(glowed[1 - glowing]).toBeLessThan(bare[1 - glowing]);
        }
    );

    it('give the glow back where they were, once they are hidden', async () => {
        chart = deproxy(await createChart(labelled(0, false)));
        const unlabelled = countChartPixels(chart, GREEN);
        chart.destroy();

        const instance = await createChart(labelled(0));
        chart = deproxy(instance);
        const labelledGlow = countChartPixels(chart, GREEN);
        await instance.update(prepareTestOptions(labelled(0, false)));
        await waitForChartStability(chart);

        expect(labelledGlow).toBeLessThan(unlabelled);
        expect(countChartPixels(chart, GREEN)).toBe(unlabelled);
    });
});

describe('the glow of the middle of three donut rings', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
    });

    it('covers the rings inside and outside it alike, whatever their order', async () => {
        const RINGS: [number, number, string][] = [
            [1, 0.8, '#ff0000'],
            [0.8, 0.6, '#808080'],
            [0.6, 0.4, '#0000ff'],
        ];
        chart = deproxy(
            await createChart({
                data: [{ value: 1 }],
                animation: { enabled: false },
                legend: { enabled: false },
                series: RINGS.map(([outerRadiusRatio, innerRadiusRatio, fill], index) => ({
                    type: 'donut',
                    angleKey: 'value',
                    outerRadiusRatio,
                    innerRadiusRatio,
                    fills: [fill],
                    strokeWidth: 0,
                    glow: index === 1 ? { ...GLOW, spread: 10 } : undefined,
                })),
            } as AgChartOptions)
        );

        const [outer, , inner] = [0, 1, 2].map((index) => shapesOf(getSeriesAt(chart, index).contentGroup, Sector)[0]);
        const centre = Transformable.toCanvas(outer).computeCenter();
        // 5px into each ring from the edge it shares with the glowing ring, at the top.
        expect(chartPixelAt(chart, centre.x, centre.y - outer.innerRadius - 5)).toEqual(GREEN);
        expect(chartPixelAt(chart, centre.x, centre.y - inner.outerRadius + 5)).toEqual(GREEN);
        expect(chartPixelAt(chart, centre.x, centre.y - outer.innerRadius - 15)).toEqual(STROKE);
        expect(chartPixelAt(chart, centre.x, centre.y - inner.outerRadius + 15)).toEqual([0, 0, 255, 255]);
    });
});
