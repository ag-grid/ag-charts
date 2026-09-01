import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import {
    compareImageSnapshot,
    deproxy,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';
import { DonutNodeTag } from './polar/donutSeries';

const ELLIPSIS = '…';

// Several series here still keep their label-fit options undocumented, so the label objects below are built
// untyped and cast at the AgCharts.create boundary; `setupMockConsole` fails on any "property is unknown".
describe('series label fit', () => {
    setupMockConsole();

    let chart: AgChartInstance;
    const ctx = setupMockCanvas();

    afterEach(() => {
        chart?.destroy();
    });

    const render = async (options: object) => {
        prepareTestOptions(options as any);
        chart = AgCharts.create(options as any);
        await waitForChartStability(chart);
    };

    const renderAndSnapshot = async (options: object) => {
        prepareTestOptions(options as any);
        chart = AgCharts.create(options as any);
        await compareImageSnapshot(chart, ctx);
    };

    // The text each label actually renders: `label.text` is the unfitted source, `label.fittedText` the text the
    // placement engine fitted to the candidate it chose, and a label the engine dropped renders nothing at all.
    const labelTexts = (seriesIndex = 0): unknown[] => {
        const series = deproxy(chart as any).series[seriesIndex] as unknown as {
            contextNodeData?: {
                labelData?: { label?: { text?: unknown; fittedText?: unknown; hidden?: boolean } }[];
            };
        };
        return (series.contextNodeData?.labelData ?? []).map((d) =>
            d.label == null || d.label.hidden === true ? '' : (d.label.fittedText ?? d.label.text)
        );
    };
    const someWrapped = (texts: unknown[]) => texts.some((text) => String(text).includes('\n'));
    const someTruncated = (texts: unknown[]) => texts.some((text) => String(text).includes(ELLIPSIS));

    const cartesianAxes = {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    };
    // Varied bar heights (values) paired with varied label lengths, so one chart shows short labels shown whole,
    // tall bars wrap a long label to fit, and the shortest bars wrap-then-ellipsise a long label that cannot.
    const barData = [
        { cat: 'A', value: 100, label: 'Short' },
        { cat: 'B', value: 90, label: 'One Two Three Four Five' },
        { cat: 'C', value: 80, label: 'A few words here' },
        { cat: 'D', value: 8, label: 'Another overly long label that overflows its narrow bar' },
        { cat: 'E', value: 60, label: 'Medium length label' },
        { cat: 'F', value: 10, label: 'A very long bar label that cannot fit inside a short bar' },
    ];
    const barChart = (label: object, data: object[] = barData) => ({
        data,
        legend: { enabled: false },
        axes: cartesianAxes,
        series: [
            {
                type: 'bar',
                xKey: 'cat',
                yKey: 'value',
                label: { enabled: true, formatter: (p: any) => p.datum.label, ...label },
            },
        ],
    });

    describe('bar (fits inside the bar rect)', () => {
        it('wraps and truncates mixed labels across bars of varied height', async () => {
            await renderAndSnapshot(barChart({ wrapping: 'on-space', truncate: true }));
            const texts = labelTexts();
            expect(someWrapped(texts)).toBe(true);
            expect(someTruncated(texts)).toBe(true);
        });

        it('honours an explicit maxWidth tighter than the bar rect, and defers to the rect when looser', async () => {
            // Whichever of maxWidth and the (halved) grouped-bar width is tighter governs the fit.
            const data = [
                { cat: 'A', a: 100, b: 100 },
                { cat: 'B', a: 70, b: 70 },
                { cat: 'C', a: 90, b: 90 },
                { cat: 'D', a: 50, b: 50 },
            ];
            const series = (yKey: string, maxWidth: number) => ({
                type: 'bar',
                xKey: 'cat',
                yKey,
                label: {
                    enabled: true,
                    maxWidth,
                    wrapping: 'never',
                    truncate: true,
                    formatter: () => 'A very long grouped bar label',
                },
            });
            await renderAndSnapshot({
                data,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [series('a', 20), series('b', 400)],
            });
            const tight = String(labelTexts(0).find((t) => t !== '' && t != null));
            const loose = String(labelTexts(1).find((t) => t !== '' && t != null));
            expect(tight).toContain(ELLIPSIS);
            expect(loose).toContain(ELLIPSIS);
            expect(tight.length).toBeLessThan(loose.length);
        });

        it('leaves every label untouched when truncation is not opted into (show)', async () => {
            // Moderate labels on tall bars so the untouched full text reads cleanly rather than overflowing into
            // neighbouring bars; the point of this case is that the show path never mutates the text.
            const showData = [
                { cat: 'A', value: 80, label: 'Alpha' },
                { cat: 'B', value: 60, label: 'Beta value' },
                { cat: 'C', value: 90, label: 'Gamma reading' },
                { cat: 'D', value: 70, label: 'Delta measure' },
            ];
            await renderAndSnapshot(barChart({}, showData));
            expect(labelTexts()).toEqual(showData.map((d) => d.label));
        });

        it('hides oversized labels when alwaysShow is false', async () => {
            await renderAndSnapshot(barChart({ collision: { alwaysShow: false } }));
            const texts = labelTexts();
            // alwaysShow: false → overflow 'hide': oversized labels are dropped to empty rather than ellipsised,
            // while labels that already fit their bar survive intact.
            expect(texts.some((text) => text === '' || text == null)).toBe(true);
            expect(someTruncated(texts)).toBe(false);
        });

        it('renders every label whole when wrapping is set with truncate disabled', async () => {
            // `wrapping: 'never'` with `truncate: false` leaves nothing to bound the text, so it overhangs its bar
            // untouched; `alwaysShow` is explicit because either option otherwise opts the label into hiding.
            await renderAndSnapshot(barChart({ wrapping: 'never', truncate: false, collision: { alwaysShow: true } }));
            expect(labelTexts()).toEqual(barData.map((d) => d.label));
        });

        it('drops rather than truncates an oversized label when truncate is disabled', async () => {
            // A wrapping mode turns `alwaysShow` off, so `truncate: false` leaves hiding as the only way to
            // honour the bar: labels that fit wrap, and those that cannot are dropped rather than ellipsised.
            await renderAndSnapshot(barChart({ wrapping: 'on-space', truncate: false }));
            const texts = labelTexts();
            expect(someWrapped(texts)).toBe(true);
            expect(someTruncated(texts)).toBe(false);
            expect(texts.some((text) => text === '' || text == null)).toBe(true);
        });

        it('truncates rather than hides an oversized label when a wrapping mode opts into truncation', async () => {
            // The wrapping mode resolves `truncate` to true, which outranks `alwaysShow: false`: every label is
            // kept, the oversized ones ellipsised rather than dropped.
            await renderAndSnapshot(barChart({ wrapping: 'on-space', collision: { alwaysShow: false } }));
            const texts = labelTexts();
            expect(texts.every((text) => typeof text === 'string' && text.length > 0)).toBe(true);
            expect(someWrapped(texts)).toBe(true);
            expect(someTruncated(texts)).toBe(true);
        });
    });

    it('wraps and truncates histogram bin labels across bins of varied frequency', async () => {
        const binLabels = ['Short', 'A longer bin label spanning words', 'Mid label', 'A very long bin label overflow'];
        await renderAndSnapshot({
            data: [0, 0, 1, 1, 1, 2, 2, 3, 10, 10, 20, 30, 30, 30, 30, 45].map((x) => ({ x })),
            legend: { enabled: false },
            axes: { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left' } },
            series: [
                {
                    type: 'histogram',
                    xKey: 'x',
                    label: {
                        enabled: true,
                        // Bin width governs wrapping; the small maxHeight caps the wrapped block so the longest
                        // labels resolve to an ellipsis while shorter ones fit.
                        maxHeight: 24,
                        wrapping: 'on-space',
                        truncate: true,
                        formatter: (p: any) => binLabels[p.binIndex % binLabels.length],
                    },
                },
            ],
        });
        expect(someTruncated(labelTexts())).toBe(true);
    });

    it('wraps and truncates line labels within an explicit maxWidth/maxHeight', async () => {
        // Line labels have no geometric container, so both bounds are explicit: maxWidth forces wrapping and
        // maxHeight caps the wrapped block so the longest labels resolve to an ellipsis.
        const pointLabels = ['Hi', 'Two words', 'A medium length label', 'A very long label that will not fit at all'];
        await renderAndSnapshot({
            // Mid-range y values keep every point's wrapped label clear of the canvas edges.
            data: [
                { x: 0, y: 40, label: pointLabels[0] },
                { x: 1, y: 55, label: pointLabels[1] },
                { x: 2, y: 45, label: pointLabels[2] },
                { x: 3, y: 60, label: pointLabels[3] },
            ],
            legend: { enabled: false },
            axes: {
                x: { type: 'number', position: 'bottom' },
                y: { type: 'number', position: 'left', min: 0, max: 100 },
            },
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    marker: { enabled: true },
                    label: {
                        enabled: true,
                        maxWidth: 50,
                        maxHeight: 32,
                        wrapping: 'on-space',
                        truncate: true,
                        formatter: (p: any) => p.datum.label,
                    },
                },
            ],
        });
        const texts = labelTexts();
        expect(someWrapped(texts)).toBe(true);
        expect(someTruncated(texts)).toBe(true);
    });

    // Sector labels auto-fit the wedge, so wrapping/truncate shrink them without any explicit maxWidth.
    const sectorLabelData = [
        { value: 26, label: 'Q1' },
        { value: 22, label: 'Two words here' },
        { value: 20, label: 'A medium length label' },
        { value: 18, label: 'A rather long label that wraps across several lines then runs out of room' },
        { value: 14, label: 'Another fairly long caption spanning multiple words and lines here too' },
    ];
    // Donut fits the sector text into the rendered label node at draw time (not the datum), so read the visible
    // label nodes rather than getNodeData(), which still holds the original unfitted text.
    const sectorTexts = (seriesIndex = 0): unknown[] => {
        const series = deproxy(chart as any).series[seriesIndex] as unknown as {
            labelSelection?: { nodes: () => { visible: boolean; text?: unknown }[] };
        };
        return (series.labelSelection?.nodes() ?? []).filter((node) => node.visible).map((node) => node.text);
    };

    type SectorLabelNode = { visible: boolean; text: string; fontSize: number };
    const sectorNodes = (seriesIndex = 0): SectorLabelNode[] => {
        const series = deproxy(chart as any).series[seriesIndex] as unknown as {
            labelSelection?: { nodes: () => SectorLabelNode[] };
        };
        return (series.labelSelection?.nodes() ?? []).filter((node) => node.visible && node.text !== '');
    };

    // A sector label the wedge rejected: the fit wrote text onto the node, and the visibility gate then
    // hid it whole. Text fitted to nothing renders nothing and is hidden by design, so it does not count.
    const hiddenSectorNodes = (seriesIndex = 0): SectorLabelNode[] => {
        const series = deproxy(chart as any).series[seriesIndex] as unknown as {
            labelSelection?: { nodes: () => SectorLabelNode[] };
        };
        return (series.labelSelection?.nodes() ?? []).filter((node) => !node.visible && node.text !== '');
    };

    // Wide enough for a bounded label to read as a wrap rather than a column of single words.
    const SECTOR_MAX_WIDTH = 90;

    const sectorLineWidths = (seriesIndex = 0): number[] => {
        const series = deproxy(chart as any).series[seriesIndex] as unknown as {
            labelSelection?: { nodes: () => (SectorLabelNode & { getLineBoxes: () => { width: number }[] })[] };
        };
        return (series.labelSelection?.nodes() ?? [])
            .filter((node) => node.visible)
            .flatMap((node) => node.getLineBoxes().map((box) => box.width));
    };

    const calloutNodes = (seriesIndex = 0): SectorLabelNode[] => {
        const series = deproxy(chart as any).series[seriesIndex] as unknown as {
            calloutLabelSelection: { selectByTag: (tag: number) => SectorLabelNode[] };
        };
        return series.calloutLabelSelection
            .selectByTag(DonutNodeTag.CalloutLabel)
            .filter((node) => node.visible && node.text !== '');
    };

    // Collision avoidance shrinks the pie to fit the callout labels it measured, so a smaller label leaves a larger pie.
    const sectorRadius = (seriesIndex = 0): number => {
        const series = deproxy(chart as any).series[seriesIndex] as unknown as {
            getNodeData: () => { outerRadius: number }[] | undefined;
        };
        return series.getNodeData()?.[0]?.outerRadius ?? 0;
    };

    // Enough sectors that their callout labels crowd each other, so collision avoidance has to hide some.
    const crowdedCalloutData = Array.from({ length: 14 }, (_, i) => ({
        value: 10,
        label: `Region ${i} of the survey`,
    }));

    for (const type of ['pie', 'donut'] as const) {
        it(`auto-fits ${type} sector labels to the wedge with wrapping and truncation`, async () => {
            await renderAndSnapshot({
                data: sectorLabelData,
                legend: { enabled: false },
                series: [
                    {
                        type,
                        angleKey: 'value',
                        sectorLabelKey: 'label',
                        // Widen the donut ring so a label has radial room to wrap before truncating (donut-only option).
                        ...(type === 'donut' ? { innerRadiusRatio: 0.3 } : {}),
                        sectorLabel: { enabled: true, wrapping: 'on-space', truncate: true },
                    },
                ],
            });
            const texts = sectorTexts();
            expect(someWrapped(texts)).toBe(true);
            // Nothing is ellipsised here: fitting the text to the wedge rather than to one rectangle
            // inside it leaves room for even the longest label. Truncation is covered below, where the
            // wedges are genuinely too small for the same labels.
            expect(someTruncated(texts)).toBe(false);
        });

        it(`ellipsises ${type} sector labels the wedge cannot hold at any width`, async () => {
            await renderAndSnapshot({
                data: sectorLabelData,
                legend: { enabled: false },
                series: [
                    {
                        type,
                        angleKey: 'value',
                        sectorLabelKey: 'label',
                        ...(type === 'donut' ? { innerRadiusRatio: 0.3 } : {}),
                        // Text far too large for these wedges: the fit runs out of room however it wraps.
                        sectorLabel: { enabled: true, wrapping: 'on-space', truncate: true, fontSize: 40 },
                    },
                ],
            });
            // Only the smallest wedge ends in an ellipsis: see the known limitation in textWrapper.test.ts,
            // where a band narrowed to nothing drops the rest of the text without marking it.
            expect(someTruncated(sectorTexts())).toBe(true);
        });

        it(`bounds ${type} sector labels by an explicit maxWidth`, async () => {
            await renderAndSnapshot({
                data: sectorLabelData,
                legend: { enabled: false },
                series: [
                    {
                        type,
                        angleKey: 'value',
                        sectorLabelKey: 'label',
                        ...(type === 'donut' ? { innerRadiusRatio: 0.3 } : {}),
                        sectorLabel: { enabled: true, maxWidth: SECTOR_MAX_WIDTH },
                    },
                ],
            });
            const texts = sectorTexts();
            expect(someWrapped(texts)).toBe(true);
            // Whether the wedge also runs out of room is the ellipsis test's business above; what this one
            // owns is that every drawn line answers to the bound.
            expect(Math.max(...sectorLineWidths())).toBeLessThanOrEqual(SECTOR_MAX_WIDTH);
        });

        it(`shrinks ${type} sector labels toward minimumFontSize before truncating`, async () => {
            const sectorLabel = { enabled: true, fontSize: 16, wrapping: 'never' as const, truncate: true };
            await render({
                data: sectorLabelData,
                legend: { enabled: false },
                series: [
                    {
                        type,
                        angleKey: 'value',
                        sectorLabelKey: 'label',
                        ...(type === 'donut' ? { innerRadiusRatio: 0.3 } : {}),
                        sectorLabel: { ...sectorLabel, minimumFontSize: 5 },
                    },
                ],
            });
            const shrunk = sectorNodes();
            expect(shrunk.length).toBeGreaterThan(0);
            expect(shrunk.some((node) => node.fontSize < 16)).toBe(true);
            expect(shrunk.every((node) => node.fontSize >= 5)).toBe(true);

            chart.destroy();
            await render({
                data: sectorLabelData,
                legend: { enabled: false },
                series: [
                    {
                        type,
                        angleKey: 'value',
                        sectorLabelKey: 'label',
                        ...(type === 'donut' ? { innerRadiusRatio: 0.3 } : {}),
                        sectorLabel,
                    },
                ],
            });
            const unshrunk = sectorNodes();
            expect(unshrunk.every((node) => node.fontSize === 16)).toBe(true);
            // Shrinking buys text back: what truncates at the configured size survives at a smaller one.
            expect(someTruncated(shrunk.map((node) => node.text))).toBe(false);
            expect(someTruncated(unshrunk.map((node) => node.text))).toBe(true);
        });

        it(`shrinks ${type} callout labels toward minimumFontSize before truncating`, async () => {
            await render({
                data: sectorLabelData,
                legend: { enabled: false },
                series: [
                    {
                        type,
                        angleKey: 'value',
                        calloutLabelKey: 'label',
                        calloutLabel: {
                            enabled: true,
                            avoidCollisions: false,
                            maxWidth: 80,
                            wrapping: 'never',
                            truncate: true,
                            minimumFontSize: 5,
                        },
                    },
                ],
            });
            const rendered = calloutNodes();
            expect(rendered.length).toBeGreaterThan(0);
            expect(rendered.some((node) => node.fontSize < 12)).toBe(true);
            expect(rendered.every((node) => node.fontSize >= 5)).toBe(true);
        });

        it(`composes ${type} callout label fitting with avoidCollisions`, async () => {
            // Collision avoidance reserves the fitted text's box, so a shrunk label frees radius for the pie.
            const calloutLabel = {
                enabled: true,
                avoidCollisions: true,
                fontSize: 16,
                maxWidth: 90,
                wrapping: 'never' as const,
                truncate: true,
            };
            const chartOf = (label: object) => ({
                data: crowdedCalloutData,
                legend: { enabled: false },
                series: [{ type, angleKey: 'value', calloutLabelKey: 'label', calloutLabel: label }],
            });

            await render(chartOf({ ...calloutLabel, minimumFontSize: 5 }));
            const shrunk = calloutNodes();
            const shrunkRadius = sectorRadius();
            expect(shrunk.some((node) => node.fontSize < 16)).toBe(true);

            chart.destroy();
            await render(chartOf(calloutLabel));
            expect(calloutNodes().every((node) => node.fontSize === 16)).toBe(true);
            expect(shrunkRadius).toBeGreaterThan(sectorRadius());
        });

        it(`fits ${type} callout labels to the font an itemStyler resolves`, async () => {
            const calloutLabel = {
                enabled: true,
                avoidCollisions: false,
                fontSize: 20,
                maxWidth: 70,
                wrapping: 'never' as const,
                truncate: true,
                minimumFontSize: 6,
            };
            const chartOf = (label: object) => ({
                data: sectorLabelData,
                legend: { enabled: false },
                series: [{ type, angleKey: 'value', calloutLabelKey: 'label', calloutLabel: label }],
            });
            const drawn = () => calloutNodes().map((node) => [node.fontSize, node.text]);

            // A styler resolving a font is equivalent to configuring the same font on the series, so a fit that
            // measured the series font instead would wrap and truncate against metrics the label is not drawn in.
            await render(chartOf({ ...calloutLabel, fontFamily: 'monospace' }));
            const configured = drawn();
            expect(configured.length).toBeGreaterThan(0);

            chart.destroy();
            await render(chartOf({ ...calloutLabel, itemStyler: () => ({ fontFamily: 'monospace' }) }));
            expect(drawn()).toEqual(configured);
        });

        it(`bounds ${type} callout labels by an explicit maxWidth`, async () => {
            await renderAndSnapshot({
                data: sectorLabelData,
                legend: { enabled: false },
                series: [
                    {
                        type,
                        angleKey: 'value',
                        calloutLabelKey: 'label',
                        calloutLabel: { enabled: true, maxWidth: 30, wrapping: 'on-space', truncate: true },
                    },
                ],
            });
            const texts = calloutNodes().map((node) => node.text);
            expect(someWrapped(texts)).toBe(true);
            expect(someTruncated(texts)).toBe(true);
        });
        // A fit that overruns the wedge leaves the label hidden whole, so text fitted at any size has to
        // stay inside the wedge it was fitted to.
        it(`keeps ${type} sector labels inside their wedge at every chart size`, async () => {
            const sizes: number[] = [];
            for (let size = 380; size <= 620; size += 20) {
                sizes.push(size);
            }
            const dropped: string[] = [];
            for (const size of sizes) {
                const options: any = {
                    data: sectorLabelData,
                    legend: { enabled: false },
                    series: [
                        {
                            type,
                            angleKey: 'value',
                            sectorLabelKey: 'label',
                            ...(type === 'donut' ? { innerRadiusRatio: 0.3 } : {}),
                            sectorLabel: { enabled: true, fontSize: 24, wrapping: 'on-space', truncate: true },
                        },
                    ],
                };
                prepareTestOptions(options);
                // prepareTestOptions fixes the canvas size, so the size under test is applied after it.
                options.width = size;
                options.height = size;
                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                for (const node of hiddenSectorNodes()) {
                    dropped.push(`${size}px: ${JSON.stringify(node.text)}`);
                }
                chart.destroy();
            }
            expect(dropped).toEqual([]);
        });
    }

    it('centres bubble labels inside large markers and truncates those overflowing small markers', async () => {
        // `placement: 'inside'` fits each label to its marker: big bubbles hold their label, small bubbles
        // ellipsise one that cannot fit. Sizes and label lengths are mixed so one image shows both outcomes.
        const bubbleData = [
            { x: 0, y: 50, size: 100, label: 'Big' },
            { x: 1, y: 55, size: 90, label: 'Large' },
            { x: 2, y: 45, size: 40, label: 'Tiny bubble label' },
            { x: 3, y: 60, size: 70, label: 'Mid' },
            { x: 4, y: 40, size: 44, label: 'Another long label' },
        ];
        await renderAndSnapshot({
            data: bubbleData,
            legend: { enabled: false },
            axes: {
                x: { type: 'number', position: 'bottom' },
                y: { type: 'number', position: 'left', min: 0, max: 100 },
            },
            series: [
                {
                    type: 'bubble',
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    labelKey: 'label',
                    minSize: 40,
                    maxSize: 100,
                    // Small bubbles overflow their label onto the background, where the inside default is invisible.
                    label: {
                        enabled: true,
                        placement: 'inside',
                        insideStyle: { color: { ref: 'textColor' } },
                        formatter: (p: any) => p.datum.label,
                    },
                },
            ],
        });
        const texts = labelTexts();
        // No label is dropped; small bubbles ellipsise the overflow while large bubbles keep their label whole.
        expect(texts.every((text) => typeof text === 'string' && text.length > 0)).toBe(true);
        expect(someTruncated(texts)).toBe(true);
    });

    // The placement engine centres the padded box, so a boxed inside label's text must be inset by the label
    // padding to sit centred on the marker; bubble/scatter render their own label nodes and must do the same.
    const boxedInsideLabel = {
        enabled: true,
        placement: 'inside',
        fill: '#ffffff',
        padding: 8,
        // The inside default resolves to the chart background, which is invisible on this white box.
        insideStyle: { color: { ref: 'textColor' } },
        formatter: () => 'Revenue',
    };
    const singlePointAxes = {
        x: { type: 'number', position: 'bottom', min: 0, max: 2 },
        y: { type: 'number', position: 'left', min: 0, max: 100 },
    };

    it('centres a boxed inside label on a bubble marker', async () => {
        await renderAndSnapshot({
            data: [{ x: 1, y: 50, size: 100 }],
            legend: { enabled: false },
            axes: singlePointAxes,
            series: [
                {
                    type: 'bubble',
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    minSize: 120,
                    maxSize: 120,
                    label: boxedInsideLabel,
                },
            ],
        });
        expect(labelTexts()).toContain('Revenue');
    });

    it('centres a boxed inside label on a scatter marker', async () => {
        await renderAndSnapshot({
            data: [{ x: 1, y: 50 }],
            legend: { enabled: false },
            axes: singlePointAxes,
            series: [{ type: 'scatter', xKey: 'x', yKey: 'y', size: 120, label: boxedInsideLabel }],
        });
        expect(labelTexts()).toContain('Revenue');
    });

    it('centres a boxed inside label on a non-centred (pin) marker shape', async () => {
        await renderAndSnapshot({
            data: [{ x: 1, y: 50 }],
            legend: { enabled: false },
            axes: singlePointAxes,
            series: [{ type: 'scatter', xKey: 'x', yKey: 'y', shape: 'pin', size: 220, label: boxedInsideLabel }],
        });
        expect(labelTexts().some((text) => typeof text === 'string' && text.length > 0)).toBe(true);
    });

    // Line feeds `marker.size` straight into the inside-marker container, so it isolates the shape
    // factor with a fully-controlled marker diameter (bubble/scatter derive size from the size scale).
    const insideLineSeries = (shape: string, size: number) => ({
        type: 'line',
        xKey: 'x',
        yKey: 'y',
        marker: { enabled: true, shape, size },
        label: { enabled: true, placement: 'inside', truncate: true, formatter: () => 'Revenue growth' },
    });
    const insideAxes = {
        x: { type: 'number', position: 'bottom', min: -1, max: 3 },
        y: { type: 'number', position: 'left', min: 0, max: 100 },
    };
    const lineData = [
        { x: 0, y: 50 },
        { x: 1, y: 55 },
        { x: 2, y: 45 },
    ];

    it('fits progressively less label text as the marker box shrinks by shape', async () => {
        const fittedText = async (shape: string) => {
            const options = {
                data: lineData,
                legend: { enabled: false },
                axes: insideAxes,
                series: [insideLineSeries(shape, 60)],
            };
            prepareTestOptions(options as any);
            chart = AgCharts.create(options as any);
            await waitForChartStability(chart);
            const text = String(labelTexts()[0] ?? '');
            chart.destroy();
            return text;
        };
        const [square, circle, diamond] = [
            await fittedText('square'),
            await fittedText('circle'),
            await fittedText('diamond'),
        ];
        const visibleChars = (text: string) => text.replace(/\n/g, '').replace(ELLIPSIS, '').length;
        // The box shrinks square (whole marker) > circle (inscribed square) > diamond (inscribed square
        // of the diamond), so the same label survives whole in the square but truncates ever harder.
        expect(square).toContain('growth');
        expect(square).not.toContain(ELLIPSIS);
        expect(circle.endsWith(ELLIPSIS)).toBe(true);
        expect(diamond.endsWith(ELLIPSIS)).toBe(true);
        expect(visibleChars(square)).toBeGreaterThan(visibleChars(circle));
        expect(visibleChars(circle)).toBeGreaterThan(visibleChars(diamond));
    });

    it('centres and fits inside labels within square and diamond markers', async () => {
        // A square uses its full box; a diamond its inscribed square. The image proves the fitted text
        // stays within each visible shape.
        await renderAndSnapshot({
            data: lineData,
            legend: { enabled: false },
            axes: insideAxes,
            series: [
                { ...insideLineSeries('square', 90), yKey: 'y' },
                {
                    data: lineData.map((d) => ({ x: d.x, y2: d.y - 20 })),
                    ...insideLineSeries('diamond', 90),
                    yKey: 'y2',
                },
            ],
        });
        expect(labelTexts(0).some((text) => typeof text === 'string' && text.length > 0)).toBe(true);
    });

    it('centres a boxed inside label on an anchored (pin) marker across line and area', async () => {
        // A pin is drawn anchored at its tip, so its label must ride up into the head. Line and area
        // apply the marker anchor the way bubble/scatter do — without it the label strands at the tip.
        await renderAndSnapshot({
            data: lineData,
            legend: { enabled: false },
            axes: insideAxes,
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    marker: { enabled: true, shape: 'pin', size: 200 },
                    label: boxedInsideLabel,
                },
                {
                    data: lineData.map((d) => ({ x: d.x, y2: d.y - 25 })),
                    type: 'area',
                    xKey: 'x',
                    yKey: 'y2',
                    marker: { enabled: true, shape: 'pin', size: 200 },
                    label: boxedInsideLabel,
                },
            ],
        });
        expect(labelTexts(0).some((text) => typeof text === 'string' && text.length > 0)).toBe(true);
        expect(labelTexts(1).some((text) => typeof text === 'string' && text.length > 0)).toBe(true);
    });

    it('truncates rather than drops an inside label a concave star marker cannot fully hold', async () => {
        // The star's narrow raw-outline box cannot hold this label at this diameter. Inside labels
        // ellipsise on overflow rather than hide, so the label survives truncated instead of vanishing.
        await renderAndSnapshot({
            data: lineData,
            legend: { enabled: false },
            axes: insideAxes,
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    marker: { enabled: true, shape: 'star', size: 100 },
                    label: { ...boxedInsideLabel, formatter: () => 'Quarterly revenue growth' },
                },
            ],
        });
        const texts = labelTexts();
        expect(texts.every((text) => typeof text === 'string' && text.length > 0)).toBe(true);
        expect(someTruncated(texts)).toBe(true);
    });

    it('ellipsises an inside label with truncate unset rather than hiding it when the marker is too small', async () => {
        // Inside-marker labels default their overflow strategy to ellipsis, not hide, so a marker too
        // small for the full text still renders a truncated label rather than nothing at all.
        await renderAndSnapshot({
            data: lineData,
            legend: { enabled: false },
            axes: insideAxes,
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    marker: { enabled: true, shape: 'circle', size: 40 },
                    label: { enabled: true, placement: 'inside', formatter: () => 'Quarterly revenue growth' },
                },
            ],
        });
        const texts = labelTexts();
        expect(texts.every((text) => typeof text === 'string' && text.length > 0)).toBe(true);
        expect(someTruncated(texts)).toBe(true);
    });

    it('scales an inside label to a complex (heart) marker across data-driven sizes', async () => {
        // Bubble derives each marker's diameter from the size scale, so the fit is per-datum.
        const heartData = [
            { x: 0, y: 55, size: 9, label: 'Quarterly revenue growth' },
            { x: 1, y: 50, size: 4, label: 'Quarterly revenue growth' },
            { x: 2, y: 45, size: 1, label: 'Quarterly revenue growth' },
        ];
        await renderAndSnapshot({
            data: heartData,
            legend: { enabled: false },
            axes: {
                x: { type: 'number', position: 'bottom', min: -1, max: 3 },
                y: { type: 'number', position: 'left', min: 0, max: 100 },
            },
            series: [
                {
                    type: 'bubble',
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    labelKey: 'label',
                    showInLegend: false,
                    minSize: 60,
                    maxSize: 260,
                    shape: 'heart',
                    label: { enabled: true, placement: 'inside', truncate: true, formatter: (p: any) => p.datum.label },
                },
            ],
        });
        const visibleChars = (text: unknown) => String(text ?? '').replace(ELLIPSIS, '').length;
        const [big, mid, small] = labelTexts().map(visibleChars);
        // Larger hearts hold at least as much of the label as smaller ones, and the smallest truncates.
        expect(big).toBeGreaterThanOrEqual(mid);
        expect(mid).toBeGreaterThanOrEqual(small);
        expect(big).toBeGreaterThan(small);
        expect(small).toBeGreaterThan(0);
    });
});
