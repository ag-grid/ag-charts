import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    type AgCartesianChartOptions,
    type AgChartOptions,
    AgCharts,
    type AgHlcSeriesItemStylerParams,
    type AgHlcSeriesStyle,
    type AgHlcSeriesStylerParams,
    type AgSeriesMarkerStyle,
} from 'ag-charts-community';
import {
    BIG,
    HIGH_VOLUME_COUNT,
    HIGH_VOLUME_SIGNALS,
    IMAGE_SNAPSHOT_DEFAULTS,
    STRIPPED_NUMBER_AXES,
    compareImageSnapshot,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectMonotonic,
    expectPixelIdenticalAcrossMagnitude,
    expectProgresses,
    expectWarningsCalls,
    magnitudePair,
    scaleToBigIntFinite,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    waitForChartStability,
} from 'ag-charts-community-test';
import { AGGREGATION_INDEX_X_MAX, AGGREGATION_SPAN } from 'ag-charts-core';

import { createEnterpriseChart, prepareEnterpriseTestOptions, renderEnterpriseChartImage } from '../../test/utils';

type Datum = { date: Date; high: number; low: number; close: number };

const DATA: Datum[] = [
    [110, 102, 108],
    [112, 105, 106],
    [109, 101, 103],
    [111, 103, 110],
    [116, 108, 115],
    [118, 111, 112],
    [114, 107, 109],
    [113, 104, 111],
    [117, 109, 116],
    [121, 113, 119],
].map(([high, low, close], i) => ({ date: new Date(2024, 0, i + 1), high, low, close }));

const HLC_OPTIONS: AgCartesianChartOptions = {
    data: DATA,
    series: [{ type: 'hlc', xKey: 'date', highKey: 'high', lowKey: 'low', closeKey: 'close' }],
};

