import type { AgChartOptions, AgGlowOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../core/eventsHub';
import type { Chart } from '../chart';
import { getSeriesNodeData } from './seriesAccessors';
import { type ChartOrProxy, deproxy, waitForChartStability } from './utils';

/**
 * The glow of the design feedback on the glow gap: opaque, with no blur, a gap of 24 and a spread of 16, so the glow is a
 * hard-edged band 16px wide that starts 24px clear of the item.
 */
export const ALI_GLOW: AgGlowOptions = { enabled: true, fillOpacity: 1, blur: 0, gap: 24, spread: 16 };

/** The width and height of the part of the canvas that a render test snapshots. */
const CROP_SIZE = { width: 420, height: 310 };

/**
 * The room kept between the series area and each edge of {@link RENDER_CROP}, the same on all four sides, for the shadow
 * or glow that an item casts beyond the series area. A shadow offset or a glow spread of up to this many pixels is not cut.
 */
const CROP_MARGIN = 30;

/**
 * The chart a render test draws, in the top-left of the 800 x 600 canvas, with {@link CROP_MARGIN} of padding inside the
 * edges of {@link RENDER_CROP} so that a snapshot of the crop is small and shows the whole of a cast.
 */
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

/** The part of the 800 x 600 canvas that {@link RENDER_OPTIONS} draws the chart in. */
export const RENDER_CROP = { x: 0, y: 0, ...CROP_SIZE };

/** The RGBA bytes of the canvas of a chart, as it is drawn now. */
export function canvasImage(chartOrProxy: ChartOrProxy<any>): { data: Uint8ClampedArray } {
    const { canvas } = deproxy(chartOrProxy).ctx.scene;
    const { data } = canvas.context.getImageData(0, 0, canvas.width, canvas.height);
    return { data: new Uint8ClampedArray(data) };
}

/** How many bytes of two renders differ. */
export function differingBytes(a: { data: ArrayLike<number> }, b: { data: ArrayLike<number> }) {
    let count = 0;
    for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) count++;
    return count;
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

/** Raises the highlight on a series as a whole, as a hover of its legend item would. */
export async function hoverSeries(chartOrProxy: ChartOrProxy<any>, seriesIndex = 0) {
    const chart: Chart = deproxy(chartOrProxy);
    const series = chart.series[seriesIndex];
    chart.ctx.highlightManager.updateHighlight(chart.id, {
        series,
        itemId: undefined,
        datum: undefined,
        datumIndex: Number.NaN,
    });
    await waitForChartStability(chart);
}

/** Ends the highlight, as the pointer leaving the item would. */
export async function endHover(chartOrProxy: ChartOrProxy<any>) {
    const chart: Chart = deproxy(chartOrProxy);
    chart.ctx.highlightManager.updateHighlight(chart.id);
    await waitForChartStability(chart);
}
