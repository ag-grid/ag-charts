import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    AgCartesianChartOptions,
    AgChartOptions,
    AgMapShapeSeriesOptions,
    AgPolarChartOptions,
    InteractionRange,
} from 'ag-charts-community';
import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import {
    type Chart,
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_TOOLTIP_HIDE_DELAY,
    clickAction,
    compareImageSnapshot,
    deproxy,
    expectWarningMessages,
    expectWarningsCalls,
    hoverAction,
    resetMockConsole,
    setupMockCanvas,
    setupMockConsole,
    testLegendItemName,
    waitForChartStability,
} from 'ag-charts-community-test';
import { ambientLogger } from 'ag-charts-core';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import { ukData } from '../map-test/ukData';
import ukTopology from '../map-test/ukTopology.json';
import { usData } from '../map-test/usData';
import usTopology from '../map-test/usTopology.json';
import type { MapShapeSeries } from './mapShapeSeries';

const SIMPLIFIED_EXAMPLE: AgChartOptions = {
    data: ukData,
    topology: ukTopology,
    series: [
        {
            type: 'map-shape',
            idKey: 'name',
        },
    ],
};

const HEATMAP_EXAMPLE: AgChartOptions = {
    ...SIMPLIFIED_EXAMPLE,
    series: [
        {
            type: 'map-shape',
            idKey: 'name',
            colorKey: 'population',
        },
    ],
};