describe('HlcSeries', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: any;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const compare = async () => {
        await waitForChartStability(chart);
        await compareImageSnapshot(chart, ctx, { ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    const createChart = async (options: AgChartOptions) => {
        chart = AgCharts.create(prepareEnterpriseTestOptions(options));
        await waitForChartStability(chart);
        return deproxy(chart).series[0] as any;
    };

    const withSeries = (overrides: object): AgCartesianChartOptions => ({
        ...HLC_OPTIONS,
        series: [{ ...HLC_OPTIONS.series![0], ...overrides } as any],
    });

    describe('rendering', () => {
        it('renders two bands and a close line with the default ordinal-time axis', async () => {
            await createChart(HLC_OPTIONS);
            await compare();
        });

        it('renders with a unit-time x-axis', async () => {
            await createChart({ ...HLC_OPTIONS, axes: { x: { type: 'unit-time' }, y: { type: 'number' } } });
            await compare();
        });

        it('renders with reversed axes', async () => {
            await createChart({
                ...HLC_OPTIONS,
                axes: { x: { type: 'ordinal-time', reverse: true }, y: { type: 'number', reverse: true } },
            });
            await compare();
        });

        it('takes the up and down palette colours for the bands and a neutral close line', async () => {
            await createChart({
                ...HLC_OPTIONS,
                theme: {
                    palette: {
                        up: { fill: '#57b757', stroke: '#3d803d' },
                        down: { fill: '#f3622d', stroke: '#aa4520' },
                    },
                },
            });
            await compare();
        });

        it('renders with markers enabled', async () => {
            await createChart(withSeries({ marker: { enabled: true } }));
            await compare();
        });

        it.each(['xKey', 'highKey', 'lowKey', 'closeKey'])('reports a missing %s', async (key) => {
            const series: Record<string, unknown> = { ...HLC_OPTIONS.series![0] };
            delete series[key];
            await createChart({ ...HLC_OPTIONS, series: [series as any] });
            expectWarningsCalls().toEqual([
                [
                    `AG Charts - Option \`series[0].${key}\` is required and has not been provided; expecting a string, ignoring.`,
                ],
            ]);
        });
    });

    describe('legend', () => {
        it('has a single entry for the series', async () => {
            const series = await createChart(withSeries({ yName: 'S&P 500' }));
            const legendData = series.getLegendData('category');
            expect(legendData).toHaveLength(1);
            expect(legendData[0].label.text).toBe('S&P 500');
        });

        it('hides both bands, every stroke and the markers when the series is hidden', async () => {
            await createChart(withSeries({ marker: { enabled: true }, visible: false }));
            await compare();
        });
    });

    describe('tooltip', () => {
        it('shows the high, low and close values of a datum together', async () => {
            const series = await createChart(
                withSeries({ highName: 'High', lowName: 'Low', closeName: 'Close', marker: { enabled: true } })
            );
            const content = series.getTooltipContent(1, undefined);
            expect(content?.type).toBe('structured');
            expect(content.data.map(({ label, value }: any) => [label, value])).toEqual([
                ['High', '112'],
                ['Low', '105'],
                ['Close', '106'],
            ]);
        });

        it('passes the hovered item type to the renderer', async () => {
            const renderer = vi.fn(() => undefined);
            const series = await createChart(withSeries({ marker: { enabled: true }, tooltip: { renderer } }));
            const highNode = series.getNodeData().find((d: any) => d.datumIndex === 2 && d.itemType === 'high');
            series.getTooltipContent(2, highNode);
            series.getTooltipContent(2, undefined);
            expect(renderer.mock.calls.map(([params]: any[]) => params.itemType)).toEqual(['high', 'close']);
        });
    });

    describe('highlight and selection', () => {
        it('highlights all three values of the hovered datum', async () => {
            const series = await createChart(withSeries({ marker: { enabled: true } }));
            const nodeData = series.getNodeData();
            const highlighted = series.getHighlightData(nodeData, nodeData[3]);
            expect(highlighted.map((d: any) => d.itemType)).toEqual(['high', 'low', 'close']);
            expect(new Set(highlighted.map((d: any) => d.datumIndex))).toEqual(new Set([1]));
        });

        it('selects datums, not values', async () => {
            const series = await createChart({
                ...withSeries({ marker: { enabled: true } }),
                selection: { enabled: true },
            });
            const itemIds = [0, 2, 4].map((i) => series.data!.getItemIdFromIndex(i));
            chart.setSelection(itemIds.map((itemId: unknown) => ({ seriesId: series.id, itemId })));
            await waitForChartStability(chart);
            expect([...chart.getSelection()]).toHaveLength(3);
        });
    });

    describe('styling', () => {
        it('calls marker.itemStyler once per marker with its item type', async () => {
            const itemStyler = vi.fn((params: AgHlcSeriesItemStylerParams<Datum, unknown>): AgSeriesMarkerStyle => {
                switch (params.itemType) {
                    case 'high':
                        return { fill: 'lime', shape: 'triangle' };
                    case 'low':
                        return { fill: 'fuchsia', shape: 'square' };
                    case 'close':
                        return { fill: 'orange', size: 12 };
                }
            });
            await createChart(withSeries({ marker: { enabled: true, itemStyler } }));

            const itemTypes = itemStyler.mock.calls.map(([params]) => params.itemType);
            expect(itemTypes.filter((t) => t === 'high')).toHaveLength(DATA.length);
            expect(itemTypes.filter((t) => t === 'low')).toHaveLength(DATA.length);
            expect(itemTypes.filter((t) => t === 'close')).toHaveLength(DATA.length);
            expect(itemStyler.mock.calls.slice(0, 3)).toMatchSnapshot();
            await compare();
        });

        it('styles the bands and strokes from the item options', async () => {
            await createChart(
                withSeries({
                    item: {
                        high: { fill: 'lightgreen', fillOpacity: 0.6, stroke: 'green', lineDash: [4, 2] },
                        low: { fill: 'pink', fillOpacity: 0.6, stroke: 'red', strokeWidth: 4 },
                        close: { stroke: 'black', strokeWidth: 3 },
                    },
                })
            );
            await compare();
        });

        it('styles the bands and strokes from the series styler', async () => {
            const styler = vi.fn((_params: AgHlcSeriesStylerParams<Datum, unknown>): AgHlcSeriesStyle => ({
                item: {
                    high: { fill: 'gold', stroke: 'darkgoldenrod' },
                    low: { fill: 'skyblue', stroke: 'navy' },
                    close: { stroke: 'purple', strokeWidth: 4, marker: { fill: 'purple' } },
                },
            }));
            await createChart(withSeries({ styler, item: { close: { marker: { enabled: true } } } }));
            expect(styler.mock.calls[0]).toMatchSnapshot();
            await compare();
        });
    });

    describe('data edge cases', () => {
        it('breaks the bands and lines at missing values', async () => {
            await createChart({
                ...HLC_OPTIONS,
                data: DATA.map((d, i) => {
                    if (i === 3) return { ...d, close: undefined };
                    if (i === 6) return { ...d, high: null };
                    return d;
                }),
            });
            await compare();
            expectWarningsCalls().toEqual([]);
        });

        it('connects across missing values with connectMissingData', async () => {
            await createChart({
                ...withSeries({ connectMissingData: true }),
                data: DATA.map((d, i) => (i === 3 ? { ...d, close: undefined } : d)),
            });
            await compare();
        });

        it('leaves a close outside the high-low range unfilled and includes it in the domain', async () => {
            const series = await createChart({
                ...withSeries({ item: { high: { fill: '#57b757' }, low: { fill: '#41a9c9' } } }),
                data: DATA.map((d, i) => (i === 5 ? { ...d, close: 130 } : d)),
            });
            const [, max] = series.getSeriesDomain('y').domain;
            expect(max).toBeGreaterThanOrEqual(130);
            await compare();
        });

        it('rejects a null x key with a warning', async () => {
            await createChart({
                ...HLC_OPTIONS,
                axes: { x: { type: 'category' }, y: { type: 'number' } },
                data: [
                    { date: 'Mon', high: 9, low: 4, close: 6 },
                    { date: null, high: 11, low: 5, close: 10 },
                    { date: 'Wed', high: 14, low: 7, close: 8 },
                ],
            });
            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [object] for [HlcSeries-1 / xValue] ignored:",
    "[null]",
  ],
]
`);
        });

        it('renders out-of-safe-range bigint values', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: [
                        { x: 1, lo: -BIG, cl: 0n, hi: BIG },
                        { x: 2, lo: -BIG * 2n, cl: BIG, hi: BIG * 2n },
                        { x: 3, lo: -BIG, cl: BIG * 2n, hi: BIG * 3n },
                    ],
                    series: [{ type: 'hlc', xKey: 'x', highKey: 'hi', lowKey: 'lo', closeKey: 'cl' }],
                    axes: { x: { type: 'number' }, y: { type: 'number' } },
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('renders ISO-8601 datetime-string x values on a time axis', async () => {
            expect(
                await renderEnterpriseChartImage(ctx, {
                    data: [
                        { time: '2024-01-15T09:00:00Z', lo: 4, cl: 9, hi: 12 },
                        { time: '2024-01-15T10:00:00Z', lo: 6, cl: 7, hi: 15 },
                        { time: '2024-01-15T11:00:00Z', lo: 3, cl: 10, hi: 11 },
                        { time: '2024-01-15T12:00:00Z', lo: 8, cl: 16, hi: 18 },
                    ],
                    series: [{ type: 'hlc', xKey: 'time', highKey: 'hi', lowKey: 'lo', closeKey: 'cl' }],
                    axes: { x: { type: 'time' }, y: { type: 'number' } },
                })
            ).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
        });
    });

    describe('aggregation', () => {
        const N = HIGH_VOLUME_COUNT;
        const row = (toValue: (v: number) => number | bigint, base: number, i: number) => ({
            x: i + 1,
            lo: toValue(base - 5),
            cl: toValue(base + (i % 7) - 3),
            hi: toValue(base + 5),
        });

        it.each(HIGH_VOLUME_SIGNALS)(
            'renders a %s high-volume bigint series identically to its Number baseline',
            async (_label, sig) => {
                await expectPixelIdenticalAcrossMagnitude(
                    ctx,
                    createEnterpriseChart,
                    magnitudePair(
                        {
                            series: [{ type: 'hlc', xKey: 'x', highKey: 'hi', lowKey: 'lo', closeKey: 'cl' }],
                            axes: STRIPPED_NUMBER_AXES,
                        },
                        (toValue) => Array.from({ length: N }, (_, i) => row(toValue, sig(i), i)),
                        scaleToBigIntFinite
                    )
                );
            }
        );

        it("takes each bucket's close from its last datum", async () => {
            const data = Array.from({ length: N }, (_, i) => ({ x: i, lo: -10, hi: 10, cl: (i % 10) - 5 }));
            const series = await createChart({
                data,
                series: [{ type: 'hlc', xKey: 'x', highKey: 'hi', lowKey: 'lo', closeKey: 'cl' }],
                axes: STRIPPED_NUMBER_AXES,
            } as AgCartesianChartOptions);
            const filter = series.aggregationManager.getFilterForRange(series.axes.x.scale.range[1]);
            expect(filter, 'aggregation is active').toBeDefined();

            const closeNodes = series.getNodeData().filter((d: any) => d.itemType === 'close');
            expect(closeNodes.length).toBeLessThan(N);
            const { indexData, midpointIndices } = filter;
            for (let bucket = 0; bucket < midpointIndices.length; bucket++) {
                if (midpointIndices[bucket] === -1) continue;
                const node = closeNodes.find((d: any) => d.datumIndex === midpointIndices[bucket]);
                if (node == null) continue;
                const lastDatumIndex = indexData[bucket * AGGREGATION_SPAN + AGGREGATION_INDEX_X_MAX];
                expect(node.closeValue).toBe(data[lastDatumIndex].cl);
            }
        });
    });

    describe('initial animation', () => {
        const frames = spyOnAnimationFrames();

        it('reveals the bands and strokes by a left-to-right swipe with markers scaling in', async () => {
            const options = prepareEnterpriseTestOptions(withSeries({ marker: { enabled: true } }));

            chart = deproxy(AgCharts.create(options));
            const sampler = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampler);
            await frames.runToEnd(chart);

            const pathKeys = [...trajectory.at(-1)!.keys()].filter((key) => /^series\[0\]\/path\[/.test(key));
            expect(pathKeys, 'two band fills + three strokes').toHaveLength(5);
            for (const key of pathKeys) {
                const clipX = trajectory
                    .map((frame) => frame.get(key)?.['clip:x'])
                    .filter((v): v is number => v != null);
                expect(clipX[0], `${key} clip:x at frame 0`).toBeLessThanOrEqual(0.01);
                expectMonotonic(clipX, 'increasing');
                expectProgresses(clipX);
            }

            const markerKeys = [...trajectory.at(-1)!.keys()].filter((key) => /^series\[0\]\/marker\[/.test(key));
            expect(markerKeys.length, 'one marker per high, low and close value').toBe(DATA.length * 3);
            for (const key of markerKeys) {
                const width = trajectory.map((frame) => frame.get(key)!.width);
                expect(width[0], `${key} width at frame 0`).toBeLessThanOrEqual(0.01);
                expectMonotonic(width, 'increasing');
            }
        });

        it('reveal endpoints match a static render', async () => {
            const options = prepareEnterpriseTestOptions(withSeries({ marker: { enabled: true } }));
            const widened: AgChartOptions = {
                ...options,
                data: DATA.map((d) => ({ ...d, low: d.low - 2, high: d.high + 2 })),
            };

            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, widened);
        });
    });
});
