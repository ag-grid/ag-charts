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
    computeLegendBBox,
    deproxy,
    expectPixelIdenticalAcrossUpdate,
    expectWarningsCalls,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart, prepareEnterpriseTestOptions } from '../../test/utils';
import { ukData } from '../map-test/ukData';
import ukTopology from '../map-test/ukTopology.json';
import type { MapMarkerSeries } from './mapMarkerSeries';

const SIMPLIFIED_EXAMPLE: AgChartOptions = {
    data: ukData,
    topology: ukTopology,
    series: [
        {
            type: 'map-shape-background',
        },
        {
            type: 'map-marker',
            idKey: 'name',
        },
    ],
};

const SIZE_EXAMPLE: AgChartOptions = {
    ...SIMPLIFIED_EXAMPLE,
    series: [
        {
            type: 'map-shape-background',
        },
        {
            type: 'map-marker',
            idKey: 'name',
            sizeKey: 'population',
        },
    ],
};

describe('MapMarkerSeries', () => {
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

            const seriesImpl = chart.series[1] as MapMarkerSeries;
            const node = seriesImpl?.['contextNodeData']?.nodeData[i];

            const highlightManager = (chart as Chart).ctx.highlightManager;
            highlightManager.updateHighlight(chart.id, node);
            await compare();
        });
    });

    // CRT-1078: Hovering a legend item in a map marker chart produces a highlight with
    // datum == null. Without the fix, getHighlightedDatum() passes this through and the
    // render cycle crashes accessing point.x on the undefined datum.
    describe('legend hover with null datum (CRT-1078)', () => {
        it('should not crash when hovering the legend item', async () => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                legend: { enabled: true },
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // Hover over the legend item — triggers a highlight with datum == null.
            // Without the fix this crashes the render cycle.
            const { x, y } = computeLegendBBox(chart);
            await hoverAction(x + 10, y + 10)(chart);
            await waitForChartStability(chart);
        });
    });

    describe('Bubble markers', () => {
        it('should render a simple chart', async () => {
            const options: AgChartOptions = { ...SIZE_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
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

    describe(`Map Marker Series Pointer Events`, () => {
        testPointerEvents({
            seriesOptions: {
                type: 'map-marker',
                idKey: 'name',
            },
            chartOptions: {
                data: SIMPLIFIED_EXAMPLE.data,
                topology: SIMPLIFIED_EXAMPLE.topology,
            },
            getNodeData: (series) => series.contextNodeData?.nodeData ?? [],
            getNodePoint: (item) => [item.midPoint.x, item.midPoint.y],
            getDatumValues: (item, series) => [item.datum[series.properties.idKey]],
            getTooltipRenderedValues: ({ datum, idKey }) => [datum[idKey]],
            getHighlightNode: (_, series) => series.highlightNodeGroup.children().next().value,
        });
    });

    describe('colorScale', () => {
        const COLOR_EXAMPLE: AgChartOptions = {
            ...SIMPLIFIED_EXAMPLE,
            series: [{ type: 'map-shape-background' }, { type: 'map-marker', idKey: 'name', colorKey: 'population' }],
        };

        it('should render with continuous colorScale', async () => {
            const options: AgChartOptions = {
                ...COLOR_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        colorKey: 'population',
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
                ...COLOR_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        colorKey: 'population',
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
                ...COLOR_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        colorKey: 'population',
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
                ...COLOR_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        colorKey: 'population',
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

        it('should fill missing colorValue with colorScale.missingDataFill', async () => {
            const missingNames = new Set(['Wales', 'Northern Ireland']);
            const data = ukData.map((datum: any) => {
                if (!missingNames.has(datum.name)) return datum;
                const rest = { ...datum };
                delete rest.population;
                return rest;
            });
            const options: AgChartOptions = {
                data,
                topology: ukTopology,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        colorKey: 'population',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                            // Deliberately contrasting colour: markers render at the theme-default
                            // fillOpacity of 0.5 against a grey map background, so a neutral grey
                            // fill would be visually indistinguishable in the snapshot.
                            missingDataFill: 'magenta',
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            await compare();

            const seriesImpl = chart.series[1] as MapMarkerSeries;
            assertTooltipPresentForAll(
                seriesImpl,
                data,
                (datum: any) => missingNames.has(datum.name),
                (i) => i
            );
        });

        it('AG-17195 should not warn when colorKey resolves to null/undefined/missing', async () => {
            const data = ukData.map((datum: any, idx: number) => {
                if (idx === 0) return { ...datum, population: null };
                if (idx === 1) return { ...datum, population: undefined };
                if (idx === 2) {
                    const rest = { ...datum };
                    delete rest.population;
                    return rest;
                }
                return datum;
            });
            const options: AgChartOptions = {
                data,
                topology: ukTopology,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        colorKey: 'population',
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

        it('should preserve colorScale fill on highlighted marker', async () => {
            const options: AgChartOptions = {
                ...COLOR_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        colorKey: 'population',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const seriesImpl = chart.series[1] as MapMarkerSeries;
            const targetNode = seriesImpl?.['contextNodeData']?.nodeData[0];
            expect(targetNode).toBeDefined();

            const highlightManager = (chart as Chart).ctx.highlightManager;
            highlightManager.updateHighlight(chart.id, targetNode);
            await compare();
        });

        it('should preserve missingDataFill on highlighted marker', async () => {
            const missingNames = new Set(['Wales', 'Northern Ireland']);
            const data = ukData.map((datum: any) => {
                if (!missingNames.has(datum.name)) return datum;
                const rest = { ...datum };
                delete rest.population;
                return rest;
            });
            const options: AgChartOptions = {
                data,
                topology: ukTopology,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        colorKey: 'population',
                        colorScale: {
                            fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
                            missingDataFill: 'magenta',
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const seriesImpl = chart.series[1] as MapMarkerSeries;
            const missingNode = seriesImpl?.['contextNodeData']?.nodeData.find((node: any) =>
                missingNames.has(node.idValue)
            );
            expect(missingNode).toBeDefined();

            const highlightManager = (chart as Chart).ctx.highlightManager;
            highlightManager.updateHighlight(chart.id, missingNode);
            await compare();
        });
    });

    describe('legend', () => {
        const COLOR_EXAMPLE: AgChartOptions = {
            ...SIMPLIFIED_EXAMPLE,
            series: [{ type: 'map-shape-background' }, { type: 'map-marker', idKey: 'name', colorKey: 'population' }],
        };

        it('should render gradient legend with colorKey', async () => {
            const options: AgChartOptions = {
                ...COLOR_EXAMPLE,
                gradientLegend: { enabled: true },
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should render category legend with discrete colorScale', async () => {
            const options: AgChartOptions = {
                ...COLOR_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        colorKey: 'population',
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
                ...COLOR_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        colorKey: 'population',
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
                ...COLOR_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        colorKey: 'population',
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
        it('should render map marker series with a default gradient fill', async () => {
            const options: AgChartOptions = {
                data: ukData,
                topology: ukTopology,
                series: [
                    {
                        type: 'map-shape-background',
                    },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        sizeKey: 'population',
                        fill: {
                            type: 'gradient',
                        },
                    },
                ],
            };

            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });
        it('should render map marker series with a gradient fill', async () => {
            const options: AgChartOptions = {
                data: ukData,
                topology: ukTopology,
                series: [
                    {
                        type: 'map-shape-background',
                    },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        sizeKey: 'population',
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
            await compare();
        });
    });

    describe('AG-17481 size scaling', () => {
        const sizeRange = async (markerOverrides: object): Promise<[number, number]> => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    { type: 'map-marker', idKey: 'name', sizeKey: 'population', ...markerOverrides },
                ],
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            return chart.series[1].sizeScale.range;
        };

        it('uses minSize as the lower bound when sizeKey is present (AC9)', async () => {
            expect(await sizeRange({ minSize: 5, maxSize: 50 })).toEqual([5, 50]);
        });

        it('defaults minSize to size when not set (AC10)', async () => {
            // size defaults to 7, maxSize theme default 30.
            expect(await sizeRange({})).toEqual([7, 30]);
            expect(await sizeRange({ size: 12 })).toEqual([12, 30]);
        });

        it('clamps the upper bound up to minSize without warning', async () => {
            expect(await sizeRange({ minSize: 40 })).toEqual([40, 40]);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });

        it('warns and reverts to theme defaults when both bounds are inverted', async () => {
            const range = await sizeRange({ minSize: 30, maxSize: 5 });
            expect(range).toEqual([7, 30]);
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - series[1].minSize (30) cannot be greater than maxSize (5), ignoring both.",
                ],
              ]
            `);
        });

        it('renders the range midpoint, not NaN, when the size domain collapses to a single value', async () => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    // A zero-width sizeDomain collapses the scale domain.
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        sizeKey: 'population',
                        sizeDomain: [5, 5],
                        minSize: 10,
                        maxSize: 30,
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const markerSizes: number[] = chart.series[1].contextNodeData?.nodeData.map((d: any) => d.point.size);
            expect(markerSizes.length).toBeGreaterThan(0);
            // Zero-width domains resolve to the range midpoint (10 + 30) / 2, never NaN/Infinity.
            expect([...new Set(markerSizes)]).toEqual([20]);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });

        it('rejects a sizeDomain that is not a 2-element array and falls back to the data domain', async () => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        sizeKey: 'population',
                        // Deliberately malformed: a 1-element array is not a valid sizeDomain.
                        sizeDomain: [5],
                        minSize: 10,
                        maxSize: 30,
                    } as never,
                ],
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const markerSizes: number[] = chart.series[1].contextNodeData?.nodeData.map((d: any) => d.point.size);
            expect(markerSizes.length).toBeGreaterThan(0);
            // The malformed sizeDomain is dropped, so sizes resolve from the data domain within
            // [minSize, maxSize] = [10, 30], never NaN.
            expect(markerSizes.every((size) => size >= 10 && size <= 30)).toBe(true);
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - Option \`series[1].sizeDomain\` cannot be set to \`[5]\`; expecting a number or bigint greater than or equal to 0 array and an array of exactly 2 items, ignoring.",
                ],
              ]
            `);
        });

        it('clamps reversed-sizeDomain out-of-domain values to minSize, not maxSize (TC2)', async () => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        idKey: 'name',
                        sizeKey: 'population',
                        // Reversed domain: larger sizeKey values map to smaller markers. Every population value
                        // exceeds the domain, so they clamp to its high end (100), which maps to minSize.
                        sizeDomain: [100, 0],
                        minSize: 10,
                        maxSize: 40,
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const markerSizes: number[] = chart.series[1].contextNodeData?.nodeData.map((d: any) => d.point.size);
            expect(markerSizes.length).toBeGreaterThan(0);
            // Directional clamp maps out-of-domain-high values to minSize (10); the non-directional
            // convert({ clamp: true }) would have mapped them to maxSize (40).
            expect([...new Set(markerSizes)]).toEqual([10]);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });

        it('ignores minSize and uses size as the fixed marker size when sizeKey is absent (AC11)', async () => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    { type: 'map-marker', idKey: 'name', size: 12, minSize: 40, maxSize: 50 },
                ],
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const markerSizes: number[] = chart.series[1].contextNodeData?.nodeData.map((d: any) => d.point.size);
            expect(markerSizes.length).toBeGreaterThan(0);
            expect([...new Set(markerSizes)]).toEqual([12]);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });
    });
    describe('default marker size', () => {
        const markerSizes = async (markerOverrides: object): Promise<number[]> => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                series: [{ type: 'map-shape-background' }, { type: 'map-marker', idKey: 'name', ...markerOverrides }],
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            return chart.series[1].contextNodeData?.nodeData.map((d: any) => d.point.size);
        };

        it('renders markers at the default size of 7 when no size is specified (AC1)', async () => {
            expect([...new Set(await markerSizes({}))]).toEqual([7]);
        });

        it('renders markers at an explicit size, overriding the default (AC3)', async () => {
            expect([...new Set(await markerSizes({ size: 12 }))]).toEqual([12]);
        });
    });

    describe('bigint size domain (AG-16608)', () => {
        it('renders a bigint sizeDomain identically to numbers', async () => {
            const buildOptions = (sizeDomain: [number, number] | [bigint, bigint]): AgChartOptions => ({
                ...SIZE_EXAMPLE,
                series: [SIZE_EXAMPLE.series![0], { ...SIZE_EXAMPLE.series![1], sizeDomain } as never],
            });

            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createEnterpriseChart,
                buildOptions([0, 60_000_000]),
                buildOptions([0n, 60_000_000n])
            );
        });
    });
});
