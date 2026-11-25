import { expect } from 'vitest';

import { Transformable } from 'ag-charts-core';
import type { Node } from 'ag-charts-core';
import type { AgChartOptions, AgGlowOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { Chart } from '../chart';
import { getSeriesNodeData, getSeriesSelectionNodes } from './seriesAccessors';
import { legendHighlight } from './shadowFixtures';
import { type ChartOrProxy, chartPixelAt, countChartPixels, deproxy, waitForChartStability } from './utils';

/** An opaque, unblurred glow, so that the shape of the cast can be read off the render. */
export const HARD_GLOW: AgGlowOptions = { enabled: true, fillOpacity: 1, blur: 0 };

/** {@link HARD_GLOW} as a band 16px wide that starts 24px clear of the item. */
export const HARD_GAP_GLOW: AgGlowOptions = { ...HARD_GLOW, gap: 24, spread: 16 };

/** The colours of the labels or error bars of the two series of {@link besideBars}. */
export const BESIDE_COLOURS = [
    [255, 0, 0, 255],
    [255, 0, 255, 255],
];

/** The green of the glow of {@link besideBars}. */
export const BESIDE_GLOW = [0, 255, 0, 255];

/**
 * Two series of narrow bars, with labels or error bars above them, in which the glow of series `glowing` reaches over
 * those of the series beside it. Error bars need the enterprise module.
 */
export function besideBars(glowing: 0 | 1 | undefined, part: 'label' | 'errorBar', shown = true): AgChartOptions {
    return {
        data: ['A', 'B', 'C', 'D'].map((x) => ({ x, a: 5, aLo: 4, aHi: 8, b: 5, bLo: 4, bHi: 8 })),
        animation: { enabled: false },
        legend: { enabled: false },
        axes: { y: { type: 'number', min: 0, max: 10 } },
        series: ['a', 'b'].map((yKey, index) => {
            const color = index === 0 ? '#ff0000' : '#ff00ff';
            return {
                type: 'bar',
                xKey: 'x',
                yKey,
                fill: '#0000ff',
                fillOpacity: 1,
                glow: index === glowing ? { ...HARD_GLOW, fill: '#00ff00', spread: 70 } : undefined,
                ...(part === 'label'
                    ? { label: { enabled: shown, placement: 'outside-end', color, fontSize: 20 } }
                    : {
                          errorBar: {
                              visible: shown,
                              yLowerKey: `${yKey}Lo`,
                              yUpperKey: `${yKey}Hi`,
                              stroke: color,
                              strokeWidth: 4,
                          },
                      }),
            };
        }),
    } as AgChartOptions;
}

/**
 * Expects the glow of series `glowing` of {@link besideBars} to leave the `part` of its own series whole, and to cover that of
 * the series beside it. `create` makes the chart, and the helper destroys it.
 */
export async function expectGlowCoversPartsBeside(
    glowing: 0 | 1,
    part: 'label' | 'errorBar',
    create: (options: AgChartOptions) => Promise<ChartOrProxy<any>>
) {
    const count = async (glowingSeries: 0 | 1 | undefined) => {
        const chart = deproxy(await create(besideBars(glowingSeries, part)));
        const counts = BESIDE_COLOURS.map((colour) => countChartPixels(chart, colour));
        chart.destroy();
        return counts;
    };
    const bare = await count(undefined);
    const glowed = await count(glowing);

    expect(bare.every((pixels) => pixels > 0)).toBe(true);
    expect(glowed[glowing]).toBe(bare[glowing]);
    expect(glowed[1 - glowing]).toBeLessThan(bare[1 - glowing]);
}

/** The width and height of the part of the canvas that a render test snapshots. */
const CROP_SIZE = { width: 420, height: 310 };

/** The room between the series area and each edge of {@link RENDER_CROP}, for a cast that reaches beyond the series area. */
const CROP_MARGIN = 30;

/** The chart a render test draws, in the top-left of the canvas, padded by {@link CROP_MARGIN} inside {@link RENDER_CROP}. */
export const RENDER_OPTIONS = {
    animation: { enabled: false },
    legend: { enabled: false },
    padding: {
        top: CROP_MARGIN,
        left: CROP_MARGIN,
        right: 800 - CROP_SIZE.width + CROP_MARGIN,
        bottom: 600 - CROP_SIZE.height + CROP_MARGIN,
    },
} satisfies Partial<AgChartOptions>;

/** A glow reaches 40px beyond an item, so the chart sits 60px inside the crop on three sides, and has room beneath. */
export const ROOM = { ...RENDER_OPTIONS, padding: { top: 60, left: 60, right: 440, bottom: 350 } };

/** The part of the canvas that {@link RENDER_OPTIONS} draws the chart in. */
export const RENDER_CROP = { x: 0, y: 0, ...CROP_SIZE };

/** The RGBA bytes of the canvas of a chart, as it is drawn now. */
export function canvasImage(chartOrProxy: ChartOrProxy<any>): { data: Uint8ClampedArray } {
    const { canvas } = deproxy(chartOrProxy).ctx.scene;
    const { data } = canvas.context.getImageData(0, 0, canvas.width, canvas.height);
    return { data: new Uint8ClampedArray(data) };
}

/** The strength of a red cast with no blur, read off its pixel over a white chart: the green channel is 255 * (1 - strength). */
export const strengthOfRed = (pixel: ArrayLike<number>) => 1 - pixel[1] / 255;

/** The strength that most of the red pixels with equal green and blue in RGBA `data` are cast at, as the edge of a cast is antialiased. */
export function dominantRedStrength(data: ArrayLike<number>) {
    const greens = new Map<number, number>();
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] === 255 && data[i + 1] === data[i + 2] && data[i + 1] < 255) {
            greens.set(data[i + 1], (greens.get(data[i + 1]) ?? 0) + 1);
        }
    }
    const [[green]] = [...greens].sort(([, a], [, b]) => b - a);
    return strengthOfRed([255, green, green]);
}

