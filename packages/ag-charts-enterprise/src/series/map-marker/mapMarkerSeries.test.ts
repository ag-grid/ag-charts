import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    AgChartOptions,
    AgMapMarkerSeriesOptions,
    AgMapMarkerSeriesTooltipRendererParams,
    AgTopologyChartOptions,
    InteractionRange,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type ChartOrProxy,
    MIN_TOOLTIP_HIDE_DELAY,
    type SceneNodeExpectation,
    assertTooltipPresentForAll,
    clickAction,
    compareImageSnapshot,
    computeLegendBBox,
    createSceneGeometrySampler,
    deproxy,
    expectMonotonic,
    expectPixelIdenticalAcrossUpdate,
    expectProgresses,
    expectSceneTrajectory,
    expectWarningsCalls,
    getSeriesContextNodeData,
    getSeriesOptions,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Shape, Transformable } from 'ag-charts-core';
import { classCast } from 'ag-charts-test';

import {
    getEnterpriseSelectionNodes,
    getMapMarkerSeriesInstance,
    getMapMarkerSizeRange,
    getMapMarkerStyleSize,
    getSeriesGroup,
} from '../../test/enterpriseSeriesAccessors';
import { createEnterpriseChart, prepareEnterpriseTestOptions } from '../../test/utils';
import { ukData } from '../map-test/ukData';
import ukTopology from '../map-test/ukTopology.json';
import type { MapMarkerNodeDatum } from './mapMarkerSeries';

type Marker = _ModuleSupport.Marker;

type UkDatum = { name: string; population?: number | null };

// A node of the map-marker series whose datum is a row of the test data, read by key.
type UkNodeDatum = MapMarkerNodeDatum & { datum: Record<string, unknown> };

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

const SIZED_MARKER_SERIES: AgMapMarkerSeriesOptions = {
    type: 'map-marker',
    idKey: 'name',
    sizeKey: 'population',
};

const SIZE_EXAMPLE: AgChartOptions = {
    ...SIMPLIFIED_EXAMPLE,
    series: [
        {
            type: 'map-shape-background',
        },
        SIZED_MARKER_SERIES,
    ],
};

