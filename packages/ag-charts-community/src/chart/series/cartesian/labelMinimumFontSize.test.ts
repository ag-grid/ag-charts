import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import {
    compareImageSnapshot,
    deproxy,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

const ELLIPSIS = '…';
const FONT_SIZE = 20;

// `label.minimumFontSize` lets a bar-family label shrink into its bar instead of wrapping, truncating or
// hiding. Bar and histogram cover the community half of the family (waterfall and range-bar are covered
// in the enterprise suite); assertions read the drawn glyph size off the scene graph rather than
// re-deriving it, so they check what the fit layer actually put on the canvas.
describe('label minimumFontSize', () => {
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

    type LabelNode = { visible: boolean; fontSize: number; text: string };
    const labels = (seriesIndex = 0): LabelNode[] => {
        const series = deproxy(chart as any).series[seriesIndex] as unknown as {
            labelSelection: { nodes(): LabelNode[] };
        };
        return series.labelSelection.nodes().filter((node) => node.visible && node.text !== '');
    };
    const fontSizes = (seriesIndex = 0) => labels(seriesIndex).map((node) => node.fontSize);

    const axes = { x: { type: 'category', position: 'bottom' }, y: { type: 'number', position: 'left' } };
    // Six bars in the harness' fixed canvas leaves each far too narrow for its label at 20px, so the fit
    // layer has to act; 16px is still too large, which is what the minimum-floor cases below rely on.
    const data = Array.from({ length: 6 }, (_, i) => ({
        cat: `Cat ${i}`,
        value: 100 - i,
        label: `Alpha Bravo Charlie ${i}`,
    }));
    const barChart = (label: object, type = 'bar') => ({
        data,
        legend: { enabled: false },
        axes,
        series: [
            {
                type,
                xKey: 'cat',
                yKey: 'value',
                label: {
                    enabled: true,
                    fontSize: FONT_SIZE,
                    placement: 'inside-center',
                    wrapping: 'never',
                    formatter: (p: any) => p.datum.label,
                    ...label,
                },
            },
        ],
    });

    it('leaves the label at its configured size when minimumFontSize is unset', async () => {
        await render(barChart({ truncate: true }));
        expect(fontSizes()).toEqual(data.map(() => FONT_SIZE));
        expect(labels().some((node) => node.text.includes(ELLIPSIS))).toBe(true);
    });

    it('opts the label into overflow management when set on its own', async () => {
        // Like its sibling fit options, `minimumFontSize` alone resolves the rest of the set, so the
        // label is bounded by its bar — wrapped into it, shrunk into it, or both.
        await render(barChart({ wrapping: undefined, minimumFontSize: 4 }));
        const rendered = labels();
        expect(rendered.length).toBe(data.length);
        expect(rendered.every((node) => node.text.includes('\n') || node.fontSize < FONT_SIZE)).toBe(true);
    });

    it('shrinks a bar label to fit its bar rather than truncating it', async () => {
        await render(barChart({ truncate: true, minimumFontSize: 4 }));
        const rendered = labels();
        expect(rendered.length).toBe(data.length);
        for (const node of rendered) {
            expect(node.fontSize).toBeLessThan(FONT_SIZE);
            expect(node.fontSize).toBeGreaterThanOrEqual(4);
            expect(node.text).not.toContain(ELLIPSIS);
        }
    });

    it('stops shrinking at minimumFontSize and truncates from there', async () => {
        // 16px is still far too large for these bars, so the ellipsis takes over at the floor.
        await render(barChart({ truncate: true, minimumFontSize: 16 }));
        const rendered = labels();
        expect(rendered.map((node) => node.fontSize)).toEqual(rendered.map(() => 16));
        expect(rendered.some((node) => node.text.includes(ELLIPSIS))).toBe(true);
    });

    it('stops shrinking at minimumFontSize and hides from there when alwaysShow is false', async () => {
        await render(barChart({ truncate: false, minimumFontSize: 16, collision: { alwaysShow: false } }));
        const rendered = labels();
        expect(rendered.every((node) => !node.text.includes(ELLIPSIS))).toBe(true);
        expect(rendered.length).toBeLessThan(data.length);
    });

    it('shrinks a label the placement cascade is testing, so an earlier candidate can win', async () => {
        // Without a minimum no label fits inside, so every one cascades out to `outside-end`. Allowed to
        // shrink, they fit the bar and the first candidate wins instead.
        const cascade = { placement: ['inside-center', 'outside-end'], truncate: false };
        await render(barChart({ ...cascade, collision: { alwaysShow: false } }));
        const withoutShrink = labels().length;

        chart.destroy();
        await render(barChart({ ...cascade, minimumFontSize: 4, collision: { alwaysShow: false } }));
        const shrunk = labels();
        expect(shrunk.length).toBeGreaterThanOrEqual(withoutShrink);
        expect(shrunk.every((node) => node.fontSize < FONT_SIZE)).toBe(true);
    });

    it('shrinks a label the orientation cascade is testing', async () => {
        // An orientation array routes through the engine's own fit rather than the baked one. Shrinking
        // is preferred over falling through, so the upright candidate now wins at a reduced size.
        await render(barChart({ orientation: ['horizontal', 'vertical'], truncate: true, minimumFontSize: 4 }));
        const rendered = labels();
        expect(rendered.length).toBe(data.length);
        for (const node of rendered) {
            expect(node.fontSize).toBeLessThan(FONT_SIZE);
            expect(node.text).not.toContain(ELLIPSIS);
        }
    });

    it('wraps and shrinks together, landing on the largest size the wrapped text fits at', async () => {
        // Only `overflowStrategy` is overridden while the search runs, so each candidate size is wrapped
        // before it is measured: the label lands at the largest size whose wrapped text fits the bar.
        // Short bars make height the binding constraint, which wrapping alone cannot satisfy here.
        const short = { ...barChart({ wrapping: 'on-space', truncate: true, minimumFontSize: 4 }) };
        short.data = data.map((datum, i) => ({ ...datum, value: 9 + i }));
        short.axes = { ...axes, y: { ...axes.y, max: 100 } } as typeof axes;
        await render(short);
        const rendered = labels();
        expect(rendered.length).toBe(data.length);
        for (const node of rendered) {
            expect(node.text).toContain('\n');
            expect(node.fontSize).toBeLessThan(FONT_SIZE);
            expect(node.text).not.toContain(ELLIPSIS);
        }
    });

    it('reduces from the itemStyler-resolved font size', async () => {
        // The styler halves the configured size, so the search starts from 10px and can only go below it.
        await render(barChart({ truncate: true, minimumFontSize: 4, itemStyler: () => ({ fontSize: 10 }) }));
        for (const node of labels()) {
            expect(node.fontSize).toBeLessThan(10);
        }
    });

    // One image per series type, each packing the whole spectrum into a single render: labels that fit
    // untouched, labels shrunk to fit, and labels that reach the floor and truncate from there. The
    // scene-graph cases above pin the exact sizes; these pin how the sizes look side by side.
    describe('visual', () => {
        it('renders bar labels across the shrink spectrum', async () => {
            // Four grouped series over the same bars, so one image compares four configurations at matching
            // bar widths: no floor at all (truncates at 20px), a low floor without wrapping (shrinks on one
            // line), the same floor with wrapping (wraps and shrinks together), and a high floor with
            // wrapping (wraps, reaches 14px, then truncates).
            const grouped = [
                { cat: 'Alpha', a: 90, b: 72, c: 54, d: 36, short: 'Ore', mid: 'Iron', long: 'Iron ore refining' },
                { cat: 'Bravo', a: 80, b: 64, c: 48, d: 32, short: 'Gas', mid: 'Gases', long: 'Natural gas depot' },
                { cat: 'Charlie', a: 70, b: 56, c: 42, d: 28, short: 'Oil', mid: 'Crude', long: 'Crude oil supply' },
            ];
            const series = (yKey: string, labelKey: string, extra: object) => ({
                type: 'bar',
                xKey: 'cat',
                yKey,
                label: {
                    enabled: true,
                    fontSize: FONT_SIZE,
                    placement: 'inside-center',
                    wrapping: 'never',
                    truncate: true,
                    collision: { alwaysShow: true },
                    formatter: (p: any) => p.datum[labelKey],
                    ...extra,
                },
            });
            await renderAndSnapshot({
                data: grouped,
                legend: { enabled: false },
                axes,
                series: [
                    series('a', 'short', {}),
                    series('b', 'mid', { minimumFontSize: 6 }),
                    series('c', 'long', { minimumFontSize: 6, wrapping: 'on-space' }),
                    series('d', 'long', { minimumFontSize: 14, wrapping: 'on-space' }),
                ],
            });
        });

        it('renders histogram labels across the shrink spectrum', async () => {
            // Unequal bins give each label a different width to fit into, so a single series covers the
            // spectrum: the wide bins hold their label on one line, the narrow ones wrap and shrink
            // together, and the narrowest reach the 12px floor and truncate from there.
            await renderAndSnapshot({
                data: Array.from({ length: 120 }, (_, i) => ({ x: i % 40 })),
                legend: { enabled: false },
                axes: { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left' } },
                series: [
                    {
                        type: 'histogram',
                        xKey: 'x',
                        bins: [
                            [0, 4],
                            [4, 12],
                            [12, 13],
                            [13, 27],
                            [27, 30],
                            [30, 40],
                        ],
                        label: {
                            enabled: true,
                            fontSize: FONT_SIZE,
                            placement: 'inside-center',
                            wrapping: 'on-space',
                            truncate: true,
                            minimumFontSize: 12,
                            collision: { alwaysShow: true },
                            formatter: (p: any) => `Bin ${p.binRange[0]} to ${p.binRange[1]}`,
                        },
                    },
                ],
            });
        });
    });

    it('shrinks histogram labels to fit their bins', async () => {
        await render({
            data: Array.from({ length: 60 }, (_, i) => ({ x: i })),
            legend: { enabled: false },
            axes: { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left' } },
            series: [
                {
                    type: 'histogram',
                    xKey: 'x',
                    binCount: 8,
                    label: {
                        enabled: true,
                        fontSize: FONT_SIZE,
                        placement: 'inside-center',
                        wrapping: 'never',
                        truncate: true,
                        minimumFontSize: 4,
                        formatter: () => 'Frequency count',
                    },
                },
            ],
        });
        const rendered = labels();
        expect(rendered.length).toBeGreaterThan(0);
        for (const node of rendered) {
            expect(node.fontSize).toBeLessThan(FONT_SIZE);
            expect(node.text).not.toContain(ELLIPSIS);
        }
    });
});
