import { afterEach, describe, expect, it, vi } from 'vitest';

import { mapValues } from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgChartOptions,
    AgHistogramSeriesLabelPlacement,
    AgNumericValue,
} from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import { Transformable } from '../../../scene/transformable';
import {
    BIG,
    STRIPPED_NUMBER_AXES,
    expectPixelIdenticalAcrossMagnitude,
    magnitudePair,
} from '../../test/bigintExamples';
import { type ChartTestCase, COMMUNITY_AND_ENTERPRISE_EXAMPLES as GALLERY_EXAMPLES } from '../../test/examples-gallery';
import type { ChartOrProxy, SceneGeometrySample, SceneNodeExpectation } from '../../test/utils';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    clickAction,
    createChart as createMagnitudeChart,
    createSceneGeometrySampler,
    deproxy,
    doubleClickAction,
    expectAnimatedEndpointsMatchStatic,
    expectMonotonic,
    expectProgresses,
    expectSceneSamplesMatch,
    expectSceneTrajectory,
    expectWarningsCalls,
    extractImageData,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';
import type { SeriesNodeDataContext } from '../series';
import {
    HISTOGRAM_DATE_BASED_BUCKETS,
    HISTOGRAM_SCATTER_COMBO_SERIES_LABELS,
    HISTOGRAM_SERIES_LABELS,
} from '../test/examples';

const EXAMPLES: Record<string, ChartTestCase> = {
    SIMPLE_HISTOGRAM: GALLERY_EXAMPLES.SIMPLE_HISTOGRAM_CHART_EXAMPLE,
    HISTOGRAM_WITH_SPECIFIED_BINS: GALLERY_EXAMPLES.HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE,
    XY_HISTOGRAM_WITH_MEAN: GALLERY_EXAMPLES.XY_HISTOGRAM_WITH_MEAN_EXAMPLE,
    HISTOGRAM_DATE_BASED_BUCKETS: {
        options: HISTOGRAM_DATE_BASED_BUCKETS,
        enterprise: true,
        assertions: cartesianChartAssertions({ axisTypes: { x: 'time', y: 'number' }, seriesTypes: ['histogram'] }),
    },
};

