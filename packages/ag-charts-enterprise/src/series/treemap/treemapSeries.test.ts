import { type Image as SkiaImage, loadImage as skiaLoadImage } from 'skia-canvas';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type {
    AgCartesianChartOptions,
    AgChartOptions,
    AgPolarChartOptions,
    InteractionRange,
} from 'ag-charts-community';
import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import {
    BIG,
    type Chart,
    GALLERY_EXAMPLES,
    IMAGE_SNAPSHOT_DEFAULTS,
    MIN_TOOLTIP_HIDE_DELAY,
    type SceneFrameInvariant,
    type SceneGeometrySample,
    TREEMAP_SERIES_LABELS,
    assertTooltipPresentForAll,
    clickAction,
    createSceneGeometrySampler,
    deproxy,
    expectAnimatedEndpointsMatchStatic,
    expectNoAnimation,
    expectSceneSamplesMatch,
    expectSceneTrajectory,
    expectWarningsCalls,
    extractImageData,
    hierarchyChartAssertions,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationFrames,
    waitForChartStability,
} from 'ag-charts-community-test';
import { deepClone } from 'ag-charts-core';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import type { TreemapSeries } from './treemapSeries';

describe('TreemapSeries', () => {
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
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('Series Highlighting', () => {
        const SIMPLIFIED_EXAMPLE = {
            ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
            data: GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options.data?.slice(0, 1),
        };

        it('should render a complex chart', async () => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        const childAtDepth = [0, 0, 0, 0];
        it.each([0, 1, 2, 3])(`should render highlight at depth %s`, async (depth) => {
            const options: AgChartOptions = {
                ...SIMPLIFIED_EXAMPLE,
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const seriesImpl = chart.series[0] as TreemapSeries;
            let node = seriesImpl.rootNode;
            const childIndexes = [...childAtDepth];
            while (depth > 0 && node) {
                node = node.children[childIndexes.shift() ?? 0];
                depth--;
            }

            const highlightManager = (chart as Chart).ctx.highlightManager;
            highlightManager.updateHighlight(chart.id, node);
            await compare();
        });
    });

    describe('AG-17377 highlight.enabled', () => {
        const DATA = [
            {
                name: 'Group A',
                children: [
                    { name: 'Tile A1', size: 6 },
                    { name: 'Tile A2', size: 4 },
                ],
            },
            {
                name: 'Group B',
                children: [{ name: 'Tile B1', size: 5 }],
            },
        ];

        const buildOptions = (tileHighlight: any, groupHighlight: any): AgChartOptions => ({
            data: DATA,
            series: [
                {
                    type: 'treemap',
                    labelKey: 'name',
                    sizeKey: 'size',
                    colorKey: undefined,
                    tile: { highlight: { highlightedItem: { fill: 'lime' }, ...tileHighlight } },
                    group: { highlight: { highlightedItem: { fill: 'cyan' }, ...groupHighlight } },
                },
            ],
            animation: { enabled: false },
        });

        const createChart = async (tileHighlight: any, groupHighlight: any) => {
            const options = buildOptions(tileHighlight, groupHighlight);
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            return chart;
        };

        const nodeAtPath = (series: TreemapSeries, path: number[]): any =>
            path.reduce<any>((node, idx) => node?.children[idx], (series as any).rootNode);

        // The highlight selection contains only the active highlight node; its rect fill
        // reflects whatever getItemStyle resolved. 'lime'/'cyan' means the highlight style
        // applied; any other fill means highlighting was suppressed.
        const highlightFill = (series: any): string | undefined => {
            const rect = Array.from(series.highlightSelection.nodes())[0] as any;
            return rect?.fill;
        };

        const highlightNodeAndReadFill = async (series: TreemapSeries, path: number[]): Promise<string | undefined> => {
            const node = nodeAtPath(series, path);
            (chart as Chart).ctx.highlightManager.updateHighlight(chart.id, node);
            await waitForChartStability(chart);
            return highlightFill(series);
        };

        it('highlights a tile on hover by default (control)', async () => {
            await createChart({}, {});
            const series = chart.series[0] as TreemapSeries;
            expect(await highlightNodeAndReadFill(series, [0, 0])).toEqual('lime');
        });

        it('suppresses tile highlighting when tile.highlight.enabled is false', async () => {
            await createChart({ enabled: false }, {});
            const series = chart.series[0] as TreemapSeries;
            expect(await highlightNodeAndReadFill(series, [0, 0])).not.toEqual('lime');
        });

        it('suppresses group highlighting when group.highlight.enabled is false', async () => {
            await createChart({}, { enabled: false });
            const series = chart.series[0] as TreemapSeries;
            expect(await highlightNodeAndReadFill(series, [0])).not.toEqual('cyan');
        });

        it('highlights only groups when tile.highlight.enabled is false and group.highlight.enabled is true', async () => {
            await createChart({ enabled: false }, { enabled: true });
            const series = chart.series[0] as TreemapSeries;
            expect(await highlightNodeAndReadFill(series, [0])).toEqual('cyan');
        });

        it('suppresses all highlighting when both tile and group highlight.enabled are false', async () => {
            await createChart({ enabled: false }, { enabled: false });
            const series = chart.series[0] as TreemapSeries;
            expect(await highlightNodeAndReadFill(series, [0, 0])).not.toEqual('lime');
            expect(await highlightNodeAndReadFill(series, [0])).not.toEqual('cyan');
        });

        const tileEnabled = (series: TreemapSeries) =>
            (series as unknown as { properties: { tile: { highlight: { enabled: boolean } } } }).properties.tile
                .highlight.enabled;
        const groupEnabled = (series: TreemapSeries) =>
            (series as unknown as { properties: { group: { highlight: { enabled: boolean } } } }).properties.group
                .highlight.enabled;

        it('cascades chart-level highlight.enabled = false to tile and group', async () => {
            const options: AgChartOptions = {
                data: DATA,
                highlight: { enabled: false },
                series: [{ type: 'treemap', labelKey: 'name', sizeKey: 'size', colorKey: undefined }],
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            const series = chart.series[0] as TreemapSeries;
            expect(tileEnabled(series)).toBe(false);
            expect(groupEnabled(series)).toBe(false);
        });

        it('lets a series re-enable tile/group highlighting over a disabled chart-level default', async () => {
            const options: AgChartOptions = {
                data: DATA,
                highlight: { enabled: false },
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'size',
                        colorKey: undefined,
                        tile: { highlight: { enabled: true } },
                        group: { highlight: { enabled: true } },
                    },
                ],
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);
            const series = chart.series[0] as TreemapSeries;
            expect(tileEnabled(series)).toBe(true);
            expect(groupEnabled(series)).toBe(true);
        });

        it('still shows tooltips when highlighting is disabled', async () => {
            const options: AgChartOptions = {
                data: DATA,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'size',
                        colorKey: undefined,
                        tile: { highlight: { enabled: false } },
                        group: { highlight: { enabled: false } },
                        tooltip: { renderer: ({ datum }: any) => datum.name },
                    },
                ],
                tooltip: { range: 'exact' },
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);
            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const series = chart.series[0] as TreemapSeries;
            const tileNode = nodeAtPath(series, [0, 0]);
            const { x, y } = _ModuleSupport.Transformable.toCanvasPoint(
                (series as any).contentGroup,
                tileNode.bbox.x + tileNode.bbox.width / 2,
                tileNode.bbox.y + tileNode.bbox.height / 2
            );
            await hoverAction(x, y)(chart);
            await waitForChartStability(chart);

            const tooltip = document.querySelector('.ag-charts-tooltip');
            expect(tooltip).toBeInstanceOf(HTMLElement);
            expect(tooltip?.textContent).toEqual('Tile A1');
        });
    });

    describe('Series Labels', () => {
        const examples = {
            TREEMAP_SERIES_LABELS: {
                options: TREEMAP_SERIES_LABELS,
                assertions: hierarchyChartAssertions({ seriesTypes: ['treemap'] }),
            },
        };

        for (const [exampleName, example] of Object.entries(examples)) {
            it(`for ${exampleName} it should create chart instance as expected`, async () => {
                const options: AgChartOptions = {
                    ...example.options,
                    animation: { enabled: false },
                };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                example.assertions(chart);
            });

            it(`for ${exampleName} it should render to canvas as expected`, async () => {
                const options: AgChartOptions = {
                    ...example.options,
                    animation: { enabled: false },
                };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await compare();
            });
        }

        it(`for TREEMAP_SERIES_LABELS it should render to canvas with group labels disabled`, async () => {
            const options = deepClone(TREEMAP_SERIES_LABELS);
            (options as any).series[0].group.label = { enabled: false };
            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await compare();
        });

        describe('block-leading image segments', () => {
            // Letters drawn as vector paths rather than <text> so glyph rendering is identical
            // across operating systems (system fonts differ between macOS and CI).
            const LETTER_PATHS: Record<string, string> = {
                A: 'M13 25L18 11L23 25M15.5 19.5L20.5 19.5',
                B: 'M14 11L14 25M14 11L19 11Q23 11 23 14.5Q23 18 19 18L14 18M14 18L20 18Q24 18 24 21.5Q24 25 20 25L14 25',
                G: 'M23 15Q23 11 18 11Q13 11 13 18Q13 25 18 25Q23 25 23 20L19 20',
                D: 'M14 11L14 25M14 11L18 11Q24 11 24 18Q24 25 18 25L14 25',
            };
            const iconSvg = (letter: string) =>
                `data:image/svg+xml;utf8,${encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">` +
                        `<circle cx="18" cy="18" r="16" fill="#1f77b4"/>` +
                        `<path d="${LETTER_PATHS[letter]}" stroke="white" stroke-width="2.5" fill="none"` +
                        ` stroke-linecap="round" stroke-linejoin="round"/></svg>`
                )}`;
            const ICONS: Record<string, string> = {
                Alpha: iconSvg('A'),
                Beta: iconSvg('B'),
                Gamma: iconSvg('G'),
                Delta: iconSvg('D'),
            };

            let preloaded: Record<string, SkiaImage> = {};
            beforeAll(async () => {
                const entries = await Promise.all(
                    Object.values(ICONS).map(async (url) => [url, await skiaLoadImage(url)] as const)
                );
                preloaded = Object.fromEntries(entries);
            });

            function stubChartImageLoader(chartInstance: any) {
                const imageLoader = (chartInstance as Chart).ctx.scene.imageLoader as any;
                imageLoader.loadImage = (uri: string) => preloaded[uri] as unknown as HTMLImageElement;
            }

            it.each(['top', 'middle', 'bottom'] as const)(
                'renders block-leading image segments aligned %s of the two-line text column',
                async (verticalAlign) => {
                    const options: AgChartOptions = {
                        animation: { enabled: false },
                        data: [
                            { name: 'Alpha', value: 300 },
                            { name: 'Beta', value: 200 },
                            { name: 'Gamma', value: 150 },
                            { name: 'Delta', value: 120 },
                        ],
                        series: [
                            {
                                type: 'treemap',
                                labelKey: 'name',
                                sizeKey: 'value',
                                tile: {
                                    label: {
                                        enabled: true,
                                        fontSize: 16,
                                        minimumFontSize: 10,
                                        formatter: ({ datum }) => {
                                            const d = datum as { name: string; value: number };
                                            return [
                                                {
                                                    type: 'image',
                                                    url: ICONS[d.name],
                                                    width: 36,
                                                    height: 36,
                                                    block: true,
                                                    padding: 6,
                                                    backgroundFill: 'rgba(0, 0, 0, 0.35)',
                                                    cornerRadius: 8,
                                                    verticalAlign,
                                                },
                                                { text: d.name, fontWeight: 'bold', verticalAlign },
                                                { text: `\n$${d.value}B`, color: 'rgba(0, 0, 0, 0.6)' },
                                            ];
                                        },
                                    },
                                    secondaryLabel: { enabled: false },
                                },
                            },
                        ],
                    };
                    prepareEnterpriseTestOptions(options);
                    chart = deproxy(AgCharts.create(options));
                    stubChartImageLoader(chart);
                    await compare();
                    expectWarningsCalls().toHaveLength(0);
                }
            );

            it('lays two adjacent block-leading image segments side-by-side and keeps both inside the tile', async () => {
                // Regression for AG-15933: a formatter returning two `block: true` images at the
                // start of the label (no `\n` between them) must render both side-by-side as a
                // leading strip, with text flowing to the right and both images contained inside
                // their tile.
                const options: AgChartOptions = {
                    animation: { enabled: false },
                    data: [
                        { name: 'Alpha', value: 300 },
                        { name: 'Beta', value: 200 },
                        { name: 'Gamma', value: 150 },
                        { name: 'Delta', value: 120 },
                    ],
                    series: [
                        {
                            type: 'treemap',
                            labelKey: 'name',
                            sizeKey: 'value',
                            tile: {
                                label: {
                                    enabled: true,
                                    fontSize: 16,
                                    minimumFontSize: 10,
                                    formatter: ({ datum }) => {
                                        const d = datum as { name: string; value: number };
                                        const icon = {
                                            type: 'image' as const,
                                            url: ICONS[d.name],
                                            width: 28,
                                            height: 28,
                                            block: true,
                                            padding: 4,
                                            backgroundFill: 'rgba(0, 0, 0, 0.35)',
                                            cornerRadius: 6,
                                        };
                                        return [
                                            icon,
                                            icon,
                                            { text: d.name, fontWeight: 'bold' },
                                            { text: `\n$${d.value}B` },
                                        ];
                                    },
                                },
                                secondaryLabel: { enabled: false },
                            },
                        },
                    ],
                };
                prepareEnterpriseTestOptions(options);
                chart = deproxy(AgCharts.create(options));
                stubChartImageLoader(chart);
                await compare();
                expectWarningsCalls().toHaveLength(0);
            });

            it("drops oversized block image under default 'hide' so text still renders inside the tile", async () => {
                // Test canvas is 800x600 (prepareEnterpriseTestOptions); split into four tiles each
                // ~400x300 of usable label space. An image declared at 1200x1200 exceeds every tile,
                // so the default 'hide' strategy must drop the image and keep the text-only label.
                const options: AgChartOptions = {
                    animation: { enabled: false },
                    data: [
                        { name: 'Alpha', value: 4 },
                        { name: 'Beta', value: 3 },
                        { name: 'Gamma', value: 2 },
                        { name: 'Delta', value: 1 },
                    ],
                    series: [
                        {
                            type: 'treemap',
                            labelKey: 'name',
                            sizeKey: 'value',
                            tile: {
                                label: {
                                    enabled: true,
                                    fontSize: 16,
                                    minimumFontSize: 10,
                                    formatter: ({ datum }) => {
                                        const d = datum as { name: string };
                                        return [
                                            {
                                                type: 'image',
                                                url: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221200%22 height=%221200%22/%3E',
                                                width: 1200,
                                                height: 1200,
                                                block: true,
                                                backgroundFill: '#888',
                                            },
                                            { text: d.name, fontWeight: 'bold' },
                                        ];
                                    },
                                },
                                secondaryLabel: { enabled: false },
                            },
                        },
                    ],
                };
                prepareEnterpriseTestOptions(options);
                chart = AgCharts.create(options);
                await compare();
                // Image is dropped before reaching the renderer, so no image load is attempted.
                expectWarningsCalls().toHaveLength(0);
            });

            it('keeps every rendered block-leading image inside its tile across mixed tile sizes', async () => {
                // Regression: each tile's rendered image-box (including padding/backgroundFill)
                // must stay within its tile bounds. Repros the docs `inline-images-treemap`
                // example, mixing very small tiles where the image would otherwise be tight.
                const options: AgChartOptions = {
                    animation: { enabled: false },
                    data: [
                        {
                            name: 'Hardware',
                            children: [
                                { name: 'Apple', value: 383 },
                                { name: 'NVIDIA', value: 244 },
                                { name: 'Intel', value: 87 },
                                { name: 'Tesla', value: 67 },
                            ],
                        },
                        {
                            name: 'Software',
                            children: [
                                { name: 'Google', value: 333 },
                                { name: 'Meta', value: 196 },
                                { name: 'SAP', value: 58 },
                                { name: 'Shopify', value: 36 },
                            ],
                        },
                        {
                            name: 'Services',
                            children: [
                                { name: 'Netflix', value: 38 },
                                { name: 'Spotify', value: 21 },
                                { name: 'Airbnb', value: 24 },
                                { name: 'Uber', value: 32 },
                                { name: 'PayPal', value: 27 },
                                { name: 'Stripe', value: 14 },
                            ],
                        },
                    ],
                    series: [
                        {
                            type: 'treemap',
                            labelKey: 'name',
                            sizeKey: 'value',
                            tile: {
                                label: {
                                    enabled: true,
                                    fontSize: 16,
                                    minimumFontSize: 10,
                                    formatter: ({ datum }) => {
                                        const d = datum as { name: string; value: number };
                                        return [
                                            {
                                                type: 'image',
                                                url: ICONS[d.name] ?? ICONS.Alpha,
                                                width: 36,
                                                height: 36,
                                                block: true,
                                                padding: 6,
                                                backgroundFill: 'rgba(0, 0, 0, 0.35)',
                                                cornerRadius: 8,
                                            },
                                            { text: d.name, fontWeight: 'bold' },
                                            { text: `\n$${d.value}B` },
                                        ];
                                    },
                                },
                                secondaryLabel: { enabled: false },
                            },
                        },
                    ],
                };
                prepareEnterpriseTestOptions(options);
                chart = deproxy(AgCharts.create(options));
                stubChartImageLoader(chart);
                // The visual snapshot is the guard: an image overflowing its tile shifts pixels
                // against the committed baseline. Small tiles drop their image, larger tiles keep it.
                await compare();
                expectWarningsCalls().toHaveLength(0);
            });

            it('centres a leading+trailing block-image label inside short tiles without vertical overflow', async () => {
                // AG-15933: a formatter returning a leading block image, middle-aligned text, and a
                // trailing block image rendered mis-centred (~18px off) on a 'middle' baseline,
                // overflowing short tiles. Repros the docs example at a narrow/tall size that yields
                // several short tiles.
                const block = (name: string) => ({
                    type: 'image' as const,
                    url: ICONS[name] ?? ICONS.Alpha,
                    width: 36,
                    height: 36,
                    block: true,
                    padding: 6,
                    backgroundFill: 'rgba(0, 0, 0, 0.35)',
                    cornerRadius: 8,
                });
                const options: AgChartOptions = {
                    width: 312,
                    height: 1053,
                    animation: { enabled: false },
                    data: [
                        {
                            name: 'Hardware',
                            children: [
                                { name: 'Apple', value: 383 },
                                { name: 'NVIDIA', value: 244 },
                                { name: 'Intel', value: 87 },
                                { name: 'Tesla', value: 67 },
                            ],
                        },
                        {
                            name: 'Software',
                            children: [
                                { name: 'Google', value: 333 },
                                { name: 'Meta', value: 196 },
                                { name: 'SAP', value: 58 },
                                { name: 'Shopify', value: 36 },
                            ],
                        },
                    ],
                    series: [
                        {
                            type: 'treemap',
                            labelKey: 'name',
                            sizeKey: 'value',
                            tile: {
                                label: {
                                    enabled: true,
                                    fontSize: 16,
                                    minimumFontSize: 10,
                                    formatter: ({ datum }) => {
                                        const d = datum as { name: string };
                                        return [
                                            block(d.name),
                                            { text: d.name, fontWeight: 'bold', verticalAlign: 'middle' },
                                            block(d.name),
                                        ];
                                    },
                                },
                                secondaryLabel: { enabled: false },
                            },
                        },
                    ],
                };
                prepareEnterpriseTestOptions(options);
                chart = deproxy(AgCharts.create(options));
                stubChartImageLoader(chart);
                // The ~18px mis-centring this guards against is a visual regression: a label
                // overflowing its short tile shifts pixels against the committed baseline.
                await compare();
                expectWarningsCalls().toHaveLength(0);
            });
        });
    });

    describe('Label itemStyler', () => {
        it('should style labels via itemStyler', async () => {
            const options: AgChartOptions = {
                data: [
                    {
                        name: 'Group',
                        children: [
                            { name: 'Alpha', size: 6 },
                            { name: 'Beta', size: 4 },
                        ],
                    },
                ],
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'size',
                        tile: {
                            label: {
                                enabled: true,
                                itemStyler: () => ({ color: 'lime' }),
                            },
                        },
                        group: {
                            label: {
                                enabled: true,
                                itemStyler: () => ({ color: 'lime' }),
                            },
                        },
                    },
                ],
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
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
        const format = (...values: any[]) => values.join(' ');

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
                tooltip: { range: 'exact' },
                series: [
                    {
                        tooltip,
                        tile: {
                            highlight: {
                                highlightedItem: { fill: 'lime' },
                            },
                        },
                        group: {
                            highlight: {
                                highlightedItem: { fill: 'lime' },
                            },
                        },
                        listeners,
                        ...nodeClickRangeParams,
                        ...testParams.seriesOptions,
                    },
                ],
                ...(testParams.chartOptions ?? {}),
                animation: { enabled: false },
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

    describe(`Treemap Series Pointer Events`, () => {
        const datasets = {
            data: [
                {
                    name: 'Fruits',
                    children: [
                        { name: 'Banana', count: 10 },
                        { name: 'Apple', count: 5 },
                    ],
                },
                {
                    name: 'Vegetables',
                    children: [{ name: 'Cucumber', count: 2 }],
                },
            ],
            valueKey: 'count',
            labelKey: 'name',
        };

        const cartesianTestParams = {
            getNodeData: (series) => series.contextNodeData?.nodeData ?? [],
            getTooltipRenderedValues: (params) => [params.xValue, params.yValue],
            // Returns a highlighted marker
            getHighlightNode: (_, series) => series.highlightNodeGroup.children().next().value,
        } as Parameters<typeof testPointerEvents>[0];

        testPointerEvents({
            ...cartesianTestParams,
            seriesOptions: {
                type: 'treemap',
                labelKey: datasets.labelKey,
                sizeKey: datasets.valueKey,
                colorKey: undefined,
            },
            chartOptions: {
                data: datasets.data,
            },
            getNodeData: (series) => {
                const nodes = Array.from(series.datumSelection.nodes());
                const maxDepth = Math.max(...nodes.map((n: any) => n.datum.depth ?? -1));
                return nodes.filter((node: any) => node.datum.depth === maxDepth);
            },
            getNodePoint: (item) => {
                const { x, y, width, height } = item.clipBBox ?? item;
                return [x + width / 2, y + height / 2];
            },
            getDatumValues: (item, series) => {
                const { datum } = item.datum;
                return [datum[series.properties.labelKey], datum[series.properties.sizeKey]];
            },
            getTooltipRenderedValues: (params) => {
                const { datum } = params;
                return [datum[params.labelKey], datum[params.sizeKey]];
            },
            getHighlightNode: (_chartInstance, series) => {
                return Array.from(series.highlightSelection.nodes())[0];
            },
        });
    });

    describe('gradient fill', () => {
        it('should render treemap series with a default gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        secondaryLabelKey: 'change',
                        sizeName: 'Valuation',
                        sizeKey: 'valuation',
                        fills: [
                            {
                                type: 'gradient',
                            },
                        ],
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = deproxy(AgCharts.create(options as AgChartOptions));
            await compare();
        });

        it('should render treemap series with a gradient fill', async () => {
            const options = {
                ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        secondaryLabelKey: 'change',
                        sizeName: 'Valuation',
                        sizeKey: 'valuation',
                        fills: [
                            {
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
                        ],
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = deproxy(AgCharts.create(options as AgChartOptions));
            await compare();
        });

        it('should render treemap series with a mix of gradient and string fills', async () => {
            const options = {
                ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        secondaryLabelKey: 'change',
                        sizeName: 'Valuation',
                        sizeKey: 'valuation',
                        fills: [
                            {
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
                            'blue',
                        ],
                    },
                ],
            };
            prepareEnterpriseTestOptions(options as AgChartOptions);

            chart = deproxy(AgCharts.create(options as AgChartOptions));
            await compare();
        });
    });

    describe('colorScale', () => {
        const TREEMAP_BASE = {
            ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
            animation: { enabled: false },
        };

        it('should render with continuous colorScale', async () => {
            const options: AgChartOptions = {
                ...TREEMAP_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
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
                ...TREEMAP_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
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
                ...TREEMAP_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
                        colorScale: {
                            fills: [{ color: 'green' }, { color: 'white' }, { color: 'purple' }],
                            domain: [-10, 10] as [number, number],
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });

        it('should fill missing colorValue with colorScale.missingDataFill', async () => {
            const data = [
                { name: 'A', valuation: 100, change: 3 },
                { name: 'B', valuation: 80, change: null },
                { name: 'C', valuation: 60 },
                { name: 'D', valuation: 40, change: -4 },
            ];
            const options: AgChartOptions = {
                ...TREEMAP_BASE,
                data,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
                        colorScale: {
                            fills: [{ color: 'red' }, { color: 'yellow' }, { color: 'green' }],
                            missingDataFill: '#cccccc',
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();

            const seriesImpl = chart.series[0] as TreemapSeries;
            assertTooltipPresentForAll(
                seriesImpl,
                data,
                (d) => d.change == null,
                (i) => i
            );
        });

        it('should render with discrete named stops colorScale', async () => {
            const options: AgChartOptions = {
                ...TREEMAP_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
                        colorScale: {
                            fills: [
                                { color: 'red', stop: -2, name: 'Loss' },
                                { color: 'yellow', stop: 2, name: 'Flat' },
                                { color: 'green', name: 'Gain' },
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
    });

    describe('legend', () => {
        const TREEMAP_LEGEND_BASE = {
            ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
            animation: { enabled: false },
        };

        it('should render gradient legend with continuous colorScale', async () => {
            const options: AgChartOptions = {
                ...TREEMAP_LEGEND_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
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

        it('should render category legend with discrete colorScale', async () => {
            const options: AgChartOptions = {
                ...TREEMAP_LEGEND_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
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

        it('should render category legend with named discrete stops', async () => {
            const options: AgChartOptions = {
                ...TREEMAP_LEGEND_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
                        colorScale: {
                            fills: [
                                { color: 'red', stop: -2, name: 'Loss' },
                                { color: 'yellow', stop: 2, name: 'Flat' },
                                { color: 'green', name: 'Gain' },
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

        it('should render gradient legend with continuous named stops', async () => {
            const options: AgChartOptions = {
                ...TREEMAP_LEGEND_BASE,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'valuation',
                        colorKey: 'change',
                        colorScale: {
                            fills: [
                                { color: 'red', stop: -2, name: 'Loss' },
                                { color: 'yellow', stop: 2, name: 'Flat' },
                                { color: 'green', name: 'Gain' },
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

    test('AG-8290 label boxing', async () => {
        const options = prepareEnterpriseTestOptions({
            ...GALLERY_EXAMPLES.TREEMAP_WITH_COLOR_RANGE_EXAMPLE.options,
            series: [
                {
                    type: 'treemap',
                    labelKey: 'name',
                    secondaryLabelKey: 'change',
                    sizeName: 'Valuation',
                    sizeKey: 'valuation',
                    group: {
                        label: {
                            fontSize: 18,
                            spacing: 2,
                            fill: 'pink',
                            border: { stroke: 'black', strokeWidth: 1 },
                        },
                    },
                    tile: {
                        label: {
                            fontSize: 24,
                            minimumFontSize: 9,
                            spacing: 8,
                            fill: 'pink',
                            border: { stroke: 'black', strokeWidth: 1 },
                        },
                        secondaryLabel: {
                            formatter: (params) => `£${params.value.toFixed(1)}bn`,
                            fill: 'lime',
                            color: 'blue',
                            border: { stroke: 'olive', strokeWidth: 3 },
                        },
                    },
                },
            ],
        });

        chart = deproxy(AgCharts.create(options));
        await compare();
    });

    describe('AG-15448', () => {
        const DATA1 = [
            { type: 'Electronics', category: 'Phones', product: 'iPhone', value: 100, status: 1 },
            { type: 'Electronics', category: 'Phones', product: 'Samsung', value: 80, status: 1 },
            { type: 'Electronics', category: 'Laptops', product: 'MacBook', value: 150, status: 1 },
            { type: 'Electronics', category: 'Laptops', product: 'Dell', value: 120, status: 2 },
            { type: 'Furniture', category: 'Chairs', product: 'Office Chair', value: 70, status: 2 }, // This overlaps with the DATA2 dataset and can render in the wrong color.
            { type: 'Furniture', category: 'Tables', product: 'Desk', value: 90, status: 1 },
        ];

        const DATA2 = [
            { type: 'Furniture', category: 'Chairs', product: 'Office Chair (green)', value: 70, status: 2 },
            { type: 'Furniture', category: 'Chairs', product: 'Gaming Chair (green)', value: 60, status: 2 },
            { type: 'Appliances', category: 'Kitchen', product: 'Microwave (orange)', value: 50, status: 1 },
        ];

        const EXAMPLE_OPTIONS: AgChartOptions = {
            context: { colors: { 1: 'orange', 2: 'green' } },
            data: DATA1,
            series: [
                {
                    type: 'treemap',
                    labelKey: 'product',
                    sizeKey: 'value',
                    itemStyler: ({ datum, context }: any) => ({
                        fill: context?.colors[datum.status] ?? 'none',
                    }),
                },
            ],
        };

        it('should render updated data in the itemStyler specified colors', async () => {
            const options = { ...EXAMPLE_OPTIONS };
            prepareEnterpriseTestOptions(options as any);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);
            await chart.updateDelta({ data: DATA2 });
            await compare();
        });
    });

    describe('AG-17130 tooltip after options-replacement update', () => {
        const fullData = [
            { value: 14.35, displayName: 'Jan.10' },
            { value: 14.36, displayName: 'Feb.10' },
            { value: 14.37, displayName: 'Mar.10' },
            { value: 14.34, displayName: 'Apr.10' },
            { value: 9_294_717_981.55, displayName: 'Jan.14' },
            { value: 145_293_355.65, displayName: 'Mar.14' },
        ];
        const filteredData = fullData.filter((d) => d.displayName.includes('.10'));

        const buildOptions = (data: typeof fullData): AgChartOptions => ({
            data,
            series: [{ type: 'treemap', labelKey: 'displayName', sizeKey: 'value', childrenKey: 'children' }],
            animation: { enabled: false },
        });

        it('shows the new top-left tile on hover after replacing options', async () => {
            const proxy = AgCharts.create(prepareEnterpriseTestOptions(buildOptions(filteredData)));
            chart = deproxy(proxy);
            await waitForChartStability(chart);

            await proxy.update(prepareEnterpriseTestOptions(buildOptions(fullData)));
            await waitForChartStability(chart);

            // Jan.14 dwarfs every other datum, so the new layout places it top-left.
            // Hovering near the top-left also overlaps where Mar.10's tile was positioned
            // before the update, which is the scenario covered by the regression.
            const { x, y } = chart.seriesRect!;
            await hoverAction(x + 30, y + 30)(chart);
            await waitForChartStability(chart);

            const tooltip = document.querySelector('.ag-charts-tooltip');
            expect(tooltip?.textContent).toContain('Jan.14');
            expect(tooltip?.textContent).not.toContain('Mar.10');
        });
    });

    describe('bigint values (AG-16608)', () => {
        it('renders out-of-safe-range bigint tile sizes proportionally', async () => {
            // Sizes beyond Number.MAX_SAFE_INTEGER must drive tile area, not collapse to equal tiles.
            const options: AgChartOptions = {
                data: [
                    {
                        name: 'root',
                        children: [
                            { name: 'A', size: BIG },
                            { name: 'B', size: BIG * 2n },
                            { name: 'C', size: BIG * 3n },
                        ],
                    },
                ],
                series: [{ type: 'treemap', labelKey: 'name', sizeKey: 'size', colorKey: undefined }],
                animation: { enabled: false },
            };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
            expectWarningsCalls().toMatchInlineSnapshot(`[]`);
        });
    });

    // These model the org-chart reset()/randomise() actions — a deep-shuffle of the hierarchy tree
    // followed by a re-render. Probing the frame trajectory (see the animation-trajectory-tests
    // rule) shows the treemap does NOT animate: the animation batch is skipped for both the initial
    // load and every data update, so tiles snap straight to their laid-out geometry on the first
    // frame and hold. These CASEs assert that faithfully — a regression that started tweening tile
    // rects (or failed to lay them out at all) would break them — rather than inventing motion.
    describe('animation -test page actions', () => {
        const frames = spyOnAnimationFrames();

        type OrgNode = { title: string; total?: number; children?: OrgNode[] };

        // A fixed three-level tree; `reversed` deep-reverses child order at every level, a
        // deterministic stand-in for the page's randomise() that reshapes the layout while keeping
        // the tree shape (so no tile enters or leaves — the reshuffle is a pure re-layout).
        const ORG_DATA: OrgNode[] = [
            {
                title: 'A',
                children: [
                    {
                        title: 'A1',
                        total: 5,
                        children: [
                            { title: 'A1a', total: 3 },
                            { title: 'A1b', total: 2 },
                        ],
                    },
                    { title: 'A2', total: 4 },
                ],
            },
            {
                title: 'B',
                children: [
                    { title: 'B1', total: 6 },
                    { title: 'B2', total: 2 },
                    { title: 'B3', total: 1 },
                ],
            },
        ];
        const reversed = (nodes: OrgNode[]): OrgNode[] =>
            [...nodes].reverse().map((n) => ({ ...n, children: n.children ? reversed(n.children) : undefined }));

        const treemapOptions = (data: OrgNode[] = ORG_DATA): AgChartOptions =>
            prepareEnterpriseTestOptions({
                data,
                series: [{ type: 'treemap', labelKey: 'title', sizeKey: 'total' }],
                animation: { enabled: true },
            } as AgChartOptions);

        const RECT = /^series\[0\]\/rect\[/;
        const rectEntries = (sample: SceneGeometrySample) => [...sample].filter(([key]) => RECT.test(key));
        const laidOutTiles = (sample: SceneGeometrySample) =>
            rectEntries(sample).filter(([, r]) => r.visible !== 0 && r.width > 10 && r.height > 10);

        // A treemap is a laminar family of tiles: any two tiles are either disjoint or one fully
        // contains the other — never a partial overlap. This is the containment contract ("children
        // stay within parent bounds") expressed from geometry alone, so it survives a reshuffle
        // re-pointing sampler keys at reused rect instances (the key path stops tracking the datum).
        const tol = 1.5;
        const encloses = (outer: Record<string, number>, inner: Record<string, number>) =>
            outer.x - tol <= inner.x &&
            outer.y - tol <= inner.y &&
            inner.x + inner.width <= outer.x + outer.width + tol &&
            inner.y + inner.height <= outer.y + outer.height + tol;
        const overlaps = (a: Record<string, number>, b: Record<string, number>) => {
            const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
            const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
            return w > tol && h > tol;
        };
        const tilesAreLaminar: SceneFrameInvariant = {
            name: 'tiles are disjoint or fully nested (no partial overlap)',
            check: (frame) => {
                const rects = laidOutTiles(frame).map(([, r]) => r);
                for (let i = 0; i < rects.length; i++) {
                    for (let j = i + 1; j < rects.length; j++) {
                        const a = rects[i];
                        const b = rects[j];
                        if (!overlaps(a, b)) continue;
                        if (encloses(a, b) || encloses(b, a)) continue;
                        return `tiles partially overlap: [${a.x.toFixed(0)},${a.y.toFixed(0)},${a.width.toFixed(0)}x${a.height.toFixed(0)}] and [${b.x.toFixed(0)},${b.y.toFixed(0)},${b.width.toFixed(0)}x${b.height.toFixed(0)}]`;
                    }
                }
                return undefined;
            },
        };

        const layoutChanges = (before: SceneGeometrySample, after: SceneGeometrySample): number =>
            rectEntries(before).filter(([key, b]) => {
                const a = after.get(key);
                return (
                    a != null && (Math.abs(a.x - b.x) > 1 || Math.abs(a.y - b.y) > 1 || Math.abs(a.width - b.width) > 1)
                );
            }).length;

        // The update snaps at frame 0: hand-roll the capture (settle -> sample before -> update ->
        // capture -> settle -> sample after) rather than captureUpdate, whose frame-0 start anchor
        // assumes surviving nodes do not jump when the update lands.
        const captureReshuffle = async (create: AgChartOptions, next: AgChartOptions) => {
            const proxy = AgCharts.create(create);
            chart = deproxy(proxy);
            await frames.runToEnd(proxy);
            const sample = createSceneGeometrySampler(proxy);
            const before = sample();
            await proxy.update(next);
            const trajectory = await frames.captureAnimationFrames(proxy, sample);
            await frames.runToEnd(proxy);
            const after = sample();
            return { proxy, before, trajectory, after };
        };

        it('standalone: initial load snaps the full tile layout with no reveal animation', async () => {
            const proxy = AgCharts.create(treemapOptions());
            chart = deproxy(proxy);
            const sample = createSceneGeometrySampler(proxy);
            const trajectory = await frames.captureAnimationFrames(proxy, sample);
            await frames.runToEnd(proxy);

            // No animation batch ran, and no node moved across the captured frames; the laminar
            // containment invariant holds on every (already-settled) frame.
            expect(
                trajectory.phaseIntervals.every((interval) => interval.length === 0),
                'no animation phase ran'
            ).toBe(true);
            expectNoAnimation(trajectory);
            expectSceneTrajectory(trajectory, {}, { frameInvariants: [tilesAreLaminar] });

            // Anti-vacuity: the very first frame already carries the complete laid-out treemap (all
            // eight leaf/group tiles at full size), so "no animation" is asserted against a rendered
            // layout, not a blank scene that never drew.
            expect(laidOutTiles(trajectory[0]).length, 'laid-out tiles at frame 0').toBeGreaterThanOrEqual(8);
        });

        it('reshuffle: tiles snap to the new layout with no per-tile tween', async () => {
            const { before, trajectory, after } = await captureReshuffle(
                treemapOptions(),
                treemapOptions(reversed(ORG_DATA))
            );
            expect(laidOutTiles(before).length).toBeGreaterThanOrEqual(8);
            expect(laidOutTiles(after).length).toBeGreaterThanOrEqual(8);

            expect(
                trajectory.phaseIntervals.every((interval) => interval.length === 0),
                'no animation phase ran'
            ).toBe(true);
            expectNoAnimation(trajectory);
            expectSceneTrajectory(trajectory, {}, { frameInvariants: [tilesAreLaminar] });

            // Frame 0 already equals the settled after-state (the snap), and the reshuffle genuinely
            // re-laid the tiles — otherwise "no animation" would pass vacuously on an unchanged scene.
            expectSceneSamplesMatch(trajectory[0], after);
            expect(layoutChanges(before, after), 'tiles whose position/size moved').toBeGreaterThan(4);
        });

        // The org-chart page also promised highlight state behaves through reshuffles. After a
        // reshuffle rebuilds the tile tree, highlighting a node from the NEW tree must bind the
        // highlight to that node and render it at the node's live tile — the reused-instance trap
        // (datum bindings re-pointed onto recycled rects) would otherwise surface a stale tile at
        // the wrong position.
        const withHighlight = (data: OrgNode[]): AgChartOptions =>
            prepareEnterpriseTestOptions({
                data,
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'title',
                        sizeKey: 'total',
                        tile: { highlight: { highlightedItem: { fill: 'lime' } } },
                    },
                ],
                animation: { enabled: true },
            } as AgChartOptions);
        const findTileNode = (series: TreemapSeries, title: string): any => {
            const dfs = (node: any): any =>
                node?.datum?.title === title ? node : (node?.children ?? []).map(dfs).find(Boolean);
            return dfs((series as any).rootNode);
        };
        const highlightTile = (series: TreemapSeries): any => Array.from((series as any).highlightSelection.nodes())[0];
        const baseTileFor = (series: TreemapSeries, node: any): any =>
            Array.from((series as any).datumSelection.nodes()).find((r: any) => r.datum === node);

        it('highlight through reshuffle: re-highlighting resolves the pointed node, not a stale tile', async () => {
            const proxy = AgCharts.create(withHighlight(ORG_DATA));
            chart = deproxy(proxy);
            await waitForChartStability(chart);
            const series = chart.series[0] as TreemapSeries;
            const highlightManager = (chart as Chart).ctx.highlightManager;

            highlightManager.updateHighlight(chart.id, findTileNode(series, 'A2'));
            await waitForChartStability(chart);
            expect(highlightTile(series)?.datum?.datum?.title).toBe('A2');

            await proxy.update(withHighlight(reversed(ORG_DATA)));
            await waitForChartStability(chart);

            const b1 = findTileNode(series, 'B1');
            highlightManager.updateHighlight(chart.id, b1);
            await waitForChartStability(chart);
            const highlighted = highlightTile(series);
            expect(highlighted?.datum).toBe(b1);
            expect(highlighted?.fill).toBe('lime');
            const base = baseTileFor(series, b1);
            expect(highlighted?.x).toBeCloseTo(base.x, 5);
            expect(highlighted?.y).toBeCloseTo(base.y, 5);
            expect(highlighted?.width).toBeCloseTo(base.width, 5);
            expect(highlighted?.height).toBeCloseTo(base.height, 5);

            highlightManager.updateHighlight(chart.id);
            await waitForChartStability(chart);
            expect(Array.from((series as any).highlightSelection.nodes())).toHaveLength(0);
        });

        it('sanity: reshuffle endpoints match static renders', async () => {
            const before = treemapOptions();
            const proxy = AgCharts.create(before);
            chart = deproxy(proxy);
            await expectAnimatedEndpointsMatchStatic(
                frames,
                () => ctx.snapshot(),
                proxy,
                before,
                treemapOptions(reversed(ORG_DATA))
            );
        });
    });
});
