import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    type AgCartesianChartOptions,
    type AgChartOptions,
    AgCharts,
    type AgHlcSeriesItemStylerParams,
    type AgHlcSeriesStyle,
    type AgHlcSeriesStylerParams,
    type AgSeriesMarkerStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    BIG,
    HIGH_VOLUME_COUNT,
    HIGH_VOLUME_SIGNALS,
    IMAGE_SNAPSHOT_DEFAULTS,
    STRIPPED_NUMBER_AXES,
    clickAction,
    compareImageSnapshot,
    computeLegendBBox,
    createSceneGeometrySampler,
    deproxy,
    dragAction,
    expectAnimatedEndpointsMatchStatic,
    expectMonotonic,
    expectPixelIdenticalAcrossMagnitude,
    expectProgresses,
    expectWarningsCalls,
    focusIndicatorContainsCanvasPoint,
    getLegendModule,
    getTooltipElement,
    hoverAction,
    isTooltipVisible,
    magnitudePair,
    pressKey,
    scaleToBigIntFinite,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    tabIntoChart,
    waitForChartStability,
} from 'ag-charts-community-test';
import { AGGREGATION_INDEX_UNSET } from 'ag-charts-core';

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

// The test palette gives up, down and neutral the same colour, which hides the band split.
const UP_DOWN_THEME = {
    palette: {
        up: { fill: '#57b757', stroke: '#3d803d' },
        down: { fill: '#f3622d', stroke: '#aa4520' },
    },
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

    const canvasPointOf = (series: any, node: { point: { x: number; y: number } }) => {
        const { canvasX, canvasY } = _ModuleSupport.Transformable.toCanvasPoint(
            series.contentGroup,
            node.point.x,
            node.point.y
        );
        return { canvasX, canvasY };
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
            await createChart({ ...HLC_OPTIONS, theme: UP_DOWN_THEME });
            await compare();
        });

        it('renders with markers enabled', async () => {
            await createChart(withSeries({ marker: { enabled: true } }));
            await compare();
        });

        it.each([
            ['smooth', { type: 'smooth' }],
            ['step', { type: 'step' }],
        ])('renders with %s interpolation', async (_name, interpolation) => {
            await createChart(withSeries({ interpolation }));
            await compare();
        });

        it('renders a marker shadow', async () => {
            await createChart(
                withSeries({
                    marker: {
                        enabled: true,
                        size: 14,
                        shadow: { enabled: true, color: '#000000', xOffset: 6, yOffset: 6, blur: 0 },
                    },
                })
            );
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

        it('hides the series when its legend item is clicked and restores it on a second click', async () => {
            const series = await createChart({
                ...withSeries({ marker: { enabled: true } }),
                legend: { enabled: true },
            });
            expect(series.visible).toBe(true);
            const legendBox = computeLegendBBox(deproxy(chart));
            expect(legendBox.width).toBeGreaterThan(0);
            const legendItems = () => getLegendModule(deproxy(chart)).itemSelection.nodes();
            expect(legendItems()).toHaveLength(1);

            await clickAction(legendBox.x + legendBox.width / 2, legendBox.y + legendBox.height / 2)(chart);
            await waitForChartStability(chart);
            expect(series.visible).toBe(false);
            await compare();

            await clickAction(legendBox.x + legendBox.width / 2, legendBox.y + legendBox.height / 2)(chart);
            await waitForChartStability(chart);
            expect(series.visible).toBe(true);
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

        it('headlines the tooltip with the formatted x value', async () => {
            const series = await createChart(withSeries({ marker: { enabled: true } }));
            const content = series.getTooltipContent(1, undefined);
            expect(content.heading).toBe('Jan  2 2024');
        });

        it('shows exactly one tooltip with a High, Low and Close row each when a datum is hovered', async () => {
            const series = await createChart(
                withSeries({ highName: 'High', lowName: 'Low', closeName: 'Close', marker: { enabled: true } })
            );
            const closeNode = series.getNodeData().find((d: any) => d.datumIndex === 1 && d.itemType === 'close');
            const { canvasX, canvasY } = canvasPointOf(series, closeNode);
            await hoverAction(canvasX, canvasY)(chart);
            await waitForChartStability(chart);

            const tooltipChart = deproxy(chart);
            expect(isTooltipVisible(tooltipChart)).toBe(true);
            const presented = Array.from(tooltipChart.container!.querySelectorAll('.ag-charts-tooltip')).filter((el) =>
                el.hasAttribute('data-presented-as-popover')
            );
            expect(presented).toHaveLength(1);
            const tooltip = getTooltipElement(tooltipChart)!;
            expect(tooltip.querySelector('.ag-charts-tooltip-heading')?.textContent).toBe('Jan  2 2024');
            const rows = Array.from(tooltip.querySelectorAll('.ag-charts-tooltip-row')).map((row) => [
                row.querySelector('.ag-charts-tooltip-label')?.textContent,
                row.querySelector('.ag-charts-tooltip-value')?.textContent,
            ]);
            expect(rows).toEqual([
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

        it("shows an aggregated bucket's drawn values: its highest high, lowest low and last close", async () => {
            const N = HIGH_VOLUME_COUNT;
            const data = Array.from({ length: N }, (_, i) => ({
                x: i,
                lo: -10 - (i % 3),
                hi: 10 + (i % 5),
                cl: (i % 10) - 5,
            }));
            const series = await createChart({
                data,
                series: [{ type: 'hlc', xKey: 'x', highKey: 'hi', lowKey: 'lo', closeKey: 'cl' }],
                axes: STRIPPED_NUMBER_AXES,
            } as AgCartesianChartOptions);
            const filter = series.aggregationManager.getFilterForRange(series.axes.x.scale.range[1]);
            expect(filter, 'aggregation is active').toBeDefined();

            const { maxRange, midpointIndices } = filter;
            const bucket = Math.floor(maxRange / 2);
            const members = data.filter(
                ({ x }) => Math.min(Math.floor((x / (N - 1)) * maxRange), maxRange - 1) === bucket
            );
            expect(members.length, 'the bucket aggregates several datums').toBeGreaterThan(1);

            const content = series.getTooltipContent(midpointIndices[bucket], undefined);
            expect(content.data.map(({ value }: any) => value)).toEqual([
                String(Math.max(...members.map((m) => m.hi))),
                String(Math.min(...members.map((m) => m.lo))),
                String(members.at(-1)!.cl),
            ]);
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

        it('selects the whole datum when one of its markers is clicked', async () => {
            const series = await createChart({
                ...withSeries({ marker: { enabled: true } }),
                selection: { enabled: true },
            });
            const nodeData = series.getNodeData();
            const closeNode = nodeData.find((d: any) => d.datumIndex === 2 && d.itemType === 'close');
            const { canvasX, canvasY } = canvasPointOf(series, closeNode);
            await clickAction(canvasX, canvasY)(chart);
            await waitForChartStability(chart);

            expect([...chart.getSelection()]).toHaveLength(1);
            const stateOf = (node: any) => series.getSelectionStateString(node.datumIndex);
            const selected = nodeData.filter((d: any) => d.datumIndex === 2);
            expect(selected.map((d: any) => d.itemType)).toEqual(['high', 'low', 'close']);
            expect(selected.map(stateOf)).toEqual(['selected-item', 'selected-item', 'selected-item']);
            const others = nodeData.filter((d: any) => d.datumIndex !== 2);
            expect(others).toHaveLength((DATA.length - 1) * 3);
            expect(new Set(others.map(stateOf))).toEqual(new Set(['unselected-item']));
            await compare();
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
            const series = await createChart(withSeries({ styler, item: { close: { marker: { enabled: true } } } }));
            expect(styler.mock.calls[0]).toMatchSnapshot();
            await compare();
            const stateOf = ([params]: [AgHlcSeriesStylerParams<Datum, unknown>]) => params.highlightState;
            const renderStates = styler.mock.calls.map(stateOf);
            expect(renderStates).toEqual(['none']);

            styler.mockClear();
            const closeNode = series.getNodeData().find((d: any) => d.datumIndex === 4 && d.itemType === 'close');
            const { canvasX, canvasY } = canvasPointOf(series, closeNode);
            await hoverAction(canvasX, canvasY)(chart);
            await waitForChartStability(chart);
            const hoverStates = styler.mock.calls.map(stateOf);
            expect(hoverStates).toContain('highlighted-item');
            expect(new Set(hoverStates).size, 'once per distinct highlight state').toBe(hoverStates.length);
        });
    });

    describe('keyboard focus', () => {
        const ROWS = 2000;
        const windowed = (): AgCartesianChartOptions => ({
            data: Array.from({ length: ROWS }, (_, i) => ({
                date: new Date(Date.UTC(2020, 0, 1) + i * 86_400_000),
                high: 110 + (i % 7),
                low: 100 + (i % 5),
                close: 102 + (i % 9),
            })),
            series: [{ type: 'hlc', xKey: 'date', highKey: 'high', lowKey: 'low', closeKey: 'close' }],
            zoom: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0, end: 0.006 } } },
        });

        const focusedDatumIndex = () => deproxy(chart).ctx.highlightManager.getActiveHighlight()?.datumIndex;

        it('moves focus between datums with the arrow keys', async () => {
            const series = await createChart(HLC_OPTIONS);
            await tabIntoChart(chart);
            await pressKey(chart, 'ArrowRight');
            await pressKey(chart, 'ArrowRight');
            expect(focusedDatumIndex()).toBe(2);
            const closeNode = series.getNodeData().find((d: any) => d.datumIndex === 2 && d.itemType === 'close');
            expect(focusIndicatorContainsCanvasPoint(chart, canvasPointOf(series, closeNode))).toBe(true);
        });

        it('keeps moving focus after the focused datum is panned out of view', async () => {
            const series = await createChart(windowed());
            await tabIntoChart(chart);
            await pressKey(chart, 'ArrowRight');
            expect(focusedDatumIndex()).toBe(1);

            await dragAction({ x: 600, y: 300 }, { x: 100, y: 300 })(chart);
            await waitForChartStability(chart);
            const nodeIndices = () => new Set(series.getNodeData().map((d: any) => d.datumIndex));
            expect(nodeIndices().has(2), 'datum 2 is outside the node data').toBe(false);

            await pressKey(chart, 'ArrowRight');
            expect(focusedDatumIndex()).toBe(2);
        });
    });

    describe('mixed chart', () => {
        const MIXED_OPTIONS: AgCartesianChartOptions = {
            data: DATA.map((d) => ({ ...d, volume: d.high - d.low, mean: (d.high + d.low) / 2 })),
            tooltip: { mode: 'shared' },
            legend: { enabled: true },
            series: [
                { type: 'hlc', xKey: 'date', highKey: 'high', lowKey: 'low', closeKey: 'close', yName: 'HLC' },
                { type: 'line', xKey: 'date', yKey: 'mean', yName: 'Mean' },
                { type: 'bar', xKey: 'date', yKey: 'volume', yName: 'Range' },
            ],
        };

        it('lists one legend entry per series and shows one hlc section in the shared tooltip', async () => {
            const series = await createChart(MIXED_OPTIONS);
            const legendIds = getLegendModule(deproxy(chart))
                .itemSelection.nodes()
                .map((node) => node.datum?.id);
            expect(legendIds).toHaveLength(MIXED_OPTIONS.series!.length);
            expect(legendIds.filter((id) => id === series.id)).toHaveLength(1);

            const closeNode = series.getNodeData().find((d: any) => d.datumIndex === 3 && d.itemType === 'close');
            const { canvasX, canvasY } = canvasPointOf(series, closeNode);
            await hoverAction(canvasX, canvasY)(chart);
            await waitForChartStability(chart);

            const tooltip = getTooltipElement(deproxy(chart))!;
            expect(isTooltipVisible(deproxy(chart))).toBe(true);
            const titles = Array.from(tooltip.querySelectorAll('.ag-charts-tooltip-title')).map((el) => el.textContent);
            expect(titles.filter((title) => title === 'HLC')).toHaveLength(1);
            const labels = Array.from(tooltip.querySelectorAll('.ag-charts-tooltip-label')).map((el) => el.textContent);
            for (const label of ['high', 'low', 'close']) {
                expect(labels.filter((text) => text === label)).toHaveLength(1);
            }
            await compare();
        });
    });

    describe('navigator and zoom', () => {
        it('draws an hlc mini chart in the navigator', async () => {
            await createChart({
                ...HLC_OPTIONS,
                theme: UP_DOWN_THEME,
                navigator: { enabled: true, miniChart: { enabled: true } },
            });
            const { miniChart } = deproxy(chart).modulesManager.getModule<any>('navigator');
            expect(miniChart.series.filter((s: any) => s.options.type === 'hlc')).toHaveLength(1);
            expect(miniChart.series).toHaveLength(1);
            await compare();
        });

        it('keeps the bands and close line aligned when zoomed', async () => {
            await createChart({
                ...HLC_OPTIONS,
                theme: UP_DOWN_THEME,
                zoom: { enabled: true },
                initialState: { zoom: { ratioX: { start: 0.3, end: 0.7 } } },
            });
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

        it('clamps the band edge to the high-low range at an out-of-range close', async () => {
            const series = await createChart({
                ...HLC_OPTIONS,
                data: DATA.map((d, i) => {
                    if (i === 5) return { ...d, close: 130 };
                    return i === 6 ? { ...d, close: 90 } : d;
                }),
            });
            const edge = series.contextNodeData.bandEdgeData.map((span: any) => [span.yValue0, span.yValue1]);
            // Datum 5 has high 118 and datum 6 has low 107; the spans either side of each end on the clamped value.
            expect(edge[4][1]).toBe(118);
            expect(edge[5][0]).toBe(118);
            expect(edge[5][1]).toBe(107);
            expect(edge[6][0]).toBe(107);
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

            // Bucket x values the way the aggregation is specified: an even split of the x domain [0, N - 1].
            const { maxRange, midpointIndices } = filter;
            const lastDatumOfBucket = new Map<number, number>();
            for (const [datumIndex, { x }] of data.entries()) {
                const bucket = Math.min(Math.floor((x / (N - 1)) * maxRange), maxRange - 1);
                lastDatumOfBucket.set(bucket, datumIndex);
            }
            expect(lastDatumOfBucket.size).toBeGreaterThan(1);
            expect(closeNodes).toHaveLength(lastDatumOfBucket.size);

            for (const [bucket, lastDatumIndex] of lastDatumOfBucket) {
                expect(midpointIndices[bucket], `bucket ${bucket} is populated`).not.toBe(AGGREGATION_INDEX_UNSET);
                const node = closeNodes.find((d: any) => d.datumIndex === midpointIndices[bucket]);
                expect(node, `bucket ${bucket} has a close node`).toBeDefined();
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

    describe('data update animation', () => {
        const frames = spyOnAnimationFrames();
        const appended = (close: number): AgChartOptions =>
            prepareEnterpriseTestOptions({
                ...HLC_OPTIONS,
                data: [...DATA, { date: new Date(2024, 0, 11), high: 112, low: 105, close }],
            });

        it('keeps both bands between the high and low lines while a datum with an out-of-range close arrives', async () => {
            const options = prepareEnterpriseTestOptions(HLC_OPTIONS);
            chart = AgCharts.create(options);
            const { trajectory } = await frames.captureSnap(chart, createSceneGeometrySampler(chart), () =>
                chart.update(appended(130))
            );

            const path = (key: string) => trajectory.map((frame) => frame.get(`series[0]/path[${key}]`)!);
            const upperFill = path('fill');
            const highStroke = path('stroke');
            const lowerFill = path('fill#2');
            const lowStroke = path('stroke#2');
            expectProgresses(highStroke.map((p) => p.y));

            for (const i of trajectory.keys()) {
                expect(upperFill[i].y, `upper band top at frame ${i}`).toBeGreaterThanOrEqual(highStroke[i].y - 0.01);
                expect(lowerFill[i].y + lowerFill[i].height, `lower band bottom at frame ${i}`).toBeLessThanOrEqual(
                    lowStroke[i].y + lowStroke[i].height + 0.01
                );
            }
        });

        it('settles at a static render when an out-of-range close arrives', async () => {
            const before = prepareEnterpriseTestOptions(HLC_OPTIONS);
            chart = AgCharts.create(before);
            await expectAnimatedEndpointsMatchStatic(frames, () => ctx.snapshot(), chart, before, appended(130));
        });
    });
});