describe('HistogramSeries', () => {
    setupMockConsole();

    let chart: ChartOrProxy;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    const nodeDataOf = (c: any) => (deproxy(c).series[0] as any).getNodeData() as any[];

    const createHistogramChart = (example: { options: AgChartOptions }, testOptions: AgCartesianChartOptions = {}) => {
        return AgCharts.create({
            ...prepareTestOptions({}),
            ...(example.options as AgCartesianChartOptions),
            ...testOptions,
        });
    };

    describe('#create', () => {
        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                chart = createHistogramChart(example);
                await waitForChartStability(chart);
                await example.assertions(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                chart = createHistogramChart(example);
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            }
        );
    });

    describe('#reversed axes', () => {
        for (const [exampleName, example] of Object.entries(EXAMPLES)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const axes = mapValues((example.options as AgCartesianChartOptions).axes ?? {}, (a) => ({
                    ...a,
                    reverse: true,
                })) ?? [
                    {
                        type: 'number',
                        position: 'left',
                        reverse: true,
                    },
                    {
                        type: 'number',
                        position: 'bottom',
                        reverse: true,
                    },
                ];
                chart = createHistogramChart(example, { axes });
                await waitForChartStability(chart);
                await example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const axes = mapValues((example.options as AgCartesianChartOptions).axes ?? {}, (a) => ({
                    ...a,
                    reverse: true,
                })) ?? [
                    {
                        type: 'number',
                        position: 'left',
                        reverse: true,
                    },
                    {
                        type: 'number',
                        position: 'bottom',
                        reverse: true,
                    },
                ];
                chart = createHistogramChart(example, { axes });
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            });
        }
    });

    describe('series highlighting', () => {
        it('should highlight scatter datum when overlapping histogram', async () => {
            const options = {
                ...HISTOGRAM_SCATTER_COMBO_SERIES_LABELS,
                series: HISTOGRAM_SCATTER_COMBO_SERIES_LABELS.series?.map((s) => {
                    if (s.type === 'scatter') {
                        // Tweak marker size, so it's large enough to trigger test failures if the fake mouse hover doesn't work below.
                        return { ...s, size: 20, fill: undefined, stroke: undefined, strokeWidth: 1 };
                    }
                    return s;
                }),
            };

            prepareTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series.find((v: any) => v.type === 'scatter');
            if (series == null) fail('No series found');

            const context: SeriesNodeDataContext<any, any> = (series as any)['contextNodeData'];
            const item = context.nodeData.find((n) => n.datum['weight'] === 65.6 && n.datum['age'] === 21);

            const { x, y } = Transformable.toCanvasPoint(series.contentGroup, item.point.x, item.point.y);

            await hoverAction(x, y)(chart);
            await waitForChartStability(chart);

            await compare();
        });
    });

    describe('getItemId', () => {
        const itemIdsOf = (c: any) => nodeDataOf(c).map((n) => n.itemId);

        const createBinnedChart = (
            series: Partial<NonNullable<AgCartesianChartOptions['series']>[number]> = {},
            data?: any[]
        ) => {
            const options: AgCartesianChartOptions = {
                data: data ?? [{ x: 1 }, { x: 5 }, { x: 12 }, { x: 18 }],
                series: [
                    {
                        type: 'histogram',
                        xKey: 'x',
                        bins: [
                            [0, 10],
                            [10, 20],
                        ],
                        ...(series as object),
                    },
                ],
            };
            prepareTestOptions(options as any);
            return AgCharts.create(options);
        };

        it('auto-generates an id from the bin boundaries', async () => {
            chart = createBinnedChart();
            await waitForChartStability(chart);

            expect(itemIdsOf(chart)).toEqual(['bin:0,10', 'bin:10,20']);
        });

        it('disambiguates negative and fractional bin boundaries', async () => {
            chart = createBinnedChart(
                {
                    bins: [
                        [-10, -5],
                        [-5, 0.5],
                    ],
                },
                [{ x: -8 }, { x: -1 }]
            );
            await waitForChartStability(chart);

            expect(itemIdsOf(chart)).toEqual(['bin:-10,-5', 'bin:-5,0.5']);
        });

        it('uses the getItemId callback to override the id', async () => {
            const getItemId = vi.fn((p: { binIndex: number }) => `b${p.binIndex}`);
            chart = createBinnedChart({ getItemId });
            await waitForChartStability(chart);

            expect(itemIdsOf(chart)).toEqual(['b0', 'b1']);
            expect(getItemId).toHaveBeenCalledWith(
                expect.objectContaining({
                    binIndex: 0,
                    binRange: [0, 10],
                    aggregatedValue: 2,
                    frequency: 2,
                    datums: [{ x: 1 }, { x: 5 }],
                })
            );
        });

        it('passes the chart context to the callback', async () => {
            const context = { tenant: 'acme' };
            const getItemId = vi.fn((p: { context?: any }) => `${p.context?.tenant}`);
            chart = createBinnedChart({ context, getItemId });
            await waitForChartStability(chart);

            expect(itemIdsOf(chart)).toEqual(['acme', 'acme']);
        });

        it('keeps ids stable across a data update that preserves bin boundaries', async () => {
            chart = createBinnedChart();
            await waitForChartStability(chart);
            const before = itemIdsOf(chart);
            const frequenciesBefore = nodeDataOf(chart).map((n) => n.frequency);

            await chart.update({
                data: [{ x: 2 }, { x: 3 }, { x: 14 }],
                series: [
                    {
                        type: 'histogram',
                        xKey: 'x',
                        bins: [
                            [0, 10],
                            [10, 20],
                        ],
                    },
                ],
            });
            await waitForChartStability(chart);

            // The update changes bin contents (so it definitely applied) but not boundaries.
            expect(nodeDataOf(chart).map((n) => n.frequency)).not.toEqual(frequenciesBefore);
            expect(itemIdsOf(chart)).toEqual(before);
        });

        it('falls back to the default id when the callback throws', async () => {
            const getItemId = () => {
                throw new Error('boom');
            };
            chart = createBinnedChart({ getItemId });
            await waitForChartStability(chart);

            expect(itemIdsOf(chart)).toEqual(['bin:0,10', 'bin:10,20']);
            expectWarningsCalls().toHaveLength(1);
        });
    });

    describe('bin callback params', () => {
        // Unordered input with marker fields, so callbacks must yield full source rows (not extracted
        // values); bin [20,30] is left empty.
        const sourceData = [
            { x: 35, y: 4, label: 'd' },
            { x: 2, y: 1, label: 'a' },
            { x: 8, y: 3, label: 'c' },
            { x: 5, y: 2, label: 'b' },
        ];
        const bins: [number, number][] = [
            [0, 10],
            [10, 20],
            [20, 30],
            [30, 40],
        ];

        const createChart = (series: Partial<NonNullable<AgCartesianChartOptions['series']>[number]> = {}) => {
            const options: AgCartesianChartOptions = {
                data: sourceData,
                series: [{ type: 'histogram', xKey: 'x', bins, ...(series as object) }],
            };
            prepareTestOptions(options as any);
            return AgCharts.create(options);
        };

        it('exposes positional bin metadata and raw source rows for every bin (AC1, AC2, TC1)', async () => {
            chart = createChart();
            await waitForChartStability(chart);
            const nodes = nodeDataOf(chart);

            // One node per bin, including empty bins, indexed positionally (never -1).
            expect(nodes.map((n) => n.binIndex)).toEqual([0, 1, 2, 3]);
            expect(nodes.map((n) => n.binRange)).toEqual([
                [0, 10],
                [10, 20],
                [20, 30],
                [30, 40],
            ]);
            expect(nodes.map((n) => n.frequency)).toEqual([3, 0, 0, 1]);

            // AC1: datums is the bin's full source rows, not extracted values; row order within a bin
            // isn't guaranteed, so compare order-independently. datum is undefined (a bin has no single row).
            expect(nodes[0].datum).toBeUndefined();
            expect(nodes[0].datums).toHaveLength(3);
            expect(nodes[0].datums).toEqual(
                expect.arrayContaining([
                    { x: 2, y: 1, label: 'a' },
                    { x: 5, y: 2, label: 'b' },
                    { x: 8, y: 3, label: 'c' },
                ])
            );

            // TC1: an empty bin is still a positioned bin.
            expect(nodes[2].binIndex).toBe(2);
            expect(nodes[2].binRange).toEqual([20, 30]);
            expect(nodes[2].datum).toBeUndefined();
            expect(nodes[2].datums).toEqual([]);
            expect(nodes[2].frequency).toBe(0);
            expect(nodes[2].aggregatedValue).toBe(0);
        });

        it.each([
            { aggregation: 'count', yKey: 'y', expected: 3 },
            { aggregation: 'sum', yKey: 'y', expected: 6 },
            { aggregation: 'mean', yKey: 'y', expected: 2 },
            { aggregation: 'count', yKey: undefined, expected: 3 },
        ] as const)(
            'computes aggregatedValue for $aggregation aggregation (yKey=$yKey) (AC3)',
            async ({ aggregation, yKey, expected }) => {
                chart = createChart({ aggregation, yKey });
                await waitForChartStability(chart);
                const firstBin = nodeDataOf(chart)[0];

                // frequency is always the row count, regardless of aggregation mode.
                expect(firstBin.frequency).toBe(3);
                expect(firstBin.aggregatedValue).toBe(expected);
            }
        );

        it('does not let areaPlot change aggregatedValue (AC3)', async () => {
            chart = createChart({ aggregation: 'sum', yKey: 'y', areaPlot: true });
            await waitForChartStability(chart);
            expect(nodeDataOf(chart)[0].aggregatedValue).toBe(6);
        });

        it('carries the area-adjusted plotted height as cumulativeValue for the crosshair', async () => {
            // Crosshair snaps to the plotted height (`cumulativeValue`, area-adjusted), not the raw
            // `aggregatedValue`. Bin width is 10, so 6 -> 0.6.
            chart = createChart({ aggregation: 'sum', yKey: 'y', areaPlot: true });
            await waitForChartStability(chart);
            const firstBin = nodeDataOf(chart)[0];
            expect(firstBin.aggregatedValue).toBe(6);
            expect(firstBin.cumulativeValue).toBeCloseTo(0.6);
        });

        it('keeps cumulativeValue and aggregatedValue equal without areaPlot', async () => {
            chart = createChart({ aggregation: 'sum', yKey: 'y' });
            await waitForChartStability(chart);
            const firstBin = nodeDataOf(chart)[0];
            expect(firstBin.cumulativeValue).toBe(6);
            expect(firstBin.aggregatedValue).toBe(6);
        });

        it('skips the label for a non-empty bin whose bigint total is exactly 0n', async () => {
            // Two rows in [0,10) sum to a bigint 0n; the label must still be skipped (`Number(0n) === 0`),
            // where the natural `0n === 0` would be false and wrongly render a "0" label.
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 2, y: 5n },
                    { x: 5, y: -5n },
                    { x: 12, y: 7n },
                ],
                series: [
                    {
                        type: 'histogram',
                        xKey: 'x',
                        yKey: 'y',
                        aggregation: 'sum',
                        bins: [
                            [0, 10],
                            [10, 20],
                        ],
                        label: { enabled: true },
                    },
                ],
            };
            prepareTestOptions(options as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const [zeroBin, nonZeroBin] = nodeDataOf(chart);
            expect(zeroBin.frequency).toBe(2);
            expect(zeroBin.aggregatedValue).toBe(0n); // genuinely bigint 0n, so `0n === 0` would be false
            expect(zeroBin.label).toBeUndefined();
            expect(nonZeroBin.label).toBeDefined();
        });

        const firstBinCanvasPoint = (c: any) => {
            const series = deproxy(c).series[0] as any;
            const node = series.getNodeData()[0];
            return Transformable.toCanvasPoint(series.contentGroup, node.x + node.width / 2, node.y + node.height / 2);
        };

        const clickFirstBin = async (c: any) => {
            const { x, y } = firstBinCanvasPoint(c);
            await clickAction(x, y)(c);
            await waitForChartStability(c);
        };

        it('fires seriesNodeClick with the bin params (AC1, AC2)', async () => {
            const seriesNodeClick = vi.fn();
            chart = createChart({ listeners: { seriesNodeClick } });
            await waitForChartStability(chart);

            await clickFirstBin(chart);

            expect(seriesNodeClick).toHaveBeenCalledTimes(1);
            const event = seriesNodeClick.mock.calls[0][0];
            expect(event).toMatchObject({
                type: 'seriesNodeClick',
                binIndex: 0,
                binRange: [0, 10],
                aggregatedValue: 3,
                frequency: 3,
            });
            // datums exposes every bin row; datum is undefined for a bin (no single row).
            expect(event.datum).toBeUndefined();
            expect(event.datums).toHaveLength(3);
            expect(event.datums).toEqual(
                expect.arrayContaining([
                    { x: 2, y: 1, label: 'a' },
                    { x: 5, y: 2, label: 'b' },
                    { x: 8, y: 3, label: 'c' },
                ])
            );
        });

        it('fires seriesNodeDoubleClick with the bin params', async () => {
            const seriesNodeDoubleClick = vi.fn();
            chart = createChart({ listeners: { seriesNodeDoubleClick } });
            await waitForChartStability(chart);

            const { x, y } = firstBinCanvasPoint(chart);
            await doubleClickAction(x, y)(chart);
            await waitForChartStability(chart);

            expect(seriesNodeDoubleClick).toHaveBeenCalledTimes(1);
            expect(seriesNodeDoubleClick).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'seriesNodeDoubleClick', binIndex: 0, binRange: [0, 10] })
            );
        });

        it('passes the bin params to the tooltip renderer (AC1, AC2)', async () => {
            const renderer = vi.fn((_params: any) => ({}));
            chart = createChart({ tooltip: { renderer } });
            await waitForChartStability(chart);

            const { x, y } = firstBinCanvasPoint(chart);
            await hoverAction(x, y)(chart);
            await waitForChartStability(chart);

            expect(renderer).toHaveBeenCalledTimes(1);
            const params = renderer.mock.calls[0][0];
            expect(params).toMatchObject({ binIndex: 0, binRange: [0, 10], aggregatedValue: 3, frequency: 3 });
            expect(params.datum).toBeUndefined();
            expect(params.datums).toHaveLength(3);
            expect(params.datums).toEqual(
                expect.arrayContaining([
                    { x: 2, y: 1, label: 'a' },
                    { x: 5, y: 2, label: 'b' },
                    { x: 8, y: 3, label: 'c' },
                ])
            );
        });

        it('resolves distinct tooltip content for each of two consecutive empty bins', async () => {
            // Empty bins all share groupIndex -1; keying by positional binIndex keeps them distinct.
            const renderer = vi.fn((_params: any) => ({}));
            chart = createChart({ tooltip: { renderer } });
            await waitForChartStability(chart);

            const series = deproxy(chart).series[0] as any;
            const emptyBins = (series.getNodeData() as any[]).filter((n) => n.frequency === 0);
            expect(emptyBins.map((n) => n.binIndex)).toEqual([1, 2]);

            for (const node of emptyBins) {
                renderer.mockClear();
                series.getTooltipContent(node.datumIndex);
                expect(renderer).toHaveBeenCalledTimes(1);
                expect(renderer.mock.calls[0][0]).toMatchObject({
                    binIndex: node.binIndex,
                    binRange: node.binRange,
                    frequency: 0,
                });
            }
        });
    });

    describe('label placement', () => {
        // A single populated bin keeps the geometry deterministic; the bar grows upward (positive total).
        const sourceData = [
            { x: 2, y: 5 },
            { x: 4, y: 5 },
            { x: 6, y: 5 },
        ];
        const bins: [number, number][] = [[0, 10]];

        const createChart = (label: Record<string, unknown>) => {
            const options: AgCartesianChartOptions = {
                data: sourceData,
                series: [
                    {
                        type: 'histogram',
                        xKey: 'x',
                        yKey: 'y',
                        aggregation: 'sum',
                        bins,
                        label: { enabled: true, ...label },
                    },
                ],
            };
            prepareTestOptions(options as any);
            return AgCharts.create(options);
        };

        const firstBinLabel = (c: any) => {
            const node = nodeDataOf(c)[0];
            return { node, label: node.label };
        };

        it('keeps inside-center at the bar centre (unchanged default)', async () => {
            chart = createChart({ placement: 'inside-center' });
            await waitForChartStability(chart);
            const { node, label } = firstBinLabel(chart);
            expect(label.x).toBeCloseTo(node.x + node.width / 2);
            expect(label.y).toBeCloseTo(node.y + node.height / 2);
            expect(label.textAlign).toBe('center');
            expect(label.textBaseline).toBe('middle');
        });

        it('sits the default (no placement) at the bar centre, matching today', async () => {
            chart = createChart({});
            await waitForChartStability(chart);
            const { node, label } = firstBinLabel(chart);
            expect(label.x).toBeCloseTo(node.x + node.width / 2);
            expect(label.y).toBeCloseTo(node.y + node.height / 2);
            expect(label.textAlign).toBe('center');
            expect(label.textBaseline).toBe('middle');
        });

        it('anchors inside-start to the bar base', async () => {
            chart = createChart({ placement: 'inside-start', spacing: 0 });
            await waitForChartStability(chart);
            const { node, label } = firstBinLabel(chart);
            expect(label.x).toBeCloseTo(node.x + node.width / 2);
            expect(label.y).toBeCloseTo(node.y + node.height);
            expect(label.textAlign).toBe('center');
            expect(label.textBaseline).toBe('bottom');
        });

        it('anchors inside-end to the bar top', async () => {
            chart = createChart({ placement: 'inside-end', spacing: 0 });
            await waitForChartStability(chart);
            const { node, label } = firstBinLabel(chart);
            expect(label.x).toBeCloseTo(node.x + node.width / 2);
            expect(label.y).toBeCloseTo(node.y);
            expect(label.textAlign).toBe('center');
            expect(label.textBaseline).toBe('top');
        });

        it('places outside-end above the bar top', async () => {
            chart = createChart({ placement: 'outside-end', spacing: 0 });
            await waitForChartStability(chart);
            const { node, label } = firstBinLabel(chart);
            expect(label.x).toBeCloseTo(node.x + node.width / 2);
            expect(label.y).toBeCloseTo(node.y);
            expect(label.textAlign).toBe('center');
            expect(label.textBaseline).toBe('bottom');
        });

        it('places outside-start below the bar base', async () => {
            chart = createChart({ placement: 'outside-start', spacing: 0 });
            await waitForChartStability(chart);
            const { node, label } = firstBinLabel(chart);
            expect(label.x).toBeCloseTo(node.x + node.width / 2);
            expect(label.y).toBeCloseTo(node.y + node.height);
            expect(label.textAlign).toBe('center');
            expect(label.textBaseline).toBe('top');
        });

        it('applies spacing as an offset from the placement anchor', async () => {
            const spacing = 12;
            chart = createChart({ placement: 'inside-end', spacing });
            await waitForChartStability(chart);
            const { node, label } = firstBinLabel(chart);
            // inside-end anchors to the bar top; spacing pushes the label down into the bar.
            expect(label.y).toBeCloseTo(node.y + spacing);
        });

        it('accepts a placement array and honours its first candidate', async () => {
            chart = createChart({ placement: ['inside-end', 'inside-center'], spacing: 0 });
            await waitForChartStability(chart);
            const { node, label } = firstBinLabel(chart);
            expect(label.y).toBeCloseTo(node.y);
            expect(label.textBaseline).toBe('top');
        });

        it('applies the bar-aligned 8px default gap when spacing is unset', async () => {
            chart = createChart({ placement: 'inside-end' });
            await waitForChartStability(chart);
            const { node, label } = firstBinLabel(chart);
            // No explicit spacing: the theme's default 8px `spacing` pushes the label in from the bar top.
            expect(label.y).toBeCloseTo(node.y + 8);
        });

        it('folds only the facing side of non-uniform box padding into the offset', async () => {
            // inside-end faces the bar top; only top padding shifts the anchor, not the larger bottom.
            chart = createChart({
                placement: 'inside-end',
                spacing: 0,
                fill: 'red',
                padding: { top: 4, right: 6, bottom: 20, left: 2 },
            });
            await waitForChartStability(chart);
            const { node, label } = firstBinLabel(chart);
            expect(label.y).toBeCloseTo(node.y + 4);
            expect(label.textBaseline).toBe('top');
        });

        it('rotates the label a quarter-turn for orientation vertical (bar parity)', async () => {
            chart = createChart({ placement: 'outside-end', orientation: 'vertical', spacing: 0 });
            await waitForChartStability(chart);
            const { label } = firstBinLabel(chart);
            expect(label.rotation).toBeCloseTo(-Math.PI / 2);
            const series = deproxy(chart).series[0] as any;
            const textNode = series.labelSelection.nodes().find((n: any) => n.visible);
            expect(textNode).toBeDefined();
            expect(textNode.rotation).toBeCloseTo(-Math.PI / 2);
        });
    });

    describe('label placement snapshots', () => {
        const PLACEMENTS: AgHistogramSeriesLabelPlacement[] = [
            'inside-center',
            'inside-start',
            'inside-end',
            'outside-start',
            'outside-end',
        ];

        // Frequency data is all-positive, so the bar base sits on the plot floor. Extend the y-axis
        // below zero so outside-start labels (rendered below the base) have room instead of being clipped.
        const axes = HISTOGRAM_SERIES_LABELS.axes as any;
        const withPlacement = (label: Record<string, unknown>) => ({
            options: {
                ...HISTOGRAM_SERIES_LABELS,
                axes: { ...axes, y: { ...axes.y, min: -10 } },
                series: (HISTOGRAM_SERIES_LABELS.series ?? []).map((s: any) => ({
                    ...s,
                    label: { ...s.label, enabled: true, ...label },
                })),
            },
        });

        it.each(PLACEMENTS)('renders %s labels as expected', async (placement) => {
            chart = createHistogramChart(withPlacement({ placement }));
            await compare();
        });

        it('lets an explicit spacing override the default gap', async () => {
            // spacing: 0 replaces the theme's default 8px spacing, pinning the label flush to the bar top.
            chart = createHistogramChart(withPlacement({ placement: 'inside-end', spacing: 0 }));
            await compare();
        });

        it('renders a rotated (vertical) outside-end label clear of the bar', async () => {
            chart = createHistogramChart(withPlacement({ placement: 'outside-end', orientation: 'vertical' }));
            await compare();
        });
    });

    describe('stylers', () => {
        // bin [20,30] is left empty so styler callbacks are exercised against an empty bin too.
        const sourceData = [
            { x: 2, y: 1 },
            { x: 5, y: 2 },
            { x: 8, y: 3 },
            { x: 35, y: 4 },
        ];
        const bins: [number, number][] = [
            [0, 10],
            [10, 20],
            [20, 30],
            [30, 40],
        ];

        const createChart = (series: Partial<NonNullable<AgCartesianChartOptions['series']>[number]> = {}) => {
            const options: AgCartesianChartOptions = {
                data: sourceData,
                series: [{ type: 'histogram', xKey: 'x', yKey: 'y', aggregation: 'sum', bins, ...(series as object) }],
            };
            prepareTestOptions(options as any);
            return AgCharts.create(options);
        };

        const styleOf = (c: any) => nodeDataOf(c).map((n) => n.style);

        it('passes the bin metadata to itemStyler and applies the returned style for every bin', async () => {
            const params: any[] = [];
            chart = createChart({
                itemStyler: (p: any) => {
                    params.push(p);
                    return { fill: p.frequency > 0 ? 'red' : 'blue' };
                },
            });
            await waitForChartStability(chart);

            // itemStyler runs for every bin, including the empty one.
            const firstBinParams = params.find((p) => p.binIndex === 0);
            expect(firstBinParams).toMatchObject({
                seriesId: expect.any(String),
                xKey: 'x',
                yKey: 'y',
                datum: undefined,
                binIndex: 0,
                binRange: [0, 10],
                frequency: 3,
                aggregatedValue: 6,
                highlightState: 'none',
                fill: expect.anything(),
                strokeWidth: expect.any(Number),
            });
            expect(firstBinParams.datums).toHaveLength(3);

            const emptyBinParams = params.find((p) => p.binIndex === 2);
            expect(emptyBinParams).toMatchObject({ frequency: 0, aggregatedValue: 0, datums: [] });

            // Non-empty bins -> red, the empty bin -> blue.
            expect(styleOf(chart).map((s) => s.fill)).toEqual(['red', 'blue', 'blue', 'red']);
        });

        it('applies the series styler to every bin', async () => {
            const params: any[] = [];
            chart = createChart({
                styler: (p: any) => {
                    params.push(p);
                    return { fill: 'green', strokeWidth: 4 };
                },
            });
            await waitForChartStability(chart);

            expect(params[0]).toMatchObject({
                seriesId: expect.any(String),
                xKey: 'x',
                yKey: 'y',
                highlightState: 'none',
                fill: expect.anything(),
            });
            const styles = styleOf(chart);
            expect(styles.every((s) => s.fill === 'green')).toBe(true);
            expect(styles.every((s) => s.strokeWidth === 4)).toBe(true);
        });

        it('lets itemStyler take precedence over the series styler', async () => {
            chart = createChart({
                styler: () => ({ fill: 'green' }),
                itemStyler: (p: any) => (p.binIndex === 0 ? { fill: 'red' } : undefined),
            });
            await waitForChartStability(chart);

            const fills = styleOf(chart).map((s) => s.fill);
            expect(fills[0]).toBe('red');
            expect(fills[1]).toBe('green');
        });

        it('renders itemStyler-driven styles to canvas as expected', async () => {
            chart = createChart({
                itemStyler: (p: any) => ({
                    fill: p.binIndex % 2 === 0 ? '#3366cc' : '#dc3912',
                    stroke: 'black',
                    strokeWidth: 2,
                }),
            });
            await compare();
        });
    });

    describe('Series Labels', () => {
        const examples = {
            HISTOGRAM_SERIES_LABELS: {
                options: HISTOGRAM_SERIES_LABELS,
                assertions: cartesianChartAssertions({
                    axisTypes: { x: 'number', y: 'number' },
                    seriesTypes: ['histogram'],
                }),
            },
            HISTOGRAM_SCATTER_COMBO_SERIES_LABELS: {
                options: HISTOGRAM_SCATTER_COMBO_SERIES_LABELS,
                assertions: cartesianChartAssertions({
                    axisTypes: { x: 'number', y: 'number', __AXIS_ID_2: 'number' },
                    seriesTypes: ['histogram', 'scatter'],
                }),
            },
        };

        it.each(Object.entries(examples))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                chart = createHistogramChart(example);
                await waitForChartStability(chart);
                example.assertions(chart);
            }
        );

        it.each(Object.entries(examples))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();
            }
        );
    });

    // Initial/remove/add/update animations are covered structurally by the
    // 'animation -test page actions' trajectory CASEs below.

    // One CASE per transition the histogram-series-test page exercises (initial load, Randomise,
    // Remove/binning). Bins are Rects that reveal from the value baseline, so these mirror the bar
    // suite's revealFromBaseline / height-reflow patterns.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        const BINS_3: [number, number][] = [
            [0, 10],
            [10, 20],
            [20, 30],
        ];
        const BINS_5: [number, number][] = [
            [0, 6],
            [6, 12],
            [12, 18],
            [18, 24],
            [24, 30],
        ];
        // Per-bin frequencies (all < the pinned y-max of 10, so the reflows below never rescale):
        //   DATA_A over BINS_3 -> [5, 3, 3];  DATA_B over BINS_3 -> [2, 4, 4].
        const DATA_A = [1, 2, 3, 5, 7, 11, 12, 15, 21, 25, 28];
        const DATA_B = [1, 2, 11, 12, 15, 18, 21, 22, 25, 28];

        const binnedSeries = (bins: [number, number][]): NonNullable<AgCartesianChartOptions['series']> => [
            { type: 'histogram', xKey: 'x', bins, label: { enabled: false } },
        ];

        // Pinned x (via the fixed bins) and y (0-10) domains keep every data update provably
        // non-scale-affecting, so only the bins themselves move.
        const histogramOptions = (mode?: 'integrated'): AgCartesianChartOptions => {
            const options: AgCartesianChartOptions = {
                data: DATA_A.map((x) => ({ x })),
                series: binnedSeries(BINS_3),
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 10 },
                },
            };
            if (mode != null) {
                (options as AgChartOptions & { mode: string }).mode = mode;
            }
            return prepareTestOptions(options);
        };

        const rectCount = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[\d+\]\/rect/.test(k)).length;

        const rectKeys = (sample: SceneGeometrySample) =>
            [...sample.keys()].filter((k) => /^series\[\d+\]\/rect/.test(k));

        const expectStartsCollapsed = (frame: SceneGeometrySample, key: string) => {
            const node = frame.get(key);
            expect(node, key).toBeDefined();
            expect(node!.height).toBeLessThanOrEqual(0.1);
        };
        // Anti-vacuity for a reveal: EVERY bin (not just the first) must start collapsed at the
        // baseline, so the height `increases` cannot pass for a bin that snapped straight to full height.
        const expectAllBinsStartCollapsed = (frame: SceneGeometrySample) => {
            const keys = rectKeys(frame);
            expect(keys.length, 'bins at frame 0').toBeGreaterThan(0);
            for (const key of keys) {
                expectStartsCollapsed(frame, key);
            }
        };

        // Frequency labels are disabled (invisible), but the series still re-fades their opacity on a
        // value/structure change. They never paint, so their opacity churn is not a behaviour to pin.
        const labelsIgnored = { 'series[*]/labels/text[*]': 'any' } as const;

        // Bins grow from the value baseline: height increases and the top edge (y) rises during the
        // named phase, while the band coordinates only absorb a sub-pixel crisp snap (bounded).
        const revealFromBaseline = (phase: 'initial' | 'add'): SceneNodeExpectation => {
            const holds = { during: [phase, 'trailing'], expect: 'bounded' } as const;
            return {
                height: { during: phase, expect: ['increases', 'progresses', 'bounded'] },
                y: { during: phase, expect: ['decreases', 'bounded'] },
                x: holds,
                width: holds,
            };
        };

        // Auto-binning (no explicit `bins`): a data update that shifts the extent recomputes the bin
        // set from the data. The bins re-key structurally and snap to their new boundaries at frame 0
        // (x/width hold — a boundary that tweened horizontally would break `revealFromBaseline`), then
        // the fresh collapsed set grows from the baseline — the same reveal the explicit binning-change
        // takes, exercised through the data-driven auto-bin path the retired snapshots covered.
        it('auto-binning: a data update that shifts the extent re-bins and grows from the baseline', async () => {
            // The x-axis view is pinned so only the bins (computed from the data, not the axis) move on
            // the update — an unpinned axis would reflow its ticks as the extent grows and drown the bin
            // reveal in axis animation. y is pinned to keep the counts provably non-scale-affecting.
            const autoOptions = (data: number[]): AgCartesianChartOptions =>
                prepareTestOptions({
                    data: data.map((x) => ({ x })),
                    series: [{ type: 'histogram', xKey: 'x', label: { enabled: false } }],
                    axes: {
                        x: { type: 'number', position: 'bottom', min: 0, max: 60 },
                        y: { type: 'number', position: 'left', min: 0, max: 10 },
                    },
                });
            chart = AgCharts.create(autoOptions(DATA_A));
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            const before = sampleScene();
            const beforeBins = rectCount(before);
            await chart.updateDelta({ data: [...DATA_A, 40, 55, 58].map((x) => ({ x })) });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            await frames.runToEnd(chart);
            const after = sampleScene();
            expectSceneSamplesMatch(trajectory.at(-1)!, after);

            // Anti-vacuity: the wider extent genuinely re-binned (a different bin set), and every new
            // bin starts collapsed at the baseline.
            expect(rectCount(after)).not.toBe(beforeBins);
            expectAllBinsStartCollapsed(trajectory[0]);
            expectSceneTrajectory(trajectory, {
                'series[*]/rect[*]': {
                    // Empty auto-bins legitimately stay flat at zero, so the wildcard only bounds the
                    // reveal; the populated bins' actual growth is asserted below. x/width snap to the
                    // new boundaries (guarded below) with a sub-pixel crisp-rounding wobble.
                    height: { during: ['add', 'trailing'], expect: 'bounded' },
                    y: { during: ['add', 'trailing'], expect: 'bounded' },
                    x: 'any',
                    width: 'any',
                },
                ...labelsIgnored,
            });
            // The new boundaries snap in: each bin's width is already at its settled value on frame 0
            // (within crisp-pixel noise), not tweening across the ~13px bin-width change from the old set.
            for (const key of rectKeys(trajectory[0])) {
                const snap = Math.abs(trajectory[0].get(key)!.width - after.get(key)!.width);
                expect(snap, `${key} width snaps to its new boundary`).toBeLessThan(2);
            }
            // The populated bins grow gradually from the collapsed baseline (empty bins excluded).
            const populated = rectKeys(after).filter((k) => after.get(k)!.height > 5);
            expect(populated.length, 'populated bins').toBeGreaterThan(1);
            for (const key of populated) {
                const heights = trajectory.map((f) => f.get(key)?.height).filter((v): v is number => v != null);
                expect(heights[0], `${key} height @ frame 0`).toBeLessThanOrEqual(0.1);
                expectMonotonic(heights, 'increasing');
                expectProgresses(heights);
            }
        });

        // "Reset"/initial render — bins reveal from the baseline.
        it('initial load: bins reveal from the baseline', async () => {
            chart = AgCharts.create(histogramOptions());
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectAllBinsStartCollapsed(trajectory[0]);
            expectSceneTrajectory(trajectory, {
                'series[*]/rect[*]': revealFromBaseline('initial'),
                ...labelsIgnored,
            });
        });

        // "Randomise" — same bins, new totals: bar heights reflow (each bin either way) during the
        // update phase; the bands hold. Hand-rolled (not captureUpdate): the disabled labels re-fade
        // their opacity from frame 0, tripping captureUpdate's whole-scene start anchor.
        it('data update: bin heights reflow toward their new totals during the update phase', async () => {
            const options = histogramOptions();
            chart = AgCharts.create(options);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            const before = sampleScene();
            await chart.updateDelta({ data: DATA_B.map((x) => ({ x })) });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            await frames.runToEnd(chart);
            const after = sampleScene();
            expectSceneSamplesMatch(trajectory.at(-1)!, after);

            expect(rectCount(after)).toBe(3);
            // Anti-vacuity: the first bin genuinely shrinks and the others genuinely grow.
            expect(before.get('series[0]/rect[0]')!.height).toBeGreaterThan(
                after.get('series[0]/rect[0]')!.height + 50
            );
            expect(after.get('series[0]/rect[245]')!.height).toBeGreaterThan(
                before.get('series[0]/rect[245]')!.height + 30
            );
            expectSceneTrajectory(trajectory, {
                'series[*]/rect[*]': {
                    height: { during: 'update', expect: ['monotonic', 'progresses', 'bounded'] },
                    y: { during: 'update', expect: ['monotonic', 'progresses', 'bounded'] },
                },
                ...labelsIgnored,
            });
        });

        // "Remove"/binning change — a new bin set replaces the old one. The old rects are dropped and
        // a fresh set snaps in collapsed at the baseline (frame 0), then grows during the add phase.
        // Hand-rolled: the rects re-key structurally at frame 0, so captureUpdate's start anchor trips.
        it('binning change: a new bin set snaps in collapsed then grows from the baseline', async () => {
            const options = histogramOptions();
            chart = AgCharts.create(options);
            await frames.runToEnd(chart);
            const sampleScene = createSceneGeometrySampler(chart);

            const before = sampleScene();
            expect(rectCount(before)).toBe(3);
            await chart.update({ ...options, series: binnedSeries(BINS_5) });
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            await frames.runToEnd(chart);
            const after = sampleScene();
            expectSceneSamplesMatch(trajectory.at(-1)!, after);

            // Anti-vacuity: the bin count changes and every new bin starts collapsed at the baseline.
            expect(rectCount(after)).toBe(5);
            expect(rectKeys(trajectory[0])).toHaveLength(5);
            expectAllBinsStartCollapsed(trajectory[0]);
            expectSceneTrajectory(trajectory, {
                'series[*]/rect[*]': revealFromBaseline('add'),
                ...labelsIgnored,
            });
        });

        // Integrated mode: the initial load must reveal from the baseline exactly as standalone does.
        it('integrated mode: initial load reveals bins from the baseline', async () => {
            chart = AgCharts.create(histogramOptions('integrated'));
            const sampleScene = createSceneGeometrySampler(chart);
            const trajectory = await frames.captureAnimationFrames(chart, sampleScene);
            expectAllBinsStartCollapsed(trajectory[0]);
            expectSceneTrajectory(trajectory, {
                'series[*]/rect[*]': revealFromBaseline('initial'),
                ...labelsIgnored,
            });
        });

        // Endpoint sanity guards: the animated route must settle at exactly the pixels a snapped
        // render of the same options produces (see expectAnimatedEndpointsMatchStatic).
        it('sanity: data update endpoints match static renders', async () => {
            const options = histogramOptions();
            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, {
                ...options,
                data: DATA_B.map((x) => ({ x })),
            });
        });

        it('sanity: binning change endpoints match static renders', async () => {
            const options = histogramOptions();
            chart = AgCharts.create(options);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, options, {
                ...options,
                series: binnedSeries(BINS_5),
            });
        });
    });

    // See https://ag-grid.atlassian.net/browse/AG-8641
    describe('explicit binCount', () => {
        test('with 0 decimal places', async () => {
            const options: AgChartOptions = {
                data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((x) => {
                    return { x };
                }),
                series: [{ type: 'histogram', xKey: 'x', binCount: 10 }],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        test('with 1 decimal places', async () => {
            const options: AgChartOptions = {
                data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((x) => {
                    return { x: x / 10 };
                }),
                series: [{ type: 'histogram', xKey: 'x', binCount: 10 }],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });

        test('with 2 decimal places', async () => {
            const options: AgChartOptions = {
                data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((x) => {
                    return { x: x / 100 };
                }),
                series: [{ type: 'histogram', xKey: 'x', binCount: 10 }],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await compare();
        });
    });

    // CRT-1043: Invisible histogram series must still populate nodeData so the remove animation
    // has actual positions to animate from rather than empty data (which causes no animation).
    describe('legend toggle nodeData (CRT-1043)', () => {
        const animate = spyOnAnimationManager();

        it('should populate nodeData for invisible histogram series after legend toggle', async () => {
            animate(1200, 1);

            // Use the histogram-with-specified-bins example — the original reproduction case.
            const options: AgChartOptions = { ...GALLERY_EXAMPLES.HISTOGRAM_WITH_SPECIFIED_BINS_EXAMPLE.options };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Toggle series invisible (simulates legend click)
            animate(1200, 0.5);
            (options.series![0] as any).visible = false;
            await chart.update(options);
            await waitForChartStability(chart);

            const chartInstance = deproxy(chart);
            const invisibleSeries = chartInstance.series[0] as any;
            const nodeData = invisibleSeries.contextNodeData?.nodeData;

            expect(nodeData!.length).toBeGreaterThan(0);
            expect(nodeData!.some((d: any) => d.frequency > 0)).toBe(true);
        });

        // Verify that bar Rect nodes have intermediate heights during the remove animation,
        // proving the animation system has real positional data to interpolate from (the CRT-1043
        // fix). Visual snapshots are not used because axis domain collapse on a single-series chart
        // makes intermediate frames visually blank despite the animation working internally.
        it('should have bar rects at intermediate heights during legend toggle animation', async () => {
            animate(1200, 1);

            const options: AgChartOptions = { ...GALLERY_EXAMPLES.SIMPLE_HISTOGRAM_CHART_EXAMPLE.options };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            // Record initial bar heights from the fully-rendered chart.
            const chartInstance = deproxy(chart);
            const series = chartInstance.series[0] as any;
            const getBarHeights = (): number[] =>
                Array.from(series.datumSelection.nodes() as Iterable<any>, (rect: any) => rect.height as number);

            const initialHeights = getBarHeights();
            expect(initialHeights.length).toBeGreaterThan(0);
            expect(initialHeights.some((h) => h > 1)).toBe(true);

            // Animate at 10% of total (40% through the remove phase which spans 0-25%).
            // Toggle invisible via options update matching the barSeries legend toggle pattern.
            animate(1200, 0.1);
            (options.series![0] as any).visible = false;
            await chart.update(options);
            await waitForChartStability(chart);

            const midHeights = getBarHeights();
            // Bars should still exist and be shorter than their initial heights.
            for (let i = 0; i < initialHeights.length; i++) {
                if (initialHeights[i] > 1) {
                    expect(midHeights[i]).toBeLessThan(initialHeights[i]);
                }
            }
        });
    });

    describe('gradient fill', () => {
        it('should render histogram series with default gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_HISTOGRAM_CHART_EXAMPLE.options,
                series: [
                    {
                        type: 'histogram',
                        xKey: 'engine-size',
                        fill: {
                            type: 'gradient',
                        },
                    },
                ],
            };
            prepareTestOptions(options as AgChartOptions);

            chart = AgCharts.create(options as AgChartOptions);
            await waitForChartStability(chart);

            await compare();
        });

        it('should render histogram series with a gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.SIMPLE_HISTOGRAM_CHART_EXAMPLE.options,
                series: [
                    {
                        type: 'histogram',
                        xKey: 'engine-size',
                        fill: {
                            type: 'gradient',
                            colorStops: [
                                {
                                    color: 'green',
                                },
                                {
                                    color: 'white',
                                },
                            ],
                        },
                    },
                ],
            };
            prepareTestOptions(options as AgChartOptions);

            chart = AgCharts.create(options as AgChartOptions);
            await waitForChartStability(chart);

            await compare();
        });
    });

    describe('bigint aggregation (AG-16608)', () => {
        it('sums a bigint yKey column at full precision (aggregation: sum)', async () => {
            const big = 9_007_199_254_740_993n; // 2^53 + 1, not exactly representable as a Number
            const options: AgCartesianChartOptions = {
                data: [
                    { x: 1, y: big },
                    { x: 2, y: big },
                    { x: 3, y: big },
                ],
                series: [{ type: 'histogram', xKey: 'x', yKey: 'y', aggregation: 'sum', bins: [[0, 10]] }],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const bin = nodeDataOf(chart).find((n: any) => n.aggregatedValue != null);
            expect(bin).toBeDefined();
            // A narrowing convert() would round this sum; the bigint path keeps it exact.
            expect(bin!.aggregatedValue).toBe(3n * big);
        });
    });

    describe('bigint bins (AG-16608)', () => {
        it('computes bin boundaries in BigInt at full precision', async () => {
            const base = 9_007_199_254_740_993n; // 2^53 + 1 — not representable as a Number
            const xs = [base, base + 10n, base + 25n, base + 40n, base + 80n];
            const options: AgChartOptions = {
                data: xs.map((x) => ({ x })),
                series: [{ type: 'histogram', xKey: 'x', binCount: 10 }],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = deproxy(chart).series[0] as unknown as {
                calculatedBins: { domain: [bigint, bigint]; frequency: number }[];
            };
            const bins = series.calculatedBins;

            expect(bins.length).toBeGreaterThan(0);
            for (const bin of bins) {
                expect(typeof bin.domain[0]).toBe('bigint');
                expect(typeof bin.domain[1]).toBe('bigint');
            }
            expect(bins[0].domain[0] <= base).toBe(true);
            expect(bins.at(-1)!.domain[1] >= base + 80n).toBe(true);

            const totalFrequency = bins.reduce((acc, bin) => acc + bin.frequency, 0);
            expect(totalFrequency).toBe(xs.length);
        });

        it('falls back to Number bins (no RangeError) when the extent mixes a bigint and a fractional number', async () => {
            // BigInt(25.5) throws RangeError, so a non-integral endpoint must defer to the Number path.
            const options: AgChartOptions = {
                data: [{ x: 10n }, { x: 12n }, { x: 18n }, { x: 20n }, { x: 25.5 }],
                series: [{ type: 'histogram', xKey: 'x', binCount: 5 }],
            };
            prepareTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = deproxy(chart).series[0] as unknown as {
                calculatedBins: { domain: [AgNumericValue, AgNumericValue]; frequency: number }[];
            };
            const bins = series.calculatedBins;

            expect(bins.length).toBeGreaterThan(0);
            for (const bin of bins) {
                expect(typeof bin.domain[0]).toBe('number');
                expect(typeof bin.domain[1]).toBe('number');
            }
            const totalFrequency = bins.reduce((acc, bin) => acc + bin.frequency, 0);
            expect(totalFrequency).toBe(5);
            // The mixed-numeric warning is emitted for value columns, not key columns.
            expectWarningsCalls().toHaveLength(0);
        });
    });

    describe('bigint values (AG-16608)', () => {
        it('renders a histogram of out-of-safe-range bigint x values', async () => {
            const base = BIG;
            chart = AgCharts.create(
                prepareTestOptions({
                    data: [base, base + 10n, base + 25n, base + 40n, base + 80n, base + 95n].map((x) => ({ x })),
                    series: [{ type: 'histogram', xKey: 'x', binCount: 5 }],
                    axes: { x: { type: 'number' }, y: { type: 'number' } },
                })
            );
            await compare();
        });
    });

    describe('bigint magnitude invariance (AG-16608)', () => {
        const xs = (values: number[]) => (toValue: (v: number) => number | bigint) =>
            values.map((x) => ({ x: toValue(x) }));

        it('bins a histogram identically when x is scaled beyond Number.MAX_VALUE', async () => {
            await expectPixelIdenticalAcrossMagnitude(
                ctx,
                createMagnitudeChart,
                magnitudePair(
                    { series: [{ type: 'histogram', xKey: 'x', binCount: 5 }], axes: STRIPPED_NUMBER_AXES },
                    xs([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
                )
            );
        });
    });

    describe('getLabelObstacles', () => {
        it('contributes a seriesItem rect obstacle per bin', async () => {
            const options: AgCartesianChartOptions = {
                data: [1, 2, 3, 4, 11, 12, 21, 22, 23].map((x) => ({ x })),
                series: [{ type: 'histogram', xKey: 'x', binCount: 3 }],
            };
            prepareTestOptions(options as any);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const series = deproxy(chart).series[0] as any;
            const nodeData = series.contextNodeData?.nodeData as Array<{
                x: number;
                y: number;
                width: number;
                height: number;
            }>;
            const obstacles = series.getLabelObstacles();

            expect(nodeData.length).toBeGreaterThan(0);
            expect(obstacles).toEqual(
                nodeData.map(({ x, y, width, height }) => ({
                    kind: 'rect',
                    box: { x, y, width, height },
                    category: 'seriesItem',
                }))
            );
        });
    });
});
