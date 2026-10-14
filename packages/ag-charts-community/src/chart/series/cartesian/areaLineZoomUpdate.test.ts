import { describe, expect, it } from 'vitest';

import { ChartAxisDirection } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgCartesianSeriesOptions } from 'ag-charts-types';

import { expectPixelIdenticalAcrossUpdate } from '../../test/bigintExamples';
import {
    createChart,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

/**
 * Area and line series reuse node, point and span objects between `createNodeData()` passes, which is what a
 * zoom or pan update runs on every step. A pass that starts from the state the previous one left behind must
 * produce what a chart created at that zoom would, so each case drives one chart through a zoom sequence and
 * checks it against fresh charts, against the data, and (for pixels) against its own starting render.
 */

type SeriesType = 'line' | 'area';

// Above AGGREGATION_THRESHOLD (1000), so the zoom updates run through the aggregated, incremental node path.
const COUNT = 5_000;
const MARKER_SIZE = 9;

// [min, max] of the x-axis after each step: zoom in, pan, return, zoom out to the full range, zoom in deeply.
const ZOOM_SEQUENCE: Array<[number, number]> = [
    [1_000, 2_000],
    [1_500, 2_500],
    [1_000, 2_000],
    [0, COUNT],
    [4_000, 4_100],
];

interface Variant {
    name: string;
    series?: Record<string, unknown>;
    /** A second series stacked on the first. */
    stackedPair?: boolean;
    data?: (i: number) => Record<string, number | null>;
}

const smooth = (i: number) => ({ x: i, y: 50 + Math.sin(i / 20) * 40 + (i % 7), y2: 20 + Math.cos(i / 33) * 10 });
// Isolated gaps, plus a run of gaps long enough to span several aggregation buckets at the zoomed-out levels.
const withGaps = (i: number) => ({ ...smooth(i), y: i % 97 === 0 || (i >= 2_000 && i < 2_012) ? null : smooth(i).y });

const VARIANTS: Variant[] = [
    { name: 'plain', series: {} },
    { name: 'markers and labels', series: { label: { enabled: true } } },
    { name: 'stacked', series: { stacked: true }, stackedPair: true },
    { name: 'normalised', series: { stacked: true, normalizedTo: 100 }, stackedPair: true },
    { name: 'missing values, gaps left open', series: { connectMissingData: false }, data: withGaps },
    { name: 'missing values, gaps connected', series: { connectMissingData: true }, data: withGaps },
];

function buildOptions(type: SeriesType, variant: Variant, range?: [number, number]): AgCartesianChartOptions {
    const base = { type, xKey: 'x', marker: { enabled: true, size: MARKER_SIZE }, ...variant.series };
    const series = [{ ...base, yKey: 'y' }];
    if (variant.stackedPair) series.push({ ...base, yKey: 'y2' });

    return {
        data: Array.from({ length: COUNT }, (_, i) => (variant.data ?? smooth)(i)),
        series: series as AgCartesianSeriesOptions[],
        axes: {
            x: { type: 'number', position: 'bottom', ...(range && { min: range[0], max: range[1] }) },
            y: { type: 'number', position: 'left' },
        },
        // Make the zoom steps updates of one chart rather than animated transitions between charts.
        animation: { enabled: false },
    };
}

const copy = (value: unknown, replacer?: (key: string, value: unknown) => unknown): any =>
    value === undefined ? undefined : JSON.parse(JSON.stringify(value, replacer));
const withoutSeries = (key: string, value: unknown) => (key === 'series' ? undefined : value);

/** Everything the renderer and hit-testing read from a series' latest node data, detached from live objects. */
function snapshotNodeData(series: any) {
    const { nodeData, strokeData, fillData } = series.contextNodeData;
    return {
        nodes: copy(nodeData, withoutSeries),
        stroke: copy(strokeData.spans),
        fill: fillData == null ? undefined : copy(fillData.spans),
    };
}

const snapshotChart = (chart: any) => chart.series.map(snapshotNodeData);

/** Checks the nodes and spans of a series against the datums they carry, using the series' own scales. */
function expectNodeDataOnDatums(series: any, where: string) {
    const { scale: xScale } = series.axes[ChartAxisDirection.X];
    const { scale: yScale } = series.axes[ChartAxisDirection.Y];
    const { nodeData, strokeData, fillData } = series.contextNodeData;

    expect(nodeData.length, where).toBeGreaterThan(0);
    for (const node of nodeData) {
        expect(node.point.x, where).toBeCloseTo(xScale.convert(node.xValue), 6);
        expect(node.point.y, where).toBeCloseTo(yScale.convert(node.cumulativeValue), 6);
        expect(node.point.size, where).toBe(MARKER_SIZE);
        expect(node.midPoint, where).toEqual({ x: node.point.x, y: node.point.y });
    }

    for (const spans of [strokeData.spans, fillData?.spans ?? []] as any[][]) {
        for (const { span, xValue0, yValue0, xValue1, yValue1 } of spans) {
            expect(span.x0, where).toBeCloseTo(xScale.convert(xValue0), 6);
            expect(span.y0, where).toBeCloseTo(yScale.convert(yValue0), 6);
            expect(span.x1, where).toBeCloseTo(xScale.convert(xValue1), 6);
            expect(span.y1, where).toBeCloseTo(yScale.convert(yValue1), 6);
            for (const mid of span.midPoints ?? []) {
                expect(mid.x, where).toBeGreaterThanOrEqual(span.x0);
                expect(mid.x, where).toBeLessThanOrEqual(span.x1);
            }
        }
        expectAdjacentSpansMeet(spans, where);
    }
}

/** A span that ends on the datum the next one starts from must meet it exactly. */
function expectAdjacentSpansMeet(spans: any[], where: string) {
    for (let i = 1; i < spans.length; i++) {
        const [prev, next] = [spans[i - 1], spans[i]];
        if (prev.xValue1 !== next.xValue0) continue;
        expect(prev.span.x1, `${where}, span ${i}`).toBe(next.span.x0);
        if (prev.yValue1 === next.yValue0) {
            expect(prev.span.y1, `${where}, span ${i}`).toBe(next.span.y0);
        }
    }
}

describe('area and line series zoom updates', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    const cases = (['line', 'area'] as const).flatMap((type) =>
        VARIANTS.map((variant) => [`${type}: ${variant.name}`, type, variant] as const)
    );

    // Updates `chart` to each range in turn, handing the chart back to `check` once it has settled.
    async function zoomThrough(
        type: SeriesType,
        variant: Variant,
        check: (chart: any, range: [number, number]) => Promise<void> | void
    ) {
        const chart = await createChart(buildOptions(type, variant));
        try {
            for (const range of ZOOM_SEQUENCE) {
                await chart.publicApi!.update(prepareTestOptions(buildOptions(type, variant, range)));
                await waitForChartStability(chart);
                await check(chart, range);
            }
        } finally {
            chart.destroy();
        }
    }

    describe('rendered output', () => {
        it.each(cases)('%s returns to its initial pixels after zooming and panning', async (_, type, variant) => {
            const initial = buildOptions(type, variant);
            const zoomed = ZOOM_SEQUENCE.map((range) => buildOptions(type, variant, range));
            await expectPixelIdenticalAcrossUpdate(ctx, createChart, initial, ...zoomed, initial);
        });
    });

    describe('node data', () => {
        it.each(cases)('%s matches a chart created at the same zoom', async (_, type, variant) => {
            await zoomThrough(type, variant, async (chart, range) => {
                const fresh = await createChart(buildOptions(type, variant, range));
                try {
                    expect(snapshotChart(chart), `zoom ${range}`).toEqual(snapshotChart(fresh));
                } finally {
                    fresh.destroy();
                }
            });
        });

        it.each(cases)('%s positions every node and span on the datum it carries', async (_, type, variant) => {
            await zoomThrough(type, variant, (chart, range) => {
                for (const series of chart.series as any[]) {
                    expectNodeDataOnDatums(series, `zoom ${range}`);
                }
            });
        });

        it.each(cases)('%s leaves the node data of an earlier update untouched', async (_, type, variant) => {
            const chart = await createChart(buildOptions(type, variant, ZOOM_SEQUENCE[0]));
            try {
                const [series] = chart.series as any[];
                const before = series.contextNodeData;
                const earlier = snapshotNodeData(series);
                const earlierSpans = [before.strokeData.spans, before.fillData?.spans];

                await chart.publicApi!.update(prepareTestOptions(buildOptions(type, variant, ZOOM_SEQUENCE[1])));
                await waitForChartStability(chart);

                // The earlier update's spans are what animation and path diffing compare the next one against.
                expect(copy(earlierSpans[0])).toEqual(earlier.stroke);
                expect(copy(earlierSpans[1])).toEqual(earlier.fill);
            } finally {
                chart.destroy();
            }
        });

        it.each(cases)(
            '%s does not carry a node focus size to the datum that takes its place',
            async (_, type, variant) => {
                const chart = await createChart(buildOptions(type, variant, ZOOM_SEQUENCE[0]));
                try {
                    const [series] = chart.series as any[];
                    // Keyboard focus enlarges the focused node's `point` in place (`applyFocusSize`).
                    for (const node of series.contextNodeData.nodeData.slice(0, 20)) {
                        node.point.focusSize = MARKER_SIZE * 3;
                    }

                    await chart.publicApi!.update(prepareTestOptions(buildOptions(type, variant, ZOOM_SEQUENCE[1])));
                    await waitForChartStability(chart);

                    const { nodeData } = series.contextNodeData;
                    expect(nodeData.length).toBeGreaterThan(20);
                    expect(nodeData.filter((node: any) => node.point.focusSize !== undefined)).toEqual([]);
                } finally {
                    chart.destroy();
                }
            }
        );
    });
});
