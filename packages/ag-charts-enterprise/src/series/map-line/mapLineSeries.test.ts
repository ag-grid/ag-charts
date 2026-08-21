import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    AgCartesianChartOptions,
    AgChartOptions,
    AgPolarChartOptions,
    InteractionRange,
} from 'ag-charts-community';
import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import {
    type Chart,
    MIN_TOOLTIP_HIDE_DELAY,
    assertTooltipPresentForAll,
    clickAction,
    compareImageSnapshot,
    deproxy,
    expectPixelIdenticalAcrossUpdate,
    expectWarningMessages,
    expectWarningsCalls,
    hoverAction,
    resetMockConsole,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart, prepareEnterpriseTestOptions } from '../../test/utils';
import { ukRoadData } from '../map-test/ukRoadData';
import ukRoadTopology from '../map-test/ukRoadTopology.json';
import type { MapLineSeries } from './mapLineSeries';

const SIMPLIFIED_EXAMPLE: AgChartOptions = {
    data: ukRoadData,
    topology: ukRoadTopology,
    series: [
        {
            type: 'map-line',
            idKey: 'name',
        },
    ],
};

const HEATMAP_EXAMPLE: AgChartOptions = {
    ...SIMPLIFIED_EXAMPLE,
    series: [
        {
            type: 'map-line',
            idKey: 'name',
            colorKey: 'dailyVehicles',
        },
    ],
};

const VARIABLE_STROKE_EXAMPLE: AgChartOptions = {
    ...SIMPLIFIED_EXAMPLE,
    series: [
        {
            type: 'map-line',
            idKey: 'name',
            sizeKey: 'dailyVehicles',
        },
    ],
};

