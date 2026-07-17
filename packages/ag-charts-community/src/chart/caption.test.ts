import { type Image as SkiaImage, loadImage as skiaLoadImage } from 'skia-canvas';
import { beforeAll, describe, expect, test } from 'vitest';

import type { AgChartOptions, TextAlign } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import { Transformable } from '../scene/transformable';
import type { Chart } from './chart';
import type { ChartCaption } from './chartCaption';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    createChart,
    deproxy,
    expectWarningsCalls,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';
import type { AgChartProxy } from './test/utils';

describe('Caption', () => {
    setupMockConsole();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx, { ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    let chart: Chart;
    const ctx = setupMockCanvas();

    describe('#create', () => {
        describe('text align', () => {
            test('left', async () => {
                chart = await createChart({
                    title: { text: 'Monthly Sales Report\n2023', textAlign: 'left' },
                    subtitle: { text: 'Region: North America\n(Values in USD)', textAlign: 'left' },
                    footnote: { text: 'Source: Sales Department\nGenerated on 2023-12-20', textAlign: 'left' },
                });
                await compare();
            });

            test('center', async () => {
                chart = await createChart({
                    title: { text: 'Monthly Sales Report\n2023', textAlign: 'center' },
                    subtitle: { text: 'Region: North America\n(Values in USD)', textAlign: 'center' },
                    footnote: { text: 'Source: Sales Department\nGenerated on 2023-12-20', textAlign: 'center' },
                });
                await compare();
            });

            test('right', async () => {
                chart = await createChart({
                    title: { text: 'Monthly Sales Report\n2023', textAlign: 'right' },
                    subtitle: { text: 'Region: North America\n(Values in USD)', textAlign: 'right' },
                    footnote: { text: 'Source: Sales Department\nGenerated on 2023-12-20', textAlign: 'right' },
                });
                await compare();
            });

            test('mixed', async () => {
                chart = await createChart({
                    title: { text: 'Monthly Sales Report\n2023', textAlign: 'left' },
                    subtitle: { text: 'Region: North America\n(Values in USD)', textAlign: 'center' },
                    footnote: { text: 'Source: Sales Department\nGenerated on 2023-12-20', textAlign: 'right' },
                });
                await compare();
            });
        });

        describe('truncate', () => {
            const longText =
                'This is an extremely long title that should definitely exceed the width of the chart container and be truncated under normal circumstances';

            test('truncate: false on title', async () => {
                chart = await createChart({
                    title: { text: longText, truncate: false } as any,
                    subtitle: { text: longText },
                    footnote: { text: longText },
                });
                await compare();
            });

            test('truncate: false on all captions', async () => {
                chart = await createChart({
                    title: { text: longText, truncate: false } as any,
                    subtitle: { text: longText, truncate: false } as any,
                    footnote: { text: longText, truncate: false } as any,
                });
                await compare();
            });

            test('truncate: false with maxWidth', async () => {
                chart = await createChart({
                    title: { text: longText, truncate: false, maxWidth: 200 } as any,
                    subtitle: { text: longText },
                    footnote: { text: longText },
                });
                await compare();
            });
        });
    });

    describe('#validation', () => {
        test('invalid text align', async () => {
            await createChart({
                title: { text: 'Monthly Sales Report\n2023', textAlign: 'LEFT' as TextAlign },
                subtitle: { text: 'Region: North America\n(Values in USD)', textAlign: 'centre' as TextAlign },
                footnote: { text: 'Source: Sales Department\nGenerated on 2023-12-20', textAlign: 'abc' as TextAlign },
            });
            expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - Option \`title.textAlign\` cannot be set to \`"LEFT"\`; expecting a keyword such as 'left', 'center' or 'right', ignoring.",
  ],
  [
    "AG Charts - Option \`subtitle.textAlign\` cannot be set to \`"centre"\`; expecting a keyword such as 'left', 'center' or 'right', ignoring.",
  ],
  [
    "AG Charts - Option \`footnote.textAlign\` cannot be set to \`"abc"\`; expecting a keyword such as 'left', 'center' or 'right', ignoring.",
  ],
]
`);
        });
    });

    // AG-16511: An enabled caption with empty `text` should still reserve a line of
    // layout space — only `enabled: false` reclaims the space.
    describe('AG-16511 empty caption text reserves layout space', () => {
        const seriesOptions = {
            data: [
                { x: 'A', y: 3 },
                { x: 'B', y: 5 },
                { x: 'C', y: 2 },
                { x: 'D', y: 4 },
            ],
            series: [{ type: 'bar' as const, xKey: 'x', yKey: 'y' }],
            legend: { enabled: false },
        };
        const baseOptions = { ...seriesOptions, title: { text: 'Title' } };

        describe('visual snapshots', () => {
            test('filled subtitle (reference)', async () => {
                chart = await createChart({ ...baseOptions, subtitle: { text: 'Subtitle' } });
                await compare();
            });

            test('empty subtitle reserves the same space as filled', async () => {
                chart = await createChart({ ...baseOptions, subtitle: { text: '' } });
                await compare();
            });

            test('disabled subtitle reclaims the space', async () => {
                chart = await createChart({ ...baseOptions, subtitle: { enabled: false } });
                await compare();
            });

            test('filled footnote (reference)', async () => {
                chart = await createChart({ ...baseOptions, footnote: { text: 'Footnote' } });
                await compare();
            });

            test('empty footnote reserves the same space as filled', async () => {
                chart = await createChart({ ...baseOptions, footnote: { text: '' } });
                await compare();
            });
        });

        test('empty subtitle and filled subtitle yield the same series-area y', async () => {
            chart = await createChart({ ...baseOptions, subtitle: { text: 'Subtitle' } });
            const filledSeriesY = chart.seriesAreaBoundingBox.y;

            chart = await createChart({ ...baseOptions, subtitle: { text: '' } });
            const emptySeriesY = chart.seriesAreaBoundingBox.y;

            expect(emptySeriesY).toBeCloseTo(filledSeriesY, 0);
            // Title sits above the series area, not inside it.
            const titleBBox = Transformable.toCanvas(chart.title.node);
            expect(titleBBox.y + titleBBox.height).toBeLessThanOrEqual(emptySeriesY);
        });

        test('disabled subtitle reclaims the space', async () => {
            chart = await createChart({ ...baseOptions, subtitle: { text: '' } });
            const enabledEmptySeriesY = chart.seriesAreaBoundingBox.y;

            chart = await createChart({ ...baseOptions, subtitle: { enabled: false } });
            const disabledSeriesY = chart.seriesAreaBoundingBox.y;

            expect(disabledSeriesY).toBeLessThan(enabledEmptySeriesY);
        });

        test('updating non-empty subtitle to empty preserves layout', async () => {
            chart = await createChart({ ...baseOptions, subtitle: { text: 'Subtitle' } });
            const beforeSeriesY = chart.seriesAreaBoundingBox.y;

            await (chart as any).update({ ...baseOptions, subtitle: { text: '' } });
            await waitForChartStability(chart);

            expect(chart.seriesAreaBoundingBox.y).toBeCloseTo(beforeSeriesY, 0);
        });

        test('empty footnote and filled footnote yield the same series-area bottom', async () => {
            chart = await createChart({ ...baseOptions, footnote: { text: 'Footnote' } });
            const filledSeriesBottom = chart.seriesAreaBoundingBox.y + chart.seriesAreaBoundingBox.height;

            chart = await createChart({ ...baseOptions, footnote: { text: '' } });
            const emptySeriesBottom = chart.seriesAreaBoundingBox.y + chart.seriesAreaBoundingBox.height;

            expect(emptySeriesBottom).toBeCloseTo(filledSeriesBottom, 0);
        });
    });

    // AG-11688: adding the box feature must not drop the pre-existing `padding` inset for
    // captions that have no background box (e.g. the financial preset's `title: { padding: 4 }`).
    describe('AG-11688 caption padding without a background box', () => {
        const seriesOptions = {
            data: [
                { x: 'A', y: 3 },
                { x: 'B', y: 5 },
                { x: 'C', y: 2 },
                { x: 'D', y: 4 },
            ],
            series: [{ type: 'bar' as const, xKey: 'x', yKey: 'y' }],
            legend: { enabled: false },
        };

        test('left-aligned title is horizontally inset by its padding when unboxed', async () => {
            chart = await createChart({ ...seriesOptions, title: { text: 'Revenue', textAlign: 'left' } });
            const withoutPadding = Transformable.toCanvas(chart.title.node).x;

            chart = await createChart({
                ...seriesOptions,
                title: { text: 'Revenue', textAlign: 'left', padding: 16 },
            });
            const withPadding = Transformable.toCanvas(chart.title.node).x;

            expect(withPadding - withoutPadding).toBeCloseTo(16, 0);
        });

        test('title padding reserves vertical layout space when unboxed', async () => {
            chart = await createChart({ ...seriesOptions, title: { text: 'Revenue' } });
            const withoutPadding = chart.seriesAreaBoundingBox.y;

            chart = await createChart({ ...seriesOptions, title: { text: 'Revenue', padding: 16 } });
            const withPadding = chart.seriesAreaBoundingBox.y;

            expect(withPadding).toBeGreaterThan(withoutPadding);
        });
    });

    // AG-11688: title/subtitle/footnote captions accept a background fill/border box.
    describe('AG-11688 caption background box', () => {
        const seriesOptions = {
            data: [
                { x: 'A', y: 3 },
                { x: 'B', y: 5 },
                { x: 'C', y: 2 },
                { x: 'D', y: 4 },
            ],
            series: [{ type: 'bar' as const, xKey: 'x', yKey: 'y' }],
            legend: { enabled: false },
        };
        const boxPadding = { top: 20, right: 12, bottom: 20, left: 12 };

        describe('visual snapshots', () => {
            test('title fill and fillOpacity', async () => {
                chart = await createChart({
                    ...seriesOptions,
                    title: { text: 'Revenue', fill: '#4a90d9', fillOpacity: 0.5 },
                });
                await compare();
            });

            test('title border', async () => {
                chart = await createChart({
                    ...seriesOptions,
                    title: { text: 'Revenue', border: { enabled: true, stroke: '#204060', strokeWidth: 2 } },
                });
                await compare();
            });

            test('title cornerRadius and object padding', async () => {
                chart = await createChart({
                    ...seriesOptions,
                    title: {
                        text: 'Revenue',
                        fill: '#e0e8f0',
                        cornerRadius: 8,
                        padding: { top: 6, right: 16, bottom: 6, left: 16 },
                    },
                });
                await compare();
            });

            test('title numeric padding', async () => {
                chart = await createChart({
                    ...seriesOptions,
                    title: { text: 'Revenue', fill: '#e0e8f0', padding: 20 },
                });
                await compare();
            });

            test('subtitle fill', async () => {
                chart = await createChart({
                    ...seriesOptions,
                    title: { text: 'Revenue' },
                    subtitle: { text: 'Quarterly', fill: '#f0d0d0' },
                });
                await compare();
            });

            test('footnote fill', async () => {
                chart = await createChart({
                    ...seriesOptions,
                    footnote: { text: 'Source: internal', fill: '#d0f0d0' },
                });
                await compare();
            });
        });

        // AC4: fill or border with no explicit padding still reserves non-zero inset, so the
        // background box grows the caption bounds rather than clipping the text.
        test('bordered title with no explicit padding grows the caption bbox', async () => {
            chart = await createChart({ ...seriesOptions, title: { text: 'Revenue' } });
            const plainBBox = chart.title.node.getBBox();

            chart = await createChart({
                ...seriesOptions,
                title: { text: 'Revenue', border: { enabled: true, stroke: '#204060' } },
            });
            const borderedBBox = chart.title.node.getBBox();

            expect(borderedBBox.width).toBeGreaterThan(plainBBox.width);
            expect(borderedBBox.height).toBeGreaterThan(plainBBox.height);
        });

        test('fill-only title with no explicit padding grows the caption bbox', async () => {
            chart = await createChart({ ...seriesOptions, title: { text: 'Revenue' } });
            const plainBBox = chart.title.node.getBBox();

            chart = await createChart({ ...seriesOptions, title: { text: 'Revenue', fill: '#4a90d9' } });
            const filledBBox = chart.title.node.getBBox();

            expect(filledBBox.width).toBeGreaterThan(plainBBox.width);
            expect(filledBBox.height).toBeGreaterThan(plainBBox.height);
        });

        // TC1: layout reserves space for the box, pushing the series area away from the caption.
        test('boxed title pushes the series area down vs unboxed', async () => {
            chart = await createChart({ ...seriesOptions, title: { text: 'Revenue' } });
            const unboxedSeriesY = chart.seriesAreaBoundingBox.y;

            chart = await createChart({
                ...seriesOptions,
                title: { text: 'Revenue', fill: '#4a90d9', padding: boxPadding },
            });
            const boxedSeriesY = chart.seriesAreaBoundingBox.y;

            expect(boxedSeriesY).toBeGreaterThan(unboxedSeriesY);
        });

        test('boxed footnote lifts the series area bottom vs unboxed', async () => {
            chart = await createChart({ ...seriesOptions, footnote: { text: 'Source' } });
            const unboxedBottom = chart.seriesAreaBoundingBox.y + chart.seriesAreaBoundingBox.height;

            chart = await createChart({
                ...seriesOptions,
                footnote: { text: 'Source', fill: '#4a90d9', padding: boxPadding },
            });
            const boxedBottom = chart.seriesAreaBoundingBox.y + chart.seriesAreaBoundingBox.height;

            expect(boxedBottom).toBeLessThan(unboxedBottom);
        });

        // Rich-text/segment captions render the box but their bbox is not grown by the box
        // padding, so the layout reservation is compensated caption-side.
        test('boxed rich-text title reserves box padding in the layout', async () => {
            chart = await createChart({ ...seriesOptions, title: { text: [{ text: 'Revenue' }] } });
            const unboxedSeriesY = chart.seriesAreaBoundingBox.y;

            chart = await createChart({
                ...seriesOptions,
                title: { text: [{ text: 'Revenue' }], fill: '#4a90d9', padding: boxPadding },
            });
            const boxedSeriesY = chart.seriesAreaBoundingBox.y;

            expect(boxedSeriesY).toBeGreaterThan(unboxedSeriesY);
        });

        // A plain-text box grows the caption bbox by its padding; a rich-text (segment) box does
        // not, so the layout compensates. The compensation must reserve the same space as the
        // plain-text box, not double-count the padding against the caption's inset position.
        test('boxed rich-text caption does not double-count box padding vs plain text', async () => {
            chart = await createChart({
                ...seriesOptions,
                footnote: { text: 'Source', fill: '#4a90d9', padding: boxPadding },
            });
            const plainFootBottom = chart.seriesAreaBoundingBox.y + chart.seriesAreaBoundingBox.height;

            chart = await createChart({
                ...seriesOptions,
                footnote: { text: [{ text: 'Source' }], fill: '#4a90d9', padding: boxPadding },
            });
            const richFootBottom = chart.seriesAreaBoundingBox.y + chart.seriesAreaBoundingBox.height;

            expect(richFootBottom).toBeCloseTo(plainFootBottom, 0);

            chart = await createChart({
                ...seriesOptions,
                title: { text: 'Revenue', fill: '#4a90d9', padding: boxPadding },
            });
            const plainTitleY = chart.seriesAreaBoundingBox.y;

            chart = await createChart({
                ...seriesOptions,
                title: { text: [{ text: 'Revenue' }], fill: '#4a90d9', padding: boxPadding },
            });
            const richTitleY = chart.seriesAreaBoundingBox.y;

            expect(richTitleY).toBeGreaterThanOrEqual(plainTitleY);
            expect(richTitleY - plainTitleY).toBeLessThan(boxPadding.top + boxPadding.bottom);
        });

        // A boxed caption renders into a layer sized to node.getBBox(); if the segment bbox omits
        // the box padding the box top is clipped. Its getBBox must include the box like plain text.
        // `truncate: false` keeps the padded title from wrapping to an empty (zero-height) bbox in
        // the small mock layout.
        test('boxed rich-text title bbox includes the box like plain text (no clip)', async () => {
            chart = await createChart({
                ...seriesOptions,
                title: { text: 'Revenue', fill: '#4a90d9', padding: boxPadding, truncate: false } as any,
            });
            const plainBBox = chart.title.node.getBBox();

            chart = await createChart({
                ...seriesOptions,
                title: { text: [{ text: 'Revenue' }], fill: '#4a90d9', padding: boxPadding, truncate: false } as any,
            });
            const richBBox = chart.title.node.getBBox();

            expect(chart.title.node.y - richBBox.y).toBeCloseTo(boxPadding.top, 0);
            expect(richBBox.y).toBeCloseTo(plainBBox.y, 0);
            expect(richBBox.height).toBeCloseTo(plainBBox.height, 0);
        });
    });

    // CRT-1041: Footnote caption with multi-line rich text should have correct bounding box
    // for the accessibility proxy element.
    describe('CRT-1041 footnote caption bounds', () => {
        function assertProxyBoundsMatchCanvas(caption: ChartCaption) {
            const canvasBBox = Transformable.toCanvas(caption.node);
            const proxyBBox = (caption as any).lastProxyBBox as
                | { x: number; y: number; width: number; height: number }
                | undefined;

            expect(proxyBBox).toBeDefined();
            expect(proxyBBox!.x).toBeCloseTo(canvasBBox.x, 0);
            expect(proxyBBox!.y).toBeCloseTo(canvasBBox.y, 0);
            expect(proxyBBox!.width).toBeCloseTo(canvasBBox.width, 0);
            expect(proxyBBox!.height).toBeCloseTo(canvasBBox.height, 0);
        }

        test('multi-line footnote proxy bounds match canvas position', async () => {
            chart = await createChart({
                title: { text: 'Chart Title' },
                footnote: { text: 'Source: Test Data\nUpdated: 2026' },
            });
            await compare();

            const { footnote } = chart;
            assertProxyBoundsMatchCanvas(footnote);

            // Footnote proxy must be fully within the canvas area.
            const proxyBBox = (footnote as any).lastProxyBBox;
            expect(proxyBBox.y).toBeGreaterThan(0);
            expect(proxyBBox.y + proxyBBox.height).toBeLessThanOrEqual(chart.height!);
        });

        test('multi-line captions proxy bounds match canvas position', async () => {
            chart = await createChart({
                title: { text: 'Title Line 1\nTitle Line 2' },
                subtitle: { text: 'Subtitle Line 1\nSubtitle Line 2' },
                footnote: { text: 'Footnote Line 1\nFootnote Line 2' },
            });
            await compare();

            assertProxyBoundsMatchCanvas(chart.title);
            assertProxyBoundsMatchCanvas(chart.subtitle);
            assertProxyBoundsMatchCanvas(chart.footnote);

            // All proxy elements must be fully within the canvas area.
            for (const caption of [chart.title, chart.subtitle, chart.footnote]) {
                const proxyBBox = (caption as any).lastProxyBBox;
                expect(proxyBBox.y).toBeGreaterThanOrEqual(0);
                expect(proxyBBox.y + proxyBBox.height).toBeLessThanOrEqual(chart.height!);
            }
        });
    });

    // Caption scene nodes are long-lived and reused across updates, so disabling a caption must
    // actively reset `node.visible`; the enabled-only positioning path is skipped when disabled.
    describe('CRT-1148 disabling a caption hides its node', () => {
        const baseOptions = {
            data: [
                { x: 'A', y: 3 },
                { x: 'B', y: 5 },
            ],
            series: [{ type: 'bar' as const, xKey: 'x', yKey: 'y' }],
            legend: { enabled: false },
        };

        test.each(['title', 'subtitle', 'footnote'] as const)(
            'disabling %s hides the node, re-enabling shows it again',
            async (key) => {
                const proxy = AgCharts.create(
                    prepareTestOptions({ ...baseOptions, [key]: { text: 'Caption', enabled: true } })
                ) as AgChartProxy;
                const chartInstance = deproxy(proxy);
                await waitForChartStability(chartInstance);
                expect(chartInstance[key].node.visible).toBe(true);

                await proxy.update(prepareTestOptions({ ...baseOptions, [key]: { text: 'Caption', enabled: false } }));
                await waitForChartStability(chartInstance);
                expect(chartInstance[key].node.visible).toBe(false);

                await proxy.update(prepareTestOptions({ ...baseOptions, [key]: { text: 'Caption', enabled: true } }));
                await waitForChartStability(chartInstance);
                expect(chartInstance[key].node.visible).toBe(true);

                proxy.destroy();
            }
        );
    });

    describe('image segments', () => {
        // Captions accept `ContentSegment[]` directly (caption.ts), so `block: true` image segments
        // render through the same Text shape as treemap labels. These snapshots capture how block
        // images behave inside the centred caption layout.
        const iconSvg = (letter: string, fill: string) =>
            `data:image/svg+xml;utf8,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">` +
                    `<rect x="2" y="2" width="32" height="32" rx="6" fill="${fill}"/>` +
                    `<text x="18" y="24" text-anchor="middle" font-family="Verdana" font-size="18"` +
                    ` fill="white" font-weight="bold">${letter}</text></svg>`
            )}`;
        const LOGO = iconSvg('A', '#1f77b4');
        const INLINE = iconSvg('i', '#2ca02c');
        const URLS = { LOGO, INLINE };

        let preloaded: Record<string, SkiaImage> = {};
        beforeAll(async () => {
            const entries = await Promise.all(
                Object.values(URLS).map(async (url) => [url, await skiaLoadImage(url)] as const)
            );
            preloaded = Object.fromEntries(entries);
        });

        function stubChartImageLoader(chartInstance: Chart) {
            const imageLoader = (chartInstance.ctx.scene as any).imageLoader;
            imageLoader.loadImage = (uri: string) => preloaded[uri] as unknown as HTMLImageElement;
        }

        async function createStubbedChart(options: AgChartOptions) {
            chart = deproxy(AgCharts.create(prepareTestOptions({ ...options })) as any);
            stubChartImageLoader(chart);
            await compare();
            expectWarningsCalls().toHaveLength(0);
        }

        test('leading block image with a multi-line title column', async () => {
            await createStubbedChart({
                title: {
                    text: [
                        { type: 'image', url: LOGO, width: 40, height: 40, block: true, cornerRadius: 8 },
                        { text: 'Quarterly Report', fontWeight: 'bold' },
                        { text: '\nFY 2025' },
                    ],
                },
            });
        });

        test('block image in the subtitle', async () => {
            await createStubbedChart({
                title: { text: 'Sales Overview' },
                subtitle: {
                    text: [
                        { type: 'image', url: LOGO, width: 28, height: 28, block: true },
                        { text: 'North America', color: '#2ca02c' },
                    ],
                },
            });
        });

        test('block and inline image mix in a caption', async () => {
            await createStubbedChart({
                title: {
                    text: [
                        { type: 'image', url: LOGO, width: 40, height: 40, block: true, cornerRadius: 8 },
                        { text: 'Revenue ' },
                        { type: 'image', url: INLINE, width: 20, height: 20, verticalAlign: 'middle' },
                        { text: ' growth\nyear over year' },
                    ],
                },
            });
        });

        test.each(['left', 'center', 'right'] as const)(
            'block image with textAlign=%s (block rows left-anchored within the centred caption)',
            async (textAlign) => {
                await createStubbedChart({
                    title: {
                        textAlign,
                        text: [
                            { type: 'image', url: LOGO, width: 36, height: 36, block: true },
                            { text: 'Aligned title', fontWeight: 'bold' },
                            { text: '\nsecond line' },
                        ],
                    },
                });
            }
        );

        test('narrow caption wraps the text column beside the block image', async () => {
            await createStubbedChart({
                title: {
                    maxWidth: 260,
                    text: [
                        { type: 'image', url: LOGO, width: 40, height: 40, block: true },
                        {
                            text: 'A long caption title that must wrap into the narrow column beside the block image',
                            fontWeight: 'bold',
                        },
                    ],
                },
            });
        });

        test("oversized block image is dropped under default 'hide' so the title text still renders", async () => {
            await createStubbedChart({
                title: {
                    maxWidth: 300,
                    text: [
                        // Image far wider than the available caption width — the default 'hide'
                        // overflow strategy drops it and keeps the text.
                        { type: 'image', url: LOGO, width: 600, height: 600, block: true },
                        { text: 'Text survives oversized image', fontWeight: 'bold' },
                    ],
                },
            });
        });
    });
});
