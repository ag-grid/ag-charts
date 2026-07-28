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

const ELLIPSIS = '…';

// Consolidated cross-series coverage for the label-fit surface (`maxWidth`/`maxHeight`/`wrapping`/`truncate`).
// These are undocumented options, so the label objects below are built untyped and cast at the AgCharts.create
// boundary. `setupMockConsole` fails the test on any "property is unknown" warning, so every case also proves the
// fit options are accepted on the series' label. Each snapshot deliberately mixes label lengths and item sizes so a
// single image exercises the whole spectrum — labels shown whole, wrapped across lines, and wrapped-then-ellipsised.
// Bar and histogram fit their labels to their own geometry (bar rect / bin), so truncation applies with no explicit
// bound; line is representative of the explicit-bounds path.
describe('series label fit', () => {
    setupMockConsole();

    let chart: AgChartInstance;
    const ctx = setupMockCanvas();

    afterEach(() => {
        chart?.destroy();
    });

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
            // Two grouped bar series share the same long label. Series A's maxWidth (20) is tighter than the (halved)
            // grouped-bar width, so the explicit bound governs and truncates hard; series B's maxWidth (400) is far
            // looser than the bar, so the rect governs and more text survives.
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
            // An explicit `truncate: false` survives the wrapping trigger, and `wrapping: 'never'` is excluded
            // from the `alwaysShow` trigger, so nothing bounds the text and it overhangs its bar untouched.
            await renderAndSnapshot(barChart({ wrapping: 'never', truncate: false }));
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

    // Pie/donut sector labels auto-fit the wedge: the series computes the room each sector offers a horizontal
    // label and fits the text to it, so wrapping/truncate alone shrink the label to its sector without any
    // explicit maxWidth (mirroring how a bar label fits its rect). Mixed sector sizes and label lengths show the
    // spectrum in one image — short labels whole, longer ones wrapped, the longest wrapped-then-ellipsised.
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
            expect(someTruncated(texts)).toBe(true);
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
                    label: { enabled: true, placement: 'inside', formatter: (p: any) => p.datum.label },
                },
            ],
        });
        const texts = labelTexts();
        // No label is dropped; small bubbles ellipsise the overflow while large bubbles keep their label whole.
        expect(texts.every((text) => typeof text === 'string' && text.length > 0)).toBe(true);
        expect(someTruncated(texts)).toBe(true);
    });

    // A boxed inside label must sit centred on the marker. The placement engine centres the padded box, so
    // the text has to be inset by the label padding — this only surfaces for boxed labels (unboxed padding is
    // 0, which is why it went unnoticed). Bubble/scatter render their own label nodes, so these guard that they
    // apply the inset like the shared line/area path, including on a non-centred (pin) marker whose inscribed
    // label rectangle sits away from the marker centre.
    const boxedInsideLabel = {
        enabled: true,
        placement: 'inside',
        fill: '#ffffff',
        padding: 8,
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
        // Bubble derives each marker's diameter from the size scale, so this exercises the per-datum fit:
        // a heart uses a conservative central box, and the same label survives in big hearts but is
        // truncated (then hidden) as the marker shrinks.
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
