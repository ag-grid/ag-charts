import type { AgChartOptions, AgGlowOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { Chart } from '../chart';
import { getSeriesNodeData } from './seriesAccessors';
import { legendHighlight } from './shadowFixtures';
import { type ChartOrProxy, deproxy, waitForChartStability } from './utils';

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
