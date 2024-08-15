import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type { AgPolarChartOptions } from 'ag-charts-types';
import type { InteractionRange } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import type { Point } from '../../../scene/point';
import { Selection } from '../../../scene/selection';
import { Sector } from '../../../scene/shape/sector';
import { Transformable } from '../../../scene/transformable';
import { ChartUpdateType } from '../../chartUpdateType';
import type { ChartOrProxy } from '../../test/utils';
import type { PolarTestCase } from '../../test/utils';
import {
    Chart,
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    deproxy,
    extractImageData,
    hoverAction,
    polarChartAssertions,
    prepareTestOptions,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from '../../test/utils';
import * as examples from './test/examples';

const EXAMPLES: Record<string, PolarTestCase> = {
    PIE_SERIES: {
        options: examples.PIE_SERIES,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SERIES_NEGATIVE_VALUES: {
        options: examples.PIE_SERIES_NEGATIVE_VALUES,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SECTORS_DIFFERENT_RADII: {
        options: examples.PIE_SECTORS_DIFFERENT_RADII,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SECTORS_DIFFERENT_RADII_SMALL_RADIUS_MIN: {
        options: examples.PIE_SECTORS_DIFFERENT_RADII_SMALL_RADIUS_MIN,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SECTORS_DIFFERENT_RADII_LARGE_RADIUS_MIN: {
        options: examples.PIE_SECTORS_DIFFERENT_RADII_LARGE_RADIUS_MIN,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SECTORS_DIFFERENT_RADII_SMALL_RADIUS_MAX: {
        options: examples.PIE_SECTORS_DIFFERENT_RADII_SMALL_RADIUS_MAX,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SECTORS_DIFFERENT_RADII_LARGE_RADIUS_MAX: {
        options: examples.PIE_SECTORS_DIFFERENT_RADII_LARGE_RADIUS_MAX,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    PIE_SECTORS_LABELS: {
        options: examples.PIE_SECTORS_LABELS,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
    DONUT_SERIES: {
        options: examples.DONUT_SERIES,
        assertions: polarChartAssertions({ seriesTypes: ['donut'] }),
    },
    DONUT_SERIES_INNER_TEXT: {
        options: examples.DONUT_SERIES_INNER_TEXT,
        assertions: polarChartAssertions({ seriesTypes: ['donut'] }),
    },
    DONUT_SERIES_RATIO: {
        options: examples.DONUT_SERIES_RATIO,
        assertions: polarChartAssertions({ seriesTypes: ['donut'] }),
    },
    DONUT_SERIES_DIFFERENT_RADII: {
        options: examples.DONUT_SERIES_DIFFERENT_RADII,
        assertions: polarChartAssertions({ seriesTypes: ['donut'] }),
    },
    GROUPED_DONUT_SERIES: {
        options: examples.GROUPED_DONUT_SERIES,
        assertions: polarChartAssertions({ seriesTypes: repeat('donut', 2) }),
    },
    GROUPED_DONUT_SERIES_DIFFERENT_RADII: {
        options: examples.GROUPED_DONUT_SERIES_DIFFERENT_RADII,
        assertions: polarChartAssertions({ seriesTypes: repeat('donut', 2) }),
    },
    PIE_CALLOUT_LABELS_COLLISIONS: {
        options: examples.PIE_CALLOUT_LABELS_COLLISIONS,
        assertions: polarChartAssertions({ seriesTypes: ['pie'] }),
    },
};

describe('PolarSeries', () => {
    setupMockConsole();

    let chart: ChartOrProxy;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        jest.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('#create', () => {
        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgPolarChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = deproxy(AgCharts.create(options));
                await waitForChartStability(chart);
                await example.assertions(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgPolarChartOptions = { ...example.options };
                prepareTestOptions(options);

                chart = deproxy(AgCharts.create(options));
                await compare();

                if (example.extraScreenshotActions) {
                    await example.extraScreenshotActions(chart);
                    await compare();
                }
            }
        );
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for PIE_SERIES should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgPolarChartOptions = examples.PIE_SERIES;
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await compare();
            });
        }
    });

    describe('remove animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for PIE_SERIES should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgPolarChartOptions = examples.PIE_SERIES;
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.update({
                    ...options,
                    data: options.data!.slice(0, options.data!.length - 2),
                });
                await compare();
            });
        }
    });

    describe('add animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for PIE_SERIES should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgPolarChartOptions = examples.PIE_SERIES;
                prepareTestOptions(options);

                chart = AgCharts.create({
                    ...options,
                    data: options.data!.slice(0, options.data!.length - 2),
                });
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.update({ ...options });

                await compare();
            });
        }
    });

    describe('update animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for PIE_SERIES should animate at ${ratio * 100}%`, async () => {
                animate(1200, 1);

                const options: AgPolarChartOptions = examples.PIE_SERIES;
                prepareTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.update({
                    ...options,
                    data: options.data!.map((d) => (d.os === 'iOS' ? { ...d, share: d.share * 2 } : d)),
                });
                await compare();
            });
        }
    });

    describe('no series cases', () => {
        it(`for PIE_SERIES it should render identically after legend toggle`, async () => {
            const snapshot = async () => {
                await waitForChartStability(chart);

                return ctx.nodeCanvas?.toBuffer('raw');
            };

            const options: AgPolarChartOptions = { ...examples.PIE_SERIES };
            prepareTestOptions(options);
            options.legend = { enabled: true };

            chart = AgCharts.create(options);
            const deproxied = deproxy(chart);
            const reference = await snapshot();

            options.data?.forEach((_, idx) => {
                (deproxied.series[0] as any).toggleSeriesItem(idx, false);
            });
            deproxied.update(ChartUpdateType.FULL);

            const afterUpdate = await snapshot();
            (expect(afterUpdate) as any).not.toMatchImage(reference);

            options.data?.forEach((_, idx) => {
                (deproxied.series[0] as any).toggleSeriesItem(idx, true);
            });
            deproxied.update(ChartUpdateType.FULL);

            const afterFinalUpdate = await snapshot();
            expect(afterFinalUpdate).toMatchImage(reference);
        }, 15_000);
    });

    describe('highlighting', () => {
        it('should render highlight correctly', async () => {
            const options: AgPolarChartOptions = {
                theme: {
                    overrides: {
                        pie: {
                            series: {
                                highlightStyle: {
                                    item: {
                                        fill: 'red',
                                    },
                                },
                            },
                        },
                    },
                },
                ...examples.PIE_SECTORS_LABELS,
            };
            prepareTestOptions(options);

            chart = deproxy(AgCharts.create(options));

            await waitForChartStability(chart);

            const series = chart.series[0];
            const nodeToHighlight = (series as any).nodeData[0];

            let { x, y } = nodeToHighlight.midPoint as Point;
            ({ x, y } = Transformable.toCanvasPoint(series.contentGroup, x, y));
            await hoverAction(x, y)(chart);
            await waitForChartStability(chart);

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
        }): Promise<Chart> => {
            const tooltip = params.hasTooltip
                ? {
                      renderer(rParams: any) {
                          const values = testParams.getTooltipRenderedValues(rParams);
                          return format(...values);
                      },
                  }
                : { enabled: false };

            const listeners = params.onNodeClick ? { nodeClick: params.onNodeClick } : undefined;
            const nodeClickRangeParams = params.nodeClickRange ? { nodeClickRange: params.nodeClickRange } : {};
            const options: AgPolarChartOptions = {
                container: document.body,
                series: [
                    {
                        highlightStyle: {
                            item: {
                                fill: 'lime',
                            },
                        },
                        tooltip,
                        listeners,
                        ...nodeClickRangeParams,
                        ...testParams.seriesOptions,
                    },
                ],
                ...(testParams.chartOptions ?? {}),
            };
            prepareTestOptions(options);
            const newChart = deproxy(AgCharts.create(options));
            await waitForChartStability(newChart);
            return newChart;
        };

        const hoverChartNodes = async (
            chartInstance: any,
            iterator: (params: { series: any; item: any; x: number; y: number }) => Promise<void>
        ) => {
            for (const series of chartInstance.series) {
                const nodeData = testParams.getNodeData(series);
                expect(nodeData.length).toBeGreaterThan(0);
                for (const item of nodeData) {
                    const itemPoint = testParams.getNodePoint(item);
                    const { x, y } = Transformable.toCanvasPoint(series.contentGroup, itemPoint[0], itemPoint[1]);
                    await hoverAction(x, y)(chartInstance);
                    await waitForChartStability(chartInstance);
                    await iterator({ series, item, x, y });
                }
            }
        };

        const checkHighlight = async (chartInstance: any) => {
            await hoverChartNodes(chartInstance, async ({ series }) => {
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
            await hoverChartNodes(chart, async ({ series, item }) => {
                // Check the tooltip is shown
                const tooltip = document.querySelector('.ag-chart-tooltip');
                expect(tooltip).toBeInstanceOf(HTMLElement);
                expect(tooltip?.classList.contains('ag-chart-tooltip-hidden')).toBe(false);

                // Check the tooltip text
                const values = testParams.getDatumValues(item, series);
                expect(tooltip?.textContent).toEqual(format(...values));
            });

            // Check the tooltip is hidden (hover over top-left corner)
            await hoverAction(8, 8)(chart);
            await waitForChartStability(chart);
            const tooltip = document.querySelector('.ag-chart-tooltip');
            expect(tooltip?.classList.contains('ag-chart-tooltip-hidden')).toBe(true);
        });

        it(`should highlight hovered items`, async () => {
            chart = await createChart({ hasTooltip: true });
            await checkHighlight(chart);
        });

        it(`should handle nodeClick event`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick });
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should highlight hovered items when tooltip is disabled`, async () => {
            chart = await createChart({ hasTooltip: false });
            await checkHighlight(chart);
        });

        it(`should handle nodeClick event when tooltip is disabled`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChart({ hasTooltip: false, onNodeClick });
            await checkNodeClick(chart, onNodeClick);
        });

        it(`should handle nodeClick event with offset click when range is 'nearest'`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick, nodeClickRange: 'nearest' });
            await checkNodeClick(chart, onNodeClick, { x: 5, y: 5 });
        });

        it(`should handle nodeClick event with offset click when range is within pixel distance`, async () => {
            const onNodeClick = jest.fn();
            chart = await createChart({ hasTooltip: true, onNodeClick, nodeClickRange: 6 });
            await checkNodeClick(chart, onNodeClick, { x: 0, y: 5 });
        });
    };

    describe('pointer events', () => {
        const datasets = {
            data: [
                { name: 'Banana', count: 10 },
                { name: 'Apple', count: 5 },
                { name: 'Cucumber', count: 2 },
            ],
            angleKey: 'count',
            sectorLabelKey: 'name',
        };

        const cartesianTestParams = {
            getNodeData: (series) => series.contextNodeData?.nodeData ?? [],
            getTooltipRenderedValues: (params) => [params.xValue, params.yValue],
            // Returns a highlighted marker
            getHighlightNode: (_, series) => series.highlightNode.children[0],
        } as Parameters<typeof testPointerEvents>[0];

        testPointerEvents({
            ...cartesianTestParams,
            seriesOptions: {
                type: 'pie',
                sectorLabelKey: datasets.sectorLabelKey,
                angleKey: datasets.angleKey,
            },
            chartOptions: {
                data: datasets.data,
            },
            getNodeData: (series) => series.nodeData ?? [],
            getNodePoint: (item) => {
                const { x, y } = item.midPoint;
                return [x, y];
            },
            getDatumValues: (item, series) => {
                const { datum } = item;
                return [datum[series.properties.sectorLabelKey], datum[series.properties.angleKey]];
            },
            getTooltipRenderedValues: (params) => {
                const { datum } = params;
                return [datum[params.sectorLabelKey], datum[params.angleKey]];
            },
            getHighlightNode: (_chartInstance, series) =>
                Selection.selectAll(
                    series.highlightGroup,
                    (node): node is Sector => node instanceof Sector && node.visible
                )[0],
        });
    });
});
