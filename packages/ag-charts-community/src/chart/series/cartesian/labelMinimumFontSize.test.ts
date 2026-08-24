import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import {
    compareImageSnapshot,
    deproxy,
    expectWarningsCalls,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../../test/utils';

const ELLIPSIS = '…';
const FONT_SIZE = 20;

// `label.minimumFontSize` lets a label shrink rather than wrap, truncate or hide. Assertions read the
// drawn glyph size off the scene graph, checking what the fit layer actually put on the canvas.
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
        // Each candidate size is wrapped before it is measured, so the label lands at the largest size
        // whose wrapped text fits the bar; short bars make height the binding constraint here.
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

    it('rejects a minimum above the configured font size at options time', async () => {
        await render(barChart({ truncate: true, minimumFontSize: FONT_SIZE + 1 }));
        expectWarningsCalls().toMatchInlineSnapshot(`
          [
            [
              "AG Charts - Option \`series[0].label.minimumFontSize\` cannot be set to \`21\`; expecting a number greater than 0 and the value to be less than or equal to \`fontSize\`, ignoring.",
            ],
          ]
        `);
        expect(fontSizes()).toEqual(data.map(() => FONT_SIZE));
    });

    it('clamps a minimum the itemStyler resolved below', async () => {
        // An itemStyler returning a smaller size is the only route left to `minimumFontSize > fontSize`;
        // the label takes the styler's size rather than growing back up to the floor.
        await render(barChart({ truncate: true, minimumFontSize: 16, itemStyler: () => ({ fontSize: 8 }) }));
        const rendered = labels();
        expect(rendered.length).toBe(data.length);
        for (const node of rendered) {
            expect(node.fontSize).toBe(8);
        }
    });

    // One image per series type packs the whole shrink spectrum into a single render; the scene-graph
    // cases above pin the exact sizes, these pin how the sizes look side by side.
    describe('visual', () => {
        it('renders bar labels across the shrink spectrum', async () => {
            // Four grouped series over the same bars compare configurations at matching bar widths: no
            // floor, a low floor, the same floor with wrapping, and a high floor with wrapping.
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
            // Unequal bins give each label a different width to fit into, covering the spectrum from
            // wide bins on one line to the narrowest reaching the 12px floor and truncating.
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

    // A marker-based label has no container in its outside placements, so `minimumFontSize` buys it room
    // by clearing neighbours the placement cascade could not get it past, rather than fitting a shape.
    describe('point labels', () => {
        const pointAxes = {
            x: { type: 'number', position: 'bottom', min: 0, max: 10 },
            y: { type: 'number', position: 'left', min: 0, max: 10 },
        };
        // Two neighbours whose labels overlap by an amount `gap` controls, plus an uncrowded control,
        // centred and well clear of the plot edges so the only thing either label has to get past is the other.
        const pairChart = (gap: number, label: object, type = 'scatter') => ({
            data: [
                { x: 5 - gap / 2, y: 5, label: 'Station Alpha' },
                { x: 5 + gap / 2, y: 5, label: 'Station Bravo' },
                { x: 5, y: 1, label: 'Solo' },
            ],
            legend: { enabled: false },
            axes: pointAxes,
            series: [
                {
                    type,
                    xKey: 'x',
                    yKey: 'y',
                    label: {
                        enabled: true,
                        fontSize: FONT_SIZE,
                        wrapping: 'never',
                        formatter: (p: any) => p.datum.label,
                        ...label,
                    },
                },
            ],
        });
        const sized = () => Object.fromEntries(labels().map((node) => [node.text, node.fontSize]));

        // `wrapping: 'never'` opts the label into overflow control, so the crowded one gives up text to
        // fit beside its neighbour. Without a floor it keeps its size while doing so: no floor, no ladder.
        it('truncates a colliding label at its configured size when minimumFontSize is unset', async () => {
            await render(pairChart(1.2, {}));
            const rendered = sized();
            expect(Object.values(rendered)).toEqual([FONT_SIZE, FONT_SIZE, FONT_SIZE]);
            expect(Object.keys(rendered).filter((text) => text.includes(ELLIPSIS))).toHaveLength(1);
        });

        it('shrinks a colliding label rather than hiding it', async () => {
            await render(pairChart(1.2, { minimumFontSize: 6 }));
            const rendered = sized();
            expect(rendered['Station Bravo']).toBeGreaterThanOrEqual(6);
            expect(rendered['Station Bravo']).toBeLessThan(FONT_SIZE);
            // The label that placed first never had to shrink, and nor did the uncrowded one.
            expect(rendered['Station Alpha']).toBe(FONT_SIZE);
            expect(rendered.Solo).toBe(FONT_SIZE);
        });

        it('shrinks only as far as it must to clear its neighbour', async () => {
            // Widening the gap leaves less overlap to clear, so the same label settles at a larger size.
            await render(pairChart(1.2, { minimumFontSize: 6 }));
            const tight = sized()['Station Bravo'];

            chart.destroy();
            await render(pairChart(1.6, { minimumFontSize: 6 }));
            expect(sized()['Station Bravo']).toBeGreaterThan(tight);
        });

        it('leaves an uncrowded label at its configured size', async () => {
            await render(pairChart(2, { minimumFontSize: 6 }));
            expect(fontSizes()).toEqual(labels().map(() => FONT_SIZE));
        });

        it('truncates a label that cannot clear its neighbour at any size', async () => {
            // The two markers are close enough that even the floor sits inside the first label's box, so
            // the search finds nothing and the label falls back to giving up text at its configured size.
            await render(pairChart(0.8, { minimumFontSize: 6 }));
            const rendered = sized();
            expect(Object.values(rendered)).toEqual([FONT_SIZE, FONT_SIZE, FONT_SIZE]);
            expect(Object.keys(rendered).filter((text) => text.includes(ELLIPSIS))).toHaveLength(1);
        });

        it('keeps the full-size fallback when no size clears and alwaysShow is true', async () => {
            // The search can only win outright, so a label it finds no room for falls back to the
            // least-buried candidate it would have taken anyway, at the configured size.
            await render(pairChart(0.8, { minimumFontSize: 6, collision: { alwaysShow: true } }));
            expect(fontSizes()).toEqual(labels().map(() => FONT_SIZE));
        });

        it('exhausts the placement fallback list at full size before shrinking', async () => {
            // `bottom` is clear at full size, so the label cascades there rather than shrinking to stay
            // at `top`: every placement is tried before any size below the configured one is.
            await render(pairChart(1.2, { placement: ['top', 'bottom'], minimumFontSize: 6 }));
            expect(sized()['Station Bravo']).toBe(FONT_SIZE);
        });

        it('shrinks once no placement in the list is clear at full size', async () => {
            // A neighbour above and below leaves both candidates blocked at 20px, so the cascade falls
            // through to the search and the label returns at the largest size one of them can hold.
            const crowded = {
                ...pairChart(1.2, { placement: ['top', 'bottom'], minimumFontSize: 6 }),
                // Placement is greedy in data order, so both blockers claim their bands before Bravo
                // reaches the cascade: Alpha takes the room above it, Delta the room below.
                data: [
                    { x: 4.4, y: 5, label: 'Station Alpha' },
                    { x: 5.6, y: 4.6, label: 'Station Delta' },
                    { x: 5.6, y: 5, label: 'Station Bravo' },
                ],
            };
            await render(crowded);
            const rendered = sized();
            expect(rendered['Station Bravo']).toBeGreaterThanOrEqual(6);
            expect(rendered['Station Bravo']).toBeLessThan(FONT_SIZE);
        });

        it.each(['line', 'area'])('shrinks a colliding %s label', async (type) => {
            await render(pairChart(1.2, {}, type));
            expect(labels().some((node) => node.text === 'Station Bravo')).toBe(false);

            chart.destroy();
            await render(pairChart(1.2, { minimumFontSize: 6 }, type));
            const rendered = sized();
            expect(rendered['Station Bravo']).toBeGreaterThanOrEqual(6);
            expect(rendered['Station Bravo']).toBeLessThan(FONT_SIZE);
        });

        it('reduces from the itemStyler-resolved font size', async () => {
            // The search ladder still runs from 20px, pinning that a trial above the styler's halved
            // size cannot enlarge the label past it — it shrinks below 10px, not between 10 and 20px.
            await render(pairChart(0.8, { minimumFontSize: 4, itemStyler: () => ({ fontSize: 10 }) }));
            const rendered = sized();
            expect(rendered['Station Alpha']).toBe(10);
            expect(rendered['Station Bravo']).toBeGreaterThanOrEqual(4);
            expect(rendered['Station Bravo']).toBeLessThan(10);
        });

        it('rejects a minimum above the configured font size at options time', async () => {
            await render(pairChart(1.2, { minimumFontSize: FONT_SIZE + 1 }));
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - Option \`series[0].label.minimumFontSize\` cannot be set to \`21\`; expecting a number greater than 0 and the value to be less than or equal to \`fontSize\`, ignoring.",
                ],
              ]
            `);
            expect(fontSizes()).toEqual(labels().map(() => FONT_SIZE));
        });

        const bubbleChart = (label: object) => ({
            data: Array.from({ length: 6 }, (_, i) => ({ x: i, y: i % 3, size: 20 + i * 30, label: `Bubble ${i}` })),
            legend: { enabled: false },
            axes: { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left' } },
            series: [
                {
                    type: 'bubble',
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    label: {
                        enabled: true,
                        fontSize: FONT_SIZE,
                        placement: 'inside',
                        wrapping: 'never',
                        formatter: (p: any) => p.datum.label,
                        ...label,
                    },
                },
            ],
        });

        it('shrinks an inside-marker bubble label to fit its marker', async () => {
            await render(bubbleChart({ minimumFontSize: 4 }));
            const rendered = labels();
            expect(rendered.length).toBeGreaterThan(0);
            expect(rendered.some((node) => node.fontSize < FONT_SIZE)).toBe(true);
            for (const node of rendered) {
                expect(node.fontSize).toBeGreaterThanOrEqual(4);
            }
        });

        it('keeps the fitted size on the highlighted bubble label', async () => {
            await render(bubbleChart({ minimumFontSize: 4 }));
            const placed = fontSizes();
            const series = deproxy(chart as any).series[0] as any;
            const [datum] = series.contextNodeData.labelData;
            deproxy(chart as any).ctx.highlightManager.updateHighlight(series.id, datum);
            await waitForChartStability(chart);
            const highlighted = (series.highlightLabelSelection.nodes() as LabelNode[])
                .filter((node) => node.visible && node.text !== '')
                .map((node) => node.fontSize);
            expect(highlighted.length).toBeGreaterThan(0);
            for (const size of highlighted) {
                expect(placed).toContain(size);
            }
        });

        it('renders point labels across the shrink spectrum', async () => {
            // One row of neighbours per series over widening gaps: no floor drops the crowded labels,
            // a low floor returns them each at the largest size that clears the label before it.
            const row = (yKey: string, extra: object) => ({
                type: 'scatter',
                xKey: 'x',
                yKey,
                label: {
                    enabled: true,
                    fontSize: FONT_SIZE,
                    wrapping: 'never',
                    formatter: (p: any) => p.datum.label,
                    ...extra,
                },
            });
            await renderAndSnapshot({
                data: [0, 1.1, 2.4, 3.9, 5.6, 7.5, 9.6].map((x, i) => ({
                    x,
                    a: 2,
                    b: 6,
                    label: `Station ${i}`,
                })),
                legend: { enabled: false },
                axes: {
                    x: { type: 'number', position: 'bottom', min: -1, max: 11 },
                    y: { type: 'number', position: 'left', min: 0, max: 8 },
                },
                series: [row('a', {}), row('b', { minimumFontSize: 6 })],
            });
        });
    });
});