describe('MapMarkerSeries', () => {
    setupMockConsole();
    let chart: ChartOrProxy<any>;

    afterEach(() => {
        chart?.destroy();
        // `chart` is not optional in the tests, so the reset needs the cast.
        (chart as unknown) = undefined;
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    describe('Simple Chart', () => {
        it('should render a simple chart', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            chart = await createEnterpriseChart(options);
            await compare();
        });
    });

    describe('Series Highlighting', () => {
        it.each([0, 1, 2, 3])('should render a highlight at index %i', async (i: number) => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            chart = deproxy(await createEnterpriseChart(options));

            const node = getSeriesContextNodeData<UkNodeDatum>(chart, 1).nodeData[i];

            const { ctx: chartCtx, id } = deproxy(chart);
            chartCtx.highlightManager.updateHighlight(id, node);
            await compare();
        });
    });

    // Hovering a legend item produces a highlight with datum == null, which must not reach the
    // render cycle.
    describe('legend hover with null datum (CRT-1078)', () => {
        it('should not crash when hovering the legend item', async () => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                legend: { enabled: true },
            };
            chart = deproxy(await createEnterpriseChart(options));

            const { x, y } = computeLegendBBox(chart);
            await hoverAction(x + 10, y + 10)(chart);
            await waitForChartStability(chart);
        });
    });

    describe('Bubble markers', () => {
        it('should render a simple chart', async () => {
            const options: AgChartOptions = { ...SIZE_EXAMPLE };
            chart = await createEnterpriseChart(options);
            await compare();
        });
    });

    const testPointerEvents = (testParams: {
        seriesOptions: AgMapMarkerSeriesOptions;
        chartOptions?: Pick<AgTopologyChartOptions, 'data' | 'topology'>;
        getNodeData: (chartInstance: ChartOrProxy<any>, seriesIndex: number) => UkNodeDatum[];
        getNodePoint: (nodeItem: UkNodeDatum) => [number, number];
        getDatumValues: (chartInstance: ChartOrProxy<any>, seriesIndex: number, datum: UkNodeDatum) => unknown[];
        getTooltipRenderedValues: (
            tooltipRendererParams: AgMapMarkerSeriesTooltipRendererParams<UkNodeDatum['datum']>
        ) => unknown[];
        getHighlightNode: (chartInstance: ChartOrProxy<any>, seriesIndex: number) => unknown;
    }) => {
        const format = (...values: unknown[]) => values.join(': ');

        const chartOptions = (params: {
            hasTooltip: boolean;
            onNodeClick?: () => void;
            nodeClickRange?: InteractionRange;
        }): AgTopologyChartOptions => {
            const tooltip = params.hasTooltip
                ? {
                      renderer(rParams: AgMapMarkerSeriesTooltipRendererParams<UkNodeDatum['datum']>) {
                          const values = testParams.getTooltipRenderedValues(rParams);
                          return format(...values);
                      },
                  }
                : { enabled: false };

            const listeners = params.onNodeClick ? { seriesNodeClick: params.onNodeClick } : undefined;
            const nodeClickRangeParams = params.nodeClickRange == null ? {} : { nodeClickRange: params.nodeClickRange };
            const options: AgTopologyChartOptions = {
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
                ...testParams.chartOptions,
            };
            return options;
        };

        const hoverChartNodes = async (
            chartInstance: ChartOrProxy<any>,
            iterator: (params: { seriesIndex: number; item: UkNodeDatum; x: number; y: number }) => Promise<void> | void
        ) => {
            for (const [seriesIndex, series] of deproxy(chartInstance).series.entries()) {
                const nodeData = testParams.getNodeData(chartInstance, seriesIndex);
                expect(nodeData.length).toBeGreaterThan(0);
                for (const item of nodeData) {
                    const itemPoint = testParams.getNodePoint(item);
                    const { canvasX: x, canvasY: y } = Transformable.toCanvasPoint(
                        series.contentGroup,
                        itemPoint[0],
                        itemPoint[1]
                    );
                    await hoverAction(x, y)(chartInstance);
                    await waitForChartStability(chartInstance);
                    await iterator({ seriesIndex, item, x, y });
                }
            }
        };

        const checkHighlight = async (chartInstance: ChartOrProxy<any>) => {
            await hoverChartNodes(chartInstance, ({ seriesIndex }) => {
                const highlightNode = testParams.getHighlightNode(chartInstance, seriesIndex);
                expect(highlightNode).toBeDefined();
                expect(classCast(highlightNode, Shape).fill).toEqual('lime');
            });
        };

        const checkNodeClick = async (
            chartInstance: ChartOrProxy<any>,
            onNodeClick: () => void,
            offset?: { x: number; y: number }
        ) => {
            await hoverChartNodes(chartInstance, async ({ x, y }) => {
                await clickAction(x + (offset?.x ?? 0), y + (offset?.y ?? 0))(chartInstance);
                await waitForChartStability(chartInstance);
            });

            const nodeCount = deproxy(chartInstance).series.reduce(
                (sum, _series, seriesIndex) => sum + testParams.getNodeData(chartInstance, seriesIndex).length,
                0
            );
            expect(onNodeClick).toHaveBeenCalledTimes(nodeCount);
        };

        it(`should render tooltip correctly`, async () => {
            chart = deproxy(await createEnterpriseChart(chartOptions({ hasTooltip: true })));
            await hoverChartNodes(chart, ({ seriesIndex, item }) => {
                const tooltip = document.querySelector('.ag-charts-tooltip');
                expect(tooltip).toBeInstanceOf(HTMLElement);
                expect(!tooltip?.hasAttribute('data-presented-as-popover')).toBe(false);

                const values = testParams.getDatumValues(chart, seriesIndex, item);
                expect(tooltip?.textContent).toEqual(format(...values));
            });

            await hoverAction(8, 8)(chart);
            await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
            const tooltip = document.querySelector('.ag-charts-tooltip');
            expect(!tooltip?.hasAttribute('data-presented-as-popover')).toBe(true);
        });

        it(`should highlight hovered items`, async () => {
            chart = deproxy(await createEnterpriseChart(chartOptions({ hasTooltip: true })));
            await checkHighlight(chart);
        });

        it(`should handle nodeClick event`, async () => {
            const onNodeClick = vi.fn();
            chart = deproxy(await createEnterpriseChart(chartOptions({ hasTooltip: true, onNodeClick })));
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should highlight hovered items when tooltip is disabled`, async () => {
            chart = deproxy(await createEnterpriseChart(chartOptions({ hasTooltip: false })));
            await checkHighlight(chart);
        });

        it(`should handle nodeClick event when tooltip is disabled`, async () => {
            const onNodeClick = vi.fn();
            chart = deproxy(await createEnterpriseChart(chartOptions({ hasTooltip: false, onNodeClick })));
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should handle nodeClick event with offset click when range is 'nearest'`, async () => {
            const onNodeClick = vi.fn();
            chart = deproxy(
                await createEnterpriseChart(chartOptions({ hasTooltip: true, onNodeClick, nodeClickRange: 'nearest' }))
            );
            await checkNodeClick(chart, onNodeClick, { x: 5, y: 5 });
        });

        it(`should handle nodeClick event with offset click when range is within pixel distance`, async () => {
            const onNodeClick = vi.fn();
            chart = deproxy(
                await createEnterpriseChart(chartOptions({ hasTooltip: true, onNodeClick, nodeClickRange: 6 }))
            );
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
            getNodeData: (chartInstance, seriesIndex) =>
                getSeriesContextNodeData<UkNodeDatum>(chartInstance, seriesIndex).nodeData,
            getNodePoint: (item) => {
                expect(item.midPoint).toBeDefined();
                return [item.midPoint!.x, item.midPoint!.y];
            },
            getDatumValues: (chartInstance, seriesIndex, item) => [
                item.datum[getSeriesOptions<AgMapMarkerSeriesOptions>(chartInstance, seriesIndex).idKey!],
            ],
            getTooltipRenderedValues: ({ datum, idKey }) => [datum[idKey!]],
            getHighlightNode: (chartInstance, seriesIndex) =>
                getSeriesGroup(chartInstance, 'highlightNodeGroup', seriesIndex).children().next().value,
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
            chart = await createEnterpriseChart(options);
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
            chart = await createEnterpriseChart(options);
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
            chart = await createEnterpriseChart(options);
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
            chart = await createEnterpriseChart(options);
            await compare();
        });

        it('should fill missing colorValue with colorScale.missingDataFill', async () => {
            const missingNames = new Set(['Wales', 'Northern Ireland']);
            const data = ukData.map((datum): UkDatum => {
                if (!missingNames.has(datum.name)) return datum;
                const rest: UkDatum = { ...datum };
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
                            // Markers render at 0.5 fillOpacity over a grey map, so a neutral fill
                            // would be indistinguishable in the snapshot.
                            missingDataFill: 'magenta',
                        },
                    },
                ],
            };
            chart = deproxy(await createEnterpriseChart(options));
            await compare();

            assertTooltipPresentForAll(
                getMapMarkerSeriesInstance(chart, 1),
                data,
                (datum) => missingNames.has(datum.name),
                (i) => i
            );
        });

        it('AG-17195 should not warn when colorKey resolves to null/undefined/missing', async () => {
            const data = ukData.map((datum, idx): UkDatum => {
                if (idx === 0) return { ...datum, population: null };
                if (idx === 1) return { ...datum, population: undefined };
                if (idx === 2) {
                    const rest: UkDatum = { ...datum };
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
            chart = await createEnterpriseChart(options);

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
            chart = deproxy(await createEnterpriseChart(options));

            const targetNode = getSeriesContextNodeData<UkNodeDatum>(chart, 1).nodeData[0];
            expect(targetNode).toBeDefined();

            const { ctx: chartCtx, id } = deproxy(chart);
            chartCtx.highlightManager.updateHighlight(id, targetNode);
            await compare();
        });

        it('should preserve missingDataFill on highlighted marker', async () => {
            const missingNames = new Set(['Wales', 'Northern Ireland']);
            const data = ukData.map((datum): UkDatum => {
                if (!missingNames.has(datum.name)) return datum;
                const rest: UkDatum = { ...datum };
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
            chart = deproxy(await createEnterpriseChart(options));

            const missingNode = getSeriesContextNodeData<UkNodeDatum>(chart, 1).nodeData.find(
                (node) => node.idValue !== undefined && missingNames.has(node.idValue)
            );
            expect(missingNode).toBeDefined();

            const { ctx: chartCtx, id } = deproxy(chart);
            chartCtx.highlightManager.updateHighlight(id, missingNode);
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
            chart = await createEnterpriseChart(options);
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
            chart = await createEnterpriseChart(options);
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
            chart = await createEnterpriseChart(options);
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
            chart = await createEnterpriseChart(options);
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

            chart = await createEnterpriseChart(options);
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

            chart = await createEnterpriseChart(options);
            await compare();
        });
    });

    // The size each marker of the map-marker series (the second series) is laid out at.
    const nodeSizes = (target: ChartOrProxy<any>): number[] =>
        getSeriesContextNodeData<MapMarkerNodeDatum>(target, 1).nodeData.map((d) => d.point.size);

    describe('AG-17481 size scaling', () => {
        const sizeRange = async (markerOverrides: Partial<AgMapMarkerSeriesOptions>): Promise<[number, number]> => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    { type: 'map-marker', idKey: 'name', sizeKey: 'population', ...markerOverrides },
                ],
            };
            chart = deproxy(await createEnterpriseChart(options));
            return getMapMarkerSizeRange(chart, 1);
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
            chart = deproxy(await createEnterpriseChart(options));

            const markerSizes = nodeSizes(chart);
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
                        // `as never`: a one-element sizeDomain is deliberately outside the types.
                    } as never,
                ],
            };
            chart = deproxy(await createEnterpriseChart(options));

            const markerSizes = nodeSizes(chart);
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
            chart = deproxy(await createEnterpriseChart(options));

            const markerSizes = nodeSizes(chart);
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
            chart = deproxy(await createEnterpriseChart(options));

            const markerSizes = nodeSizes(chart);
            expect(markerSizes.length).toBeGreaterThan(0);
            expect([...new Set(markerSizes)]).toEqual([12]);
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });
    });
    describe('AG-18508 sizeMode', () => {
        const build = async (markerOverrides: Partial<AgMapMarkerSeriesOptions>, theme?: AgChartOptions['theme']) => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                series: [
                    { type: 'map-shape-background' },
                    { type: 'map-marker', idKey: 'name', sizeKey: 'population', ...markerOverrides },
                ],
                ...(theme === undefined ? {} : { theme }),
            };
            chart = deproxy(await createEnterpriseChart(options));
            return getSeriesContextNodeData<UkNodeDatum>(chart, 1).nodeData;
        };
        const sizesByName = (nodes: UkNodeDatum[]) =>
            Object.fromEntries(nodes.map((n) => [n.datum.name, n.point.size]));
        const England = 56e6;
        const NorthernIreland = 2e6;
        const linearScotland = 10 + (30 * 3) / 54;

        it('leaves sizes unchanged when sizeMode is unset or diameter', async () => {
            const base: Partial<AgMapMarkerSeriesOptions> = {
                minSize: 10,
                maxSize: 40,
                sizeDomain: [NorthernIreland, England],
            };
            const unset = sizesByName(await build(base));
            chart.destroy();
            const diameter = sizesByName(await build({ ...base, sizeMode: 'diameter' }));
            expect(diameter).toEqual(unset);
            expect(unset.Scotland).toBeCloseTo(linearScotland, 6);
        });

        it('renders domain endpoints at exactly minSize and maxSize in area mode', async () => {
            const sizes = sizesByName(
                await build({ sizeMode: 'area', minSize: 10, maxSize: 40, sizeDomain: [NorthernIreland, England] })
            );
            expect(sizes.England).toBeCloseTo(40, 10);
            expect(sizes['Northern Ireland']).toBeCloseTo(10, 10);
            expect(sizes.Scotland).toBeCloseTo(Math.sqrt(10 ** 2 + ((40 ** 2 - 10 ** 2) * 3) / 54), 6);
            expect(sizes.Scotland).toBeGreaterThan(linearScotland);
        });

        it('scales area with value when minSize is 0', async () => {
            const sizes = sizesByName(
                await build({ sizeMode: 'area', minSize: 0, maxSize: 30, sizeDomain: [0, 60e6] })
            );
            expect(sizes.Wales ** 2 / sizes['Northern Ireland'] ** 2).toBeCloseTo(3 / 2, 6);
            expect(sizes.Scotland ** 2 / sizes['Northern Ireland'] ** 2).toBeCloseTo(5 / 2, 6);
            expect(sizes.England ** 2).toBeCloseTo((900 * 56e6) / 60e6, 6);
        });

        it('swaps the endpoints for a reversed sizeDomain', async () => {
            const sizes = sizesByName(
                await build({ sizeMode: 'area', minSize: 10, maxSize: 40, sizeDomain: [England, NorthernIreland] })
            );
            expect(sizes.England).toBeCloseTo(10, 10);
            expect(sizes['Northern Ireland']).toBeCloseTo(40, 10);
        });

        it('clamps values outside sizeDomain to minSize and maxSize', async () => {
            const sizes = sizesByName(
                await build({ sizeMode: 'area', minSize: 10, maxSize: 40, sizeDomain: [3e6, 5e6] })
            );
            expect(sizes.England).toBeCloseTo(40, 10);
            expect(sizes['Northern Ireland']).toBeCloseTo(10, 10);
        });

        it('gives a finite area-mode size when the sizeDomain has zero width', async () => {
            const nodes = await build({ sizeMode: 'area', minSize: 10, maxSize: 30, sizeDomain: [5, 5] });
            expect(nodes.length).toBeGreaterThan(0);
            for (const node of nodes) {
                expect(Number.isFinite(node.point.size)).toBe(true);
                expect(node.point.size).toBeCloseTo(Math.sqrt((10 ** 2 + 30 ** 2) / 2), 6);
            }
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });

        it('applies sizeMode set through theme overrides', async () => {
            const base: Partial<AgMapMarkerSeriesOptions> = {
                minSize: 10,
                maxSize: 40,
                sizeDomain: [NorthernIreland, England],
            };
            const viaSeries = sizesByName(await build({ ...base, sizeMode: 'area' }));
            chart.destroy();
            const viaTheme = sizesByName(
                await build(base, { overrides: { 'map-marker': { series: { sizeMode: 'area' } } } })
            );
            expect(viaTheme).toEqual(viaSeries);
            expect(viaTheme.Scotland).toBeGreaterThan(linearScotland);
        });

        it('draws markers at the area-mode size', async () => {
            const nodes = await build({
                sizeMode: 'area',
                minSize: 10,
                maxSize: 40,
                sizeDomain: [NorthernIreland, England],
            });
            const drawn = getEnterpriseSelectionNodes<Marker>(chart, 'markerSelection', 1)
                .map((m) => m.size)
                .sort((a, b) => a - b);
            const expected = nodes.map((n) => n.point.size).sort((a, b) => a - b);
            expect(drawn.length).toBe(expected.length);
            for (const [i, size] of drawn.entries()) {
                expect(size).toBeCloseTo(expected[i], 10);
            }
            expect(drawn[0]).toBeCloseTo(10, 10);
            expect(drawn.at(-1)).toBeCloseTo(40, 10);
            const scotland = nodes.find((n) => n.datum.name === 'Scotland')!;
            expect(getMapMarkerStyleSize(chart, scotland, false, 1)).toBeCloseTo(scotland.point.size, 10);
        });
    });

    describe('default marker size', () => {
        const markerSizes = async (markerOverrides: Partial<AgMapMarkerSeriesOptions>): Promise<number[]> => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                series: [{ type: 'map-shape-background' }, { type: 'map-marker', idKey: 'name', ...markerOverrides }],
            };
            chart = deproxy(await createEnterpriseChart(options));
            return nodeSizes(chart);
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
                series: [SIZE_EXAMPLE.series![0], { ...SIZED_MARKER_SERIES, sizeDomain }],
            });

            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createEnterpriseChart,
                buildOptions([0, 60_000_000]),
                buildOptions([0n, 60_000_000n])
            );
        });
    });

    // Markers grow from a point to full size; Marker nodes carry the scale on their geometry, so the
    // reveal is observed on the rendered bbox rather than a scalingX/scalingY transform.
    describe('marker enter animation', () => {
        const frames = spyOnAnimationFrames();

        const mapOptions = (data: unknown[]): AgChartOptions => ({
            data,
            topology: ukTopology,
            series: [{ type: 'map-shape-background' }, { type: 'map-marker', idKey: 'name' }],
        });

        const markerKeys = (sample: ReadonlyMap<string, unknown>) =>
            [...sample.keys()].filter((key) => /^series\[1\]\/marker\[/.test(key));

        it('markers scale in from a point (width/height 0 -> full) on the initial reveal', async () => {
            const proxy = await createEnterpriseChart(mapOptions(ukData));
            const sampler = createSceneGeometrySampler(proxy);
            const trajectory = await frames.captureAnimationFrames(proxy, sampler);
            await frames.runToEnd(proxy);

            const keys = markerKeys(trajectory.at(-1)!);
            expect(keys, 'one marker node per datum').toHaveLength(ukData.length);

            for (const key of keys) {
                const width = trajectory.map((frame) => frame.get(key)!.width);
                const height = trajectory.map((frame) => frame.get(key)!.height);
                // Anti-vacuity: without these the directional spec below could pass flat.
                expect(width[0], `${key} width at frame 0`).toBeLessThanOrEqual(0.5);
                expect(width.at(-1)!, `${key} width settled`).toBeGreaterThan(1);
                expectMonotonic(width, 'increasing');
                expectProgresses(width);
                expect(height[0], `${key} height at frame 0`).toBeLessThanOrEqual(0.5);
                expectMonotonic(height, 'increasing');

                // The marker scales about its fixed geographic position, so its top-left drifts
                // inwards as it grows but the centre must not move.
                const centreX = trajectory.map((frame) => frame.get(key)!.x + frame.get(key)!.width / 2);
                const centreY = trajectory.map((frame) => frame.get(key)!.y + frame.get(key)!.height / 2);
                for (const [i, cx] of centreX.entries()) {
                    expect(cx, `${key} centre x at frame ${i}`).toBeCloseTo(centreX.at(-1)!, 3);
                    expect(centreY[i], `${key} centre y at frame ${i}`).toBeCloseTo(centreY.at(-1)!, 3);
                }
            }

            const spec: Record<string, SceneNodeExpectation> = {};
            for (const key of keys) {
                spec[key] = {
                    width: ['increases', 'progresses'],
                    height: ['increases', 'progresses'],
                    x: 'any',
                    y: 'any',
                };
            }
            expectSceneTrajectory(trajectory, spec);

            deproxy(proxy).destroy();
        });

        // The enter-scale animation only runs on the initial empty->ready reveal, so markers entering
        // on a data update appear at full size.
        it('entering markers appear at full size on a data update, no scale-in (AG-17797)', async () => {
            const proxy = await createEnterpriseChart(mapOptions(ukData.slice(0, 1)));
            const sampler = createSceneGeometrySampler(proxy);
            const { before, trajectory, after } = await frames.captureSnap(proxy, sampler, () =>
                proxy.update(prepareEnterpriseTestOptions(mapOptions(ukData)))
            );

            const beforeKeys = new Set(markerKeys(before));
            const survivingKey = markerKeys(after).find((key) => beforeKeys.has(key))!;
            const entering = markerKeys(after).filter((key) => !beforeKeys.has(key));
            // Anti-vacuity: otherwise the loop below would pass by asserting nothing.
            expect(survivingKey, 'a surviving marker to read the full size from').toBeDefined();
            expect(entering, 'markers added by the update').toHaveLength(3);

            const fullWidth = after.get(survivingKey)!.width;
            const fullHeight = after.get(survivingKey)!.height;
            expect(fullWidth, 'established marker at full width').toBeGreaterThan(1);

            // The deliberate contrast to the initial reveal above: on an update the same markers are
            // already at full size on every captured frame — they never grow from a point.
            for (const key of entering) {
                for (const frame of trajectory) {
                    expect(frame.get(key)?.width, `${key} width per frame`).toBeCloseTo(fullWidth, 1);
                    expect(frame.get(key)?.height, `${key} height per frame`).toBeCloseTo(fullHeight, 1);
                }
            }

            deproxy(proxy).destroy();
        });
    });
});