/**
 * The pixels `distances` from the edge of `box`, taken as a circle, at each of `angles` (degrees, anticlockwise from the right).
 * A negative distance is inside the edge.
 */
export function pixelsAroundCircle(
    chartOrProxy: ChartOrProxy<any>,
    { x, y, width, height }: { x: number; y: number; width: number; height: number },
    distances: number[],
    angles: number[]
): number[][] {
    const [centreX, centreY, radius] = [x + width / 2, y + height / 2, width / 2];
    return distances.flatMap((d) =>
        angles.map((angle) => {
            const radians = (angle * Math.PI) / 180;
            return chartPixelAt(
                chartOrProxy,
                centreX + (radius + d) * Math.cos(radians),
                centreY - (radius + d) * Math.sin(radians)
            );
        })
    );
}

/** RGBA pixels as the bytes that {@link expectSamePixels} compares. */
export const bytesOf = (pixels: number[][]) => ({ data: pixels.flat() });

/** The visible items of the first datum selection of a chart, in canvas coordinates. */
export function visibleItems(chartOrProxy: ChartOrProxy<any>) {
    return getSeriesSelectionNodes<Node>(deproxy(chartOrProxy), 'datumSelection')
        .filter((n) => n.visible)
        .map((n) => Transformable.toCanvas(n));
}

/** Raises the highlight on a datum, as the pointer would. */
export async function hoverNode(chartOrProxy: ChartOrProxy<any>, datum: object | undefined) {
    const chart: Chart = deproxy(chartOrProxy);
    chart.ctx.highlightManager.updateHighlight(chart.id, datum as HighlightNodeDatum | undefined);
    await waitForChartStability(chart);
}

/** Raises the highlight on a datum of a series, as the pointer would. */
export function hoverDatum(chartOrProxy: ChartOrProxy<any>, seriesIndex = 0, datumIndex = 0) {
    return hoverNode(
        chartOrProxy,
        getSeriesNodeData<HighlightNodeDatum>(deproxy(chartOrProxy), seriesIndex)[datumIndex]
    );
}

/** Raises the highlight a hover of the first legend item of a series raises: the series as a whole, or one of its sectors. */
export function hoverSeries(chartOrProxy: ChartOrProxy<any>, seriesIndex = 0) {
    const chart: Chart = deproxy(chartOrProxy);
    return hoverNode(chart, legendHighlight(chart.series[seriesIndex]));
}

/** Ends the highlight, as the pointer leaving the item would. */
export async function endHover(chartOrProxy: ChartOrProxy<any>) {
    const chart: Chart = deproxy(chartOrProxy);
    chart.ctx.highlightManager.updateHighlight(chart.id);
    await waitForChartStability(chart);
}