describe('MapLineSeries', () => {
    setupMockConsole();
    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    describe('Simple Chart', () => {
        it('should render a simple chart', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });
    });

    describe('Series Highlighting', () => {
        it.each([0, 1, 2, 3])('should render a highlight at index %i', async (i: number) => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const seriesImpl = chart.series[0] as MapLineSeries;
            const node = seriesImpl?.['contextNodeData']?.nodeData[i];

            const highlightManager = (chart as Chart).ctx.highlightManager;
            highlightManager.updateHighlight(chart.id, node);
            await compare();
        });
    });

    describe('Heatmap', () => {
        it('should render a simple chart', async () => {
            const options: AgChartOptions = { ...HEATMAP_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });
    });

    describe('Missing color values', () => {
        it('AG-17195 should not warn when colorKey resolves to null/undefined/missing', async () => {
            const data = ukRoadData.map((datum, idx) => {
                if (idx === 0) return { ...datum, dailyVehicles: null };
                if (idx === 1) return { ...datum, dailyVehicles: undefined };
                if (idx === 2) return { name: datum.name };
                return datum;
            });
            const options: AgChartOptions = {
                data,
                topology: ukRoadTopology,
                series: [
                    {
                        type: 'map-line',
                        idKey: 'name',
                        colorKey: 'dailyVehicles',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expectWarningsCalls().toEqual([]);
        });

        it('renders lines without color values with default styling and keeps tooltips', async () => {
            const missingRoads = new Set(['M3', 'M5']);
            const data = ukRoadData.map((datum) => (missingRoads.has(datum.name) ? { name: datum.name } : datum));
            const options: AgChartOptions = {
                data,
                topology: ukRoadTopology,
                series: [
                    {
                        type: 'map-line',
                        idKey: 'name',
                        colorKey: 'dailyVehicles',
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // The line geometry still exists, so it renders with the default series stroke and stays
            // queryable for tooltips, with the colour row omitted.
            const seriesImpl = chart.series[0] as MapLineSeries;
            assertTooltipPresentForAll(
                seriesImpl,
                data,
                (datum) => missingRoads.has(datum.name),
                (i) => i
            );

            await compare();
        });
    });

    describe('Variable Stroke', () => {
        it('should render a simple chart', async () => {
            const options: AgChartOptions = { ...VARIABLE_STROKE_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });
    });

    describe('colorScale', () => {
        it('should render with continuous colorScale', async () => {
            const options: AgChartOptions = {
                ...HEATMAP_EXAMPLE,
                series: [
                    {
                        type: 'map-line',
                        idKey: 'name',
                        colorKey: 'dailyVehicles',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should render with discrete colorScale', async () => {
            const options: AgChartOptions = {
                ...HEATMAP_EXAMPLE,
                series: [
                    {
                        type: 'map-line',
                        idKey: 'name',
                        colorKey: 'dailyVehicles',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                            mode: 'discrete' as const,
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should render with explicit domain colorScale', async () => {
            const options: AgChartOptions = {
                ...HEATMAP_EXAMPLE,
                series: [
                    {
                        type: 'map-line',
                        idKey: 'name',
                        colorKey: 'dailyVehicles',
                        colorScale: {
                            fills: [{ color: 'green' }, { color: 'white' }, { color: 'purple' }],
                            domain: [0, 200_000] as [number, number],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should render with discrete named stops colorScale', async () => {
            const options: AgChartOptions = {
                ...HEATMAP_EXAMPLE,
                series: [
                    {
                        type: 'map-line',
                        idKey: 'name',
                        colorKey: 'dailyVehicles',
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 50_000, name: 'Low' },
                                { color: 'yellow', stop: 100_000, name: 'Medium' },
                                { color: 'red', name: 'High' },
                            ],
                            mode: 'discrete' as const,
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should stroke missing colorValue with colorScale.missingDataFill', async () => {
            const dataWithMissing = ukRoadData.map((datum: any, i: number) => {
                if (i % 3 !== 0) return datum;
                const rest = { ...datum };
                delete rest.dailyVehicles;
                return rest;
            });
            const options: AgChartOptions = {
                data: dataWithMissing,
                topology: ukRoadTopology,
                series: [
                    {
                        type: 'map-line',
                        idKey: 'name',
                        colorKey: 'dailyVehicles',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                            missingDataFill: '#cccccc',
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();

            // With `missingDataFill` configured, the line is rendered, so the tooltip stays
            // queryable for the missing-colour datum (with the colour row omitted).
            const seriesImpl = chart.series[0] as MapLineSeries;
            assertTooltipPresentForAll(
                seriesImpl,
                dataWithMissing,
                (d: any) => d.dailyVehicles == null,
                (i) => i
            );
        });
    });

    describe('legend', () => {
        it('should render gradient legend with colorKey', async () => {
            const options: AgChartOptions = {
                ...HEATMAP_EXAMPLE,
                gradientLegend: { enabled: true },
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should render category legend with discrete colorScale', async () => {
            const options: AgChartOptions = {
                ...HEATMAP_EXAMPLE,
                series: [
                    {
                        type: 'map-line',
                        idKey: 'name',
                        colorKey: 'dailyVehicles',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                            mode: 'discrete' as const,
                        },
                    },
                ],
                legend: { enabled: true },
                gradientLegend: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should render category legend with named discrete stops', async () => {
            const options: AgChartOptions = {
                ...HEATMAP_EXAMPLE,
                series: [
                    {
                        type: 'map-line',
                        idKey: 'name',
                        colorKey: 'dailyVehicles',
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 50_000, name: 'Low' },
                                { color: 'yellow', stop: 100_000, name: 'Medium' },
                                { color: 'red', name: 'High' },
                            ],
                            mode: 'discrete' as const,
                        },
                    },
                ],
                legend: { enabled: true },
                gradientLegend: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should render gradient legend with continuous named stops', async () => {
            const options: AgChartOptions = {
                ...HEATMAP_EXAMPLE,
                series: [
                    {
                        type: 'map-line',
                        idKey: 'name',
                        colorKey: 'dailyVehicles',
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 50_000, name: 'Low' },
                                { color: 'yellow', stop: 100_000, name: 'Medium' },
                                { color: 'red', name: 'High' },
                            ],
                        },
                    },
                ],
                gradientLegend: { enabled: true },
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });
    });

    describe('Legend Toggling', () => {
        it('should not warn when toggling legend item', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            resetMockConsole();

            const series = chart.series[0];
            series.toggleSeriesItem(false, 'category', series.id, undefined);
            await waitForChartStability(chart);

            expectWarningMessages([]);
        });
    });

    const testPointerEvents = (testParams: {
        seriesOptions: any;
        chartOptions?: any;
        getNodeData: (series: any) => any[];
        getNodePoint: (nodeItem: any) => [number, number];
        getDatumValues: (datum: any, series: any) => any[];
        getTooltipRenderedValues: (tooltipRendererParams: any) => any[];
        getHighlightNode: (chart: any, series: any) => any;
    }) => {
        const format = (...values: any[]) => values.join(': ');

        const createChart = async (params: {
            hasTooltip: boolean;
            onNodeClick?: () => void;
            nodeClickRange?: InteractionRange;
        }): Promise<any> => {
            const tooltip = params.hasTooltip
                ? {
                      renderer(rParams: any) {
                          const values = testParams.getTooltipRenderedValues(rParams);
                          return format(...values);
                      },
                  }
                : { enabled: false };

            const listeners = params.onNodeClick ? { seriesNodeClick: params.onNodeClick } : undefined;
            const nodeClickRangeParams = params.nodeClickRange ? { nodeClickRange: params.nodeClickRange } : {};
            const options: AgCartesianChartOptions | AgPolarChartOptions = {
                container: document.body,
                series: [
                    {
                        tooltip,
                        highlight: {
                            highlightedItem: {
                                stroke: 'lime',
                            },
                        },
                        listeners,
                        ...nodeClickRangeParams,
                        ...testParams.seriesOptions,
                    },
                ],
                ...(testParams.chartOptions ?? {}),
            };
            prepareEnterpriseTestOptions(options);
            const newChart = deproxy(AgCharts.create(options));
            await waitForChartStability(newChart);
            return newChart;
        };

        const hoverChartNodes = async (
            chartInstance: any,
            iterator: (params: { series: any; item: any; x: number; y: number }) => Promise<void> | void
        ) => {
            for (const series of chartInstance.series) {
                const nodeData = testParams.getNodeData(series);
                expect(nodeData.length).toBeGreaterThan(0);
                for (const item of nodeData) {
                    const itemPoint = testParams.getNodePoint(item);
                    const { canvasX: x, canvasY: y } = _ModuleSupport.Transformable.toCanvasPoint(
                        series.contentGroup,
                        itemPoint[0],
                        itemPoint[1]
                    );
                    await hoverAction(x, y)(chartInstance);
                    await waitForChartStability(chartInstance);
                    await iterator({ series, item, x, y });
                }
            }
        };

        const checkHighlight = async (chartInstance: any) => {
            await hoverChartNodes(chartInstance, ({ series }) => {
                const highlightNode = testParams.getHighlightNode(chartInstance, series);
                expect(highlightNode).toBeDefined();
                expect(highlightNode.stroke).toEqual('lime');
            });
        };

        const checkNodeClick = async (
            chartInstance: Chart,
            onNodeClick: () => void,
            offset?: { x: number; y: number }
        ) => {
            await hoverChartNodes(chartInstance, async ({ x, y }) => {
                await clickAction(x + (offset?.x ?? 0), y + (offset?.y ?? 0))(chartInstance);
                await waitForChartStability(chartInstance);
            });

            const nodeCount = chartInstance.series.reduce(
                (sum, series) => sum + testParams.getNodeData(series).length,
                0
            );
            expect(onNodeClick).toHaveBeenCalledTimes(nodeCount);
        };

        it(`should render tooltip correctly`, async () => {
            chart = await createChart({ hasTooltip: true });
            await hoverChartNodes(chart, ({ series, item }) => {
                const tooltip = document.querySelector('.ag-charts-tooltip');
                expect(tooltip).toBeInstanceOf(HTMLElement);
                expect(!tooltip?.hasAttribute('data-presented-as-popover')).toBe(false);

                const values = testParams.getDatumValues(item, series);
                expect(tooltip?.textContent).toEqual(format(...values));
            });

            await hoverAction(8, 8)(chart);
            await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
            const tooltip = document.querySelector('.ag-charts-tooltip');
            expect(!tooltip?.hasAttribute('data-presented-as-popover')).toBe(true);
        });

        it(`should highlight hovered items`, async () => {
            chart = await createChart({ hasTooltip: true });
            await checkHighlight(chart);
        });

        it(`should handle nodeClick event`, async () => {
            const onNodeClick = vi.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick });
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should highlight hovered items when tooltip is disabled`, async () => {
            chart = await createChart({ hasTooltip: false });
            await checkHighlight(chart);
        });

        it(`should handle nodeClick event when tooltip is disabled`, async () => {
            const onNodeClick = vi.fn();
            chart = await createChart({ hasTooltip: false, onNodeClick });
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should handle nodeClick event with offset click when range is 'nearest'`, async () => {
            const onNodeClick = vi.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick, nodeClickRange: 'nearest' });
            await checkNodeClick(chart, onNodeClick, { x: 5, y: 5 });
        });

        it(`should handle nodeClick event with offset click when range is within pixel distance`, async () => {
            const onNodeClick = vi.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick, nodeClickRange: 6 });
            await checkNodeClick(chart, onNodeClick, { x: 0, y: 5 });
        });
    };

    describe(`Map Line Series Pointer Events`, () => {
        testPointerEvents({
            seriesOptions: {
                type: 'map-line',
                idKey: 'name',
            },
            chartOptions: {
                data: SIMPLIFIED_EXAMPLE.data,
                topology: SIMPLIFIED_EXAMPLE.topology,
            },
            getNodeData: (series) => series.contextNodeData?.nodeData ?? [],
            getNodePoint: (item) => {
                const { x, y } = item.series.datumMidPoint(item);
                return [x, y];
            },
            getDatumValues: (item, series) => [item.datum[series.properties.idKey]],
            getTooltipRenderedValues: ({ datum, idKey }) => [datum[idKey]],
            getHighlightNode: (_, series) => series.highlightNodeGroup.children().next().value,
        });
    });

    describe('AG-17481 size scaling (AC12)', () => {
        const sizeRange = async (seriesOverrides: object): Promise<[number, number]> => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                series: [{ type: 'map-line', idKey: 'name', sizeKey: 'dailyVehicles', ...seriesOverrides }],
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            return chart.series[0].sizeScale.range;
        };

        it('uses minStrokeWidth as the lower bound when sizeKey is present', async () => {
            expect(await sizeRange({ minStrokeWidth: 2, maxStrokeWidth: 8 })).toEqual([2, 8]);
        });

        it('defaults minStrokeWidth to strokeWidth when not set', async () => {
            // strokeWidth theme default 1, maxStrokeWidth theme default 3.
            expect(await sizeRange({})).toEqual([1, 3]);
            expect(await sizeRange({ strokeWidth: 2 })).toEqual([2, 3]);
        });

        it('warns and reverts to theme defaults when both bounds are inverted', async () => {
            expect(await sizeRange({ minStrokeWidth: 8, maxStrokeWidth: 2 })).toEqual([1, 3]);
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - series[0].minStrokeWidth (8) cannot be greater than maxStrokeWidth (2), ignoring both.",
                ],
              ]
            `);
        });

        it('renders the range midpoint, not NaN, when the size domain collapses to a single value', async () => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                series: [
                    // A zero-width sizeDomain collapses the scale domain.
                    {
                        type: 'map-line',
                        idKey: 'name',
                        sizeKey: 'dailyVehicles',
                        sizeDomain: [5, 5],
                        minStrokeWidth: 10,
                        maxStrokeWidth: 30,
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const strokeWidths: number[] = chart.series[0].contextNodeData?.nodeData.map(
                (d: any) => d.style?.strokeWidth
            );
            expect(strokeWidths.length).toBeGreaterThan(0);
            // Zero-width domains resolve to the range midpoint (10 + 30) / 2, never NaN/Infinity.
            expect([...new Set(strokeWidths)]).toEqual([20]);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });

        it('rejects a sizeDomain that is not a 2-element array and falls back to the data domain', async () => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                series: [
                    {
                        type: 'map-line',
                        idKey: 'name',
                        sizeKey: 'dailyVehicles',
                        // Deliberately malformed: a 1-element array is not a valid sizeDomain.
                        sizeDomain: [5],
                        minStrokeWidth: 10,
                        maxStrokeWidth: 30,
                    } as never,
                ],
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const strokeWidths: number[] = chart.series[0].contextNodeData?.nodeData.map(
                (d: any) => d.style?.strokeWidth
            );
            expect(strokeWidths.length).toBeGreaterThan(0);
            // The malformed sizeDomain is dropped, so widths resolve from the data domain within
            // [minStrokeWidth, maxStrokeWidth] = [10, 30], never NaN.
            expect(strokeWidths.every((width) => width >= 10 && width <= 30)).toBe(true);
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - Option \`series[0].sizeDomain\` cannot be set to \`[5]\`; expecting a number or bigint greater than or equal to 0 array and an array of exactly 2 items, ignoring.",
                ],
              ]
            `);
        });
    });
    describe('bigint size domain (AG-16608)', () => {
        it('renders a bigint sizeDomain identically to numbers', async () => {
            const buildOptions = (sizeDomain: [number, number] | [bigint, bigint]): AgChartOptions => ({
                ...VARIABLE_STROKE_EXAMPLE,
                series: [{ ...VARIABLE_STROKE_EXAMPLE.series![0], sizeDomain } as never],
            });

            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createEnterpriseChart,
                buildOptions([0, 200_000]),
                buildOptions([0n, 200_000n])
            );
        });
    });
});