describe('MapShapeSeries', () => {
    setupMockConsole();
    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async (options?: MatchImageSnapshotOptions) => {
        await compareImageSnapshot(chart, ctx, { ...IMAGE_SNAPSHOT_DEFAULTS, ...options });
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

            const seriesImpl = chart.series[0] as MapShapeSeries;
            const node = seriesImpl?.['contextNodeData']?.nodeData[i];

            const highlightManager = (chart as Chart).ctx.highlightManager;
            highlightManager.updateHighlight(chart.id, node);
            await compare({
                failureThreshold: 1,
            });
        });
    });

    describe('Bring to front on highlight', () => {
        const hoverFirstShape = async (series: any) => {
            const [datum] = series.contextNodeData?.nodeData ?? [];
            expect(datum).toBeDefined();
            const midPoint = series.datumMidPoint(datum);
            const { x, y } = _ModuleSupport.Transformable.toCanvasPoint(series.contentGroup, midPoint.x, midPoint.y);
            await hoverAction(x, y)(chart);
            await waitForChartStability(chart);
        };

        // Hovering raises the shape into the highlight overlay so it draws above overlapping series; a
        // highlight-disabled series must leave the overlay empty. The enabled case (raises) guards the
        // disabled case (does not) from passing vacuously.
        it.each([
            { enabled: true, raisedShapes: 1 },
            { enabled: false, raisedShapes: 0 },
        ])('raises the hovered shape only when highlight.enabled is $enabled', async ({ enabled, raisedShapes }) => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                series: [{ type: 'map-shape', idKey: 'name', highlight: { enabled } }],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const seriesImpl = chart.series[0] as MapShapeSeries;
            await hoverFirstShape(seriesImpl);

            // The hover-update optimisation skips re-rendering a highlight-disabled series, so drive the
            // render directly to populate the overlay — the overlay must stay empty regardless of what
            // re-renders the series while it holds the active highlight.
            seriesImpl.update();
            await waitForChartStability(chart);

            expect(Array.from(seriesImpl.highlightNodeGroup.children())).toHaveLength(raisedShapes);
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
        it('renders only data with color and suppresses tooltips', async () => {
            const missingStates = new Set(['California', 'Colorado']);
            const data = usData.map((datum) =>
                missingStates.has(datum.name) ? { name: datum.name, code: datum.code } : datum
            );
            const options: AgChartOptions = {
                data,
                topology: usTopology,
                series: [
                    {
                        type: 'map-shape',
                        idKey: 'name',
                        colorKey: 'gdp',
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const seriesImpl = chart.series[0] as MapShapeSeries;
            const nodeIds = seriesImpl?.['contextNodeData']?.nodeData?.map((datum) => datum.idValue) ?? [];
            expect(nodeIds).not.toContain('California');
            expect(nodeIds).not.toContain('Colorado');
            expect(nodeIds).toHaveLength(data.length - missingStates.size);

            const missingIndex = data.findIndex((datum) => datum.name === 'California');
            expect(seriesImpl.getTooltipContent(missingIndex)).toBeUndefined();

            await compare({
                failureThreshold: 1,
            });
        });
    });

    describe('Labels', () => {
        it.each([12, 18, 24])('should render short labels at font size %s', async (fontSize) => {
            const options: AgChartOptions = {
                data: usData,
                topology: usTopology,
                series: [
                    {
                        type: 'map-shape',
                        idKey: 'name',
                        labelKey: 'code',
                        label: {
                            fontSize,
                        },
                    },
                ],
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            await compare({
                failureThreshold: 1,
            });
        });

        it.each([8, 12, 16])('should render long labels at font size %s', async (fontSize) => {
            const options: AgChartOptions = {
                data: usData,
                topology: usTopology,
                series: [
                    {
                        type: 'map-shape',
                        idKey: 'name',
                        labelKey: 'name',
                        label: {
                            fontSize,
                        },
                    },
                ],
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            await compare({
                failureThreshold: 1,
            });
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
                                fill: 'lime',
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
                    const { x, y } = _ModuleSupport.Transformable.toCanvasPoint(
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
                // Check the highlighted marker
                const highlightNode = testParams.getHighlightNode(chartInstance, series);
                expect(highlightNode).toBeDefined();
                expect(highlightNode.fill).toEqual('lime');
            });
        };

        const checkNodeClick = async (
            chartInstance: Chart,
            onNodeClick: () => void,
            offset?: { x: number; y: number }
        ) => {
            await hoverChartNodes(chartInstance, async ({ x, y }) => {
                // Perform click
                await clickAction(x + (offset?.x ?? 0), y + (offset?.y ?? 0))(chartInstance);
                await waitForChartStability(chartInstance);
            });

            // Check click handler
            const nodeCount = chartInstance.series.reduce(
                (sum, series) => sum + testParams.getNodeData(series).length,
                0
            );
            expect(onNodeClick).toHaveBeenCalledTimes(nodeCount);
        };

        it(`should render tooltip correctly`, async () => {
            chart = await createChart({ hasTooltip: true });
            await hoverChartNodes(chart, ({ series, item }) => {
                // Check the tooltip is shown
                const tooltip = document.querySelector('.ag-charts-tooltip');
                expect(tooltip).toBeInstanceOf(HTMLElement);
                expect(!tooltip?.hasAttribute('data-presented-as-popover')).toBe(false);

                // Check the tooltip text
                const values = testParams.getDatumValues(item, series);
                expect(tooltip?.textContent).toEqual(format(...values));
            });

            // Check the tooltip is hidden (hover over top-left corner)
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

    describe(`Map Shape Series Pointer Events`, () => {
        testPointerEvents({
            seriesOptions: {
                type: 'map-shape',
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

    describe('AG-16858 legendItemName', () => {
        testLegendItemName({
            create: (o) => (chart = AgCharts.create(prepareEnterpriseTestOptions(o))),
            compare,
            chartOptions: {
                topology: ukTopology,
                legend: { enabled: true },
                series: [
                    { type: 'map-shape', idKey: 'name', data: [{ name: 'England' }] },
                    { type: 'map-shape', idKey: 'name', data: [{ name: 'Scotland' }] },
                    { type: 'map-shape', idKey: 'name', data: [{ name: 'Wales' }] },
                ],
            },
        });
    });

    describe('AG-16858 shared legend highlight', () => {
        it('should highlight series with matching legendItemName on legend hover', async () => {
            const options: AgChartOptions = {
                topology: ukTopology,
                series: [
                    { type: 'map-shape', idKey: 'name', data: [{ name: 'England' }], legendItemName: 'Group A' },
                    { type: 'map-shape', idKey: 'name', data: [{ name: 'Scotland' }], legendItemName: 'Group A' },
                    { type: 'map-shape', idKey: 'name', data: [{ name: 'Wales' }], legendItemName: 'Group B' },
                ],
            };
            prepareEnterpriseTestOptions(options);
            resetMockConsole();
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            expectWarningMessages([
                `AG Charts - legend item 'Group A' has multiple fill colours, this may cause unexpected behaviour.`,
            ]);

            const series0 = (chart as Chart).series[0];
            const highlightManager = (chart as Chart).ctx.highlightManager;
            highlightManager.updateHighlight(chart.id, {
                series: series0,
                itemId: series0.id,
                datum: undefined,
                datumIndex: Number.NaN,
                legendItemName: 'Group A',
            });

            const activeHighlight = highlightManager.getActiveHighlight();
            expect((chart as Chart).series[0].isSeriesHighlighted(activeHighlight)).toBe(true);
            expect((chart as Chart).series[1].isSeriesHighlighted(activeHighlight)).toBe(true);
            expect((chart as Chart).series[2].isSeriesHighlighted(activeHighlight)).toBe(false);

            await compare();
        });
    });

    describe('colorScale', () => {
        it('should render with continuous colorScale', async () => {
            const options: AgChartOptions = {
                ...HEATMAP_EXAMPLE,
                series: [
                    {
                        ...(HEATMAP_EXAMPLE.series![0] as AgMapShapeSeriesOptions),
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
                        ...(HEATMAP_EXAMPLE.series![0] as AgMapShapeSeriesOptions),
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
                        ...(HEATMAP_EXAMPLE.series![0] as AgMapShapeSeriesOptions),
                        colorScale: {
                            fills: [{ color: 'green' }, { color: 'white' }, { color: 'purple' }],
                            domain: [0, 100_000_000] as [number, number],
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
                        ...(HEATMAP_EXAMPLE.series![0] as AgMapShapeSeriesOptions),
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 1_000_000, name: 'Low' },
                                { color: 'yellow', stop: 5_000_000, name: 'Medium' },
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

        it('AG-17195 should not warn when colorKey resolves to null/undefined/missing', async () => {
            const data = usData.map((datum, idx) => {
                if (idx === 0) return { ...datum, gdp: null };
                if (idx === 1) return { ...datum, gdp: undefined };
                if (idx === 2) return { name: datum.name, code: datum.code };
                return datum;
            });
            const options: AgChartOptions = {
                data,
                topology: usTopology,
                series: [
                    {
                        type: 'map-shape',
                        idKey: 'name',
                        colorKey: 'gdp',
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

        it('should fill missing colorValue with colorScale.missingDataFill', async () => {
            const missingStates = new Set(['California', 'Colorado']);
            const data = usData.map((datum) =>
                missingStates.has(datum.name) ? { name: datum.name, code: datum.code } : datum
            );
            const options: AgChartOptions = {
                data,
                topology: usTopology,
                series: [
                    {
                        type: 'map-shape',
                        idKey: 'name',
                        colorKey: 'gdp',
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
                        ...(HEATMAP_EXAMPLE.series![0] as AgMapShapeSeriesOptions),
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
                        ...(HEATMAP_EXAMPLE.series![0] as AgMapShapeSeriesOptions),
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 1_000_000, name: 'Low' },
                                { color: 'yellow', stop: 5_000_000, name: 'Medium' },
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
                        ...(HEATMAP_EXAMPLE.series![0] as AgMapShapeSeriesOptions),
                        colorScale: {
                            fills: [
                                { color: 'blue', stop: 1_000_000, name: 'Low' },
                                { color: 'yellow', stop: 5_000_000, name: 'Medium' },
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

    describe('gradient fill', () => {
        it('should render map shape series with a default gradient fill', async () => {
            const options: AgChartOptions = {
                data: usData,
                topology: usTopology,
                series: [
                    {
                        type: 'map-shape',
                        idKey: 'name',
                        labelKey: 'code',
                        fill: {
                            type: 'gradient',
                        },
                    },
                ],
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            await compare({
                failureThreshold: 1,
            });
        });

        it('should render map shape series with a gradient fill', async () => {
            const options: AgChartOptions = {
                data: usData,
                topology: usTopology,
                series: [
                    {
                        type: 'map-shape',
                        idKey: 'name',
                        labelKey: 'code',
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

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            await compare({
                failureThreshold: 1,
            });
        });

        it('should render map shape series with a series bound gradient fill', async () => {
            const options: AgChartOptions = {
                data: usData,
                topology: usTopology,
                series: [
                    {
                        type: 'map-shape',
                        idKey: 'name',
                        labelKey: 'code',
                        fill: {
                            type: 'gradient',
                            bounds: 'series',
                            colorStops: [
                                {
                                    color: 'green',
                                },
                                {
                                    color: 'white',
                                },
                            ],
                        },
                    } as AgMapShapeSeriesOptions,
                ],
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            await compare({
                failureThreshold: 1,
            });
        });
    });

    describe('Logger threading', () => {
        it('routes the map-shape no-topology warning through the chart-scoped logger, not the module fallback', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);
            const chartProxy = AgCharts.create(options);
            chart = deproxy(chartProxy);
            await waitForChartStability(chart);

            const scopedWarnOnce = vi.spyOn(chart.ctx.logger, 'warnOnce').mockImplementation(() => {});
            const fallbackWarnOnce = vi.spyOn(ambientLogger, 'warnOnce').mockImplementation(() => {});

            // Updating without a topology re-runs processData, whose no-topology guard emits via this.ctx.logger.
            const noTopologyOptions: AgChartOptions = {
                data: ukData,
                series: [{ type: 'map-shape', idKey: 'name' }],
            };
            prepareEnterpriseTestOptions(noTopologyOptions);
            await chartProxy.update(noTopologyOptions);
            await waitForChartStability(chart);

            expect(scopedWarnOnce).toHaveBeenCalledWith(
                'no topology was provided for [MapShapeSeries]; nothing will be rendered.'
            );
            expect(fallbackWarnOnce).not.toHaveBeenCalled();

            scopedWarnOnce.mockRestore();
            fallbackWarnOnce.mockRestore();
        });
    });
});
