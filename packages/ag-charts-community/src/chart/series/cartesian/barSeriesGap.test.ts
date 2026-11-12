import { afterEach, describe, expect, it } from 'vitest';

import type { AgBarSeriesOptions, AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import {
    getBarSeriesContextNodeData,
    holdsBarDatumGroupIndex,
    isBarSeriesAggregating,
    withUndocumentedOptions,
} from '../../test/communitySeriesAccessors';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    compareImageSnapshot,
    createChart,
    deproxy,
    expectWarningsCalls,
    focusIndicatorContainsCanvasPoint,
    getVisibleLabelNodes,
    hoverAction,
    pressKey,
    setupMockCanvas,
    setupMockConsole,
    tabIntoChart,
    waitForChartStability,
} from '../../test/utils';

type Direction = 'vertical' | 'horizontal';

/** A run of one colour along a line through a bar, in canvas pixels: `[start, end)`. */
interface Run {
    start: number;
    end: number;
    rgb: string;
}

const COLOURS = ['#ff0000', '#00ff00', '#0000ff'];
const KEYS = ['a', 'b', 'c'];
const RGB = ['255,0,0', '0,255,0', '0,0,255'];

// The tallest column totals 60 and the axis is not niced, so the chart maps 1 unit to a whole number of pixels.
const DATA = [
    { k: 'A', a: 10, b: 20, c: 30 },
    { k: 'B', a: 15, b: 15, c: 15 },
    { k: 'C', a: 5, b: 25, c: 20 },
    { k: 'D', a: 20, b: 10, c: 10 },
];

// Each column has a positive stack and a negative stack.
const SIGNED_DATA = [
    { k: 'A', a: 10, b: -20, c: -30 },
    { k: 'B', a: -15, b: 15, c: 15 },
    { k: 'C', a: -5, b: -25, c: 20 },
    { k: 'D', a: 20, b: 10, c: -10 },
];

const HIDDEN = { enabled: false };

interface StackOptions {
    gaps?: (number | undefined)[];
    direction?: Direction;
    data?: object[];
    normalizedTo?: number;
    strokeWidth?: number;
    cornerRadius?: number;
    visible?: boolean[];
    stacked?: boolean;
    grouped?: boolean;
    seriesCount?: number;
    min?: number;
    max?: number;
    /** Leave the axes drawn, for image snapshots. */
    axisFurniture?: boolean;
    theme?: NonNullable<AgCartesianChartOptions['theme']>;
    series?: Partial<AgBarSeriesOptions>;
}

/** Bars with no axis furniture, so every non-background pixel belongs to a bar. */
function stackOptions(o: StackOptions = {}): AgCartesianChartOptions {
    const {
        gaps = [4, 4, 4],
        direction = 'vertical',
        stacked = true,
        seriesCount = 3,
        data = DATA,
        min = o.data == null ? 0 : undefined,
    } = o;
    const axis = o.axisFurniture ? {} : { line: HIDDEN, tick: HIDDEN, label: HIDDEN, gridLine: HIDDEN };
    const categoryAxis = { type: 'category', ...axis };
    const valueAxis = { type: 'number', nice: false, min, max: o.max, ...axis };
    return {
        animation: { enabled: false },
        legend: { enabled: false },
        padding: o.axisFurniture
            ? { top: 10, right: 10, bottom: 10, left: 10 }
            : { top: 0, right: 0, bottom: 0, left: 0 },
        theme: o.theme,
        data,
        series: KEYS.slice(0, seriesCount).map((yKey, i) => ({
            type: 'bar',
            direction,
            xKey: 'k',
            yKey,
            stacked,
            grouped: o.grouped,
            fill: COLOURS[i],
            fillOpacity: 1,
            strokeWidth: o.strokeWidth ?? 0,
            stroke: '#000000',
            cornerRadius: o.cornerRadius,
            gap: gaps[i],
            normalizedTo: o.normalizedTo,
            visible: o.visible?.[i] ?? true,
            ...o.series,
        })),
        // A horizontal bar chart has its categories on the y axis.
        axes: direction === 'vertical' ? { x: categoryAxis, y: valueAxis } : { x: valueAxis, y: categoryAxis },
    } as AgCartesianChartOptions;
}

describe('bar series gap', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    async function open(options: AgCartesianChartOptions) {
        chart = await createChart(options);
        return chart;
    }

    async function update(options: AgCartesianChartOptions) {
        await chart!.update({ ...options });
        await waitForChartStability(chart!);
    }

    // Series a is the bottom segment and b the top one. In column A the filtered `a` ends inside its segment; in
    // column B the filtered `b` ends inside its segment.
    const CROSS_FILTER_DATA = [
        { k: 'A', a: 10, aF: 4, b: 20, bF: 20 },
        { k: 'B', a: 15, aF: 15, b: 15, bF: 5 },
    ];

    function crossFilterOptions(gap: number) {
        return {
            ...stackOptions({ gaps: [gap, gap], min: 0 }),
            data: CROSS_FILTER_DATA,
            series: [
                ['a', 'aF', '#ff0000'],
                ['b', 'bF', '#00ff00'],
            ].map(([yKey, filter, fill]) =>
                withUndocumentedOptions<AgBarSeriesOptions>(
                    { type: 'bar', xKey: 'k', yKey, stacked: true, fill, fillOpacity: 1, gap, strokeWidth: 0 },
                    { yFilterKey: filter }
                )
            ),
        } as AgCartesianChartOptions;
    }

    /**
     * How many half gaps each filtered bar is pulled in at its [top, bottom] edge, by series then column. A bar is
     * pulled in at an edge with a neighbour; it only reaches the end of its segment when it fills it.
     */
    const CROSS_FILTER_HALF_GAPS = [
        [
            [0, 0], // a, A: the bottom segment, ending short of its end: no neighbour at either edge.
            [1, 0], // a, B: fills its segment, so its end meets b.
        ],
        [
            [0, 1], // b, A: the top of the stack stays; its start meets a.
            [0, 1], // b, B: ends inside its segment, but still starts at a.
        ],
    ];

    /** Canvas position of the centre of the `index`th category (of four, unless `categories` says otherwise). */
    function categoryCentre(img: ImageData, direction: Direction, index: number, categories = 4) {
        return ((direction === 'vertical' ? img.width : img.height) / categories) * (index + 0.5);
    }

    /** The runs of colour through the centre of one column (or row), ordered by pixel. */
    function runsThrough(direction: Direction, category: number, img = ctx.snapshot()): Run[] {
        const { data, width, height } = img;
        const vertical = direction === 'vertical';
        const fixed = Math.round(categoryCentre(img, direction, category));
        const length = vertical ? height : width;
        const out: Run[] = [];
        for (let p = 0; p < length; p++) {
            const i = ((vertical ? p : fixed) * width + (vertical ? fixed : p)) * 4;
            const background = data[i + 3] === 0 || (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250);
            if (background) continue;
            const rgb = `${data[i]},${data[i + 1]},${data[i + 2]}`;
            const last = out.at(-1);
            if (last?.rgb === rgb && last.end === p) {
                last.end = p + 1;
            } else {
                out.push({ start: p, end: p + 1, rgb });
            }
        }
        return out;
    }

    /** The runs ordered from the baseline outwards, for the stack on one side of the axis. */
    function fromBaseline(runs: Run[], direction: Direction, positive: boolean) {
        // Value 0 is at the bottom of a vertical chart and at the left of a horizontal one.
        const pixelOrderIsOutward = (direction === 'vertical') !== positive;
        return pixelOrderIsOutward ? runs : [...runs].reverse();
    }

    /**
     * What `runs` should become when each run's edges that touch a neighbour are pulled in by half that run's gap.
     * Runs are in baseline-outwards order. `outwardIsHigher` says whether outwards is towards higher pixels.
     */
    function insetRuns(runs: Run[], gaps: number[], outwardIsHigher: boolean): Run[] {
        return runs.map((run, i) => {
            const inner = i > 0 ? gaps[i] / 2 : 0;
            const outer = i < runs.length - 1 ? gaps[i] / 2 : 0;
            return outwardIsHigher
                ? { ...run, start: run.start + inner, end: run.end - outer }
                : { ...run, start: run.start + outer, end: run.end - inner };
        });
    }

    /**
     * Asserts that a gapped render is the no-gap render with every neighbouring edge pulled in by half its segment's
     * gap, so the baseline and the end of the stack stay on their true values.
     */
    function expectInsetOf(base: Run[], gapped: Run[], gaps: number[], direction: Direction, positive = true) {
        const outwardIsHigher = (direction === 'vertical') !== positive;
        const expected = insetRuns(fromBaseline(base, direction, positive), gaps, outwardIsHigher).filter(
            (r) => r.end > r.start
        );
        expect(fromBaseline(gapped, direction, positive)).toEqual(expected);
    }

    /** The gaps in pixels between neighbouring runs. */
    function gapsBetween(runs: Run[]) {
        return runs.slice(1).map((run, i) => run.start - runs[i].end);
    }

    describe('stacked segments', () => {
        it.each(['vertical', 'horizontal'] as const)(
            '%s: TC1 separates segments by the gap in every column and keeps the stack ends',
            async (direction) => {
                await open(stackOptions({ gaps: [0, 0, 0], direction }));
                const base = [0, 1, 2, 3].map((c) => runsThrough(direction, c));
                expect(base.map((r) => r.length)).toEqual([3, 3, 3, 3]);

                await update(stackOptions({ gaps: [4, 4, 4], direction }));
                for (const category of [0, 1, 2, 3]) {
                    const gapped = runsThrough(direction, category);
                    expect(gapsBetween(gapped)).toEqual([4, 4]);
                    expectInsetOf(base[category], gapped, [4, 4, 4], direction);
                }
            }
        );

        it.each(['vertical', 'horizontal'] as const)(
            '%s: TC1 baseline and the top of the tallest column stay on the axis extent',
            async (direction) => {
                await open(stackOptions({ gaps: [4, 4, 4], direction }));
                const tallest = fromBaseline(runsThrough(direction, 0), direction, true);
                const img = ctx.snapshot();
                const size = direction === 'vertical' ? img.height : img.width;
                // The domain is 0 to the largest stack total, so the tallest stack fills the chart.
                if (direction === 'vertical') {
                    expect(tallest[0].end).toBe(size);
                    expect(tallest.at(-1)!.start).toBe(0);
                } else {
                    expect(tallest[0].start).toBe(0);
                    expect(tallest.at(-1)!.end).toBe(size);
                }
            }
        );

        it.each([
            [[4, 4, 4], 'uniform'],
            [[4, 0, 4], 'a middle segment with no gap'],
            [[0, 4, 0], 'only the middle segment'],
            [[0, 0, 4], 'only the last segment'],
            [[8, 2, 6], 'different gaps'],
        ] as const)('each segment insets by half its own gap: %j (%s)', async (gaps, _description) => {
            await open(stackOptions({ gaps: [0, 0, 0] }));
            const base = runsThrough('vertical', 0);

            await update(stackOptions({ gaps: [...gaps] }));
            const gapped = runsThrough('vertical', 0);
            expectInsetOf(base, gapped, [...gaps], 'vertical');

            // From the baseline outwards the gap between two segments is half of each one's gap.
            const outwards = fromBaseline(gapped, 'vertical', true);
            const between = outwards.slice(1).map((run, i) => outwards[i].start - run.end);
            expect(between).toEqual([(gaps[0] + gaps[1]) / 2, (gaps[1] + gaps[2]) / 2]);
        });

        it('AC5: a segment with gap 4 next to a segment with gap 0 leaves 2px between them', async () => {
            await open(stackOptions({ gaps: [4, 0, 0] }));
            expect(gapsBetween(runsThrough('vertical', 0))).toEqual([0, 2]);

            await update(stackOptions({ gaps: [0, 4, 0] }));
            expect(gapsBetween(runsThrough('vertical', 0))).toEqual([2, 2]);
        });

        it.each(['vertical', 'horizontal'] as const)(
            '%s: AC6 negative and positive stacks are separated alike and the edge on the axis does not move',
            async (direction) => {
                await open(stackOptions({ gaps: [0, 0, 0], direction, data: SIGNED_DATA }));
                const base = [0, 1, 2, 3].map((c) => runsThrough(direction, c));

                await update(stackOptions({ gaps: [4, 4, 4], direction, data: SIGNED_DATA }));
                for (const [category, row] of SIGNED_DATA.entries()) {
                    const gapped = runsThrough(direction, category);
                    const values = KEYS.map((k) => (row as Record<string, number | string>)[k] as number);
                    for (const positive of [true, false]) {
                        // The runs of the series on this side of the axis, from the baseline outwards.
                        const onSide = (runs: Run[]) =>
                            runs.filter((r) => values.some((v, i) => v > 0 === positive && RGB[i] === r.rgb));
                        const side = onSide(base[category]);
                        expectInsetOf(
                            side,
                            onSide(gapped),
                            side.map(() => 4),
                            direction,
                            positive
                        );
                    }
                }
            }
        );

        it('AC7: a normalised stack separates segments like any other stack', async () => {
            await open(stackOptions({ gaps: [0, 0, 0], normalizedTo: 100 }));
            const base = [0, 1, 2, 3].map((c) => runsThrough('vertical', c));

            await update(stackOptions({ gaps: [4, 4, 4], normalizedTo: 100 }));
            for (const category of [0, 1, 2, 3]) {
                const gapped = runsThrough('vertical', category);
                expect(gapsBetween(gapped)).toEqual([4, 4]);
                expectInsetOf(base[category], gapped, [4, 4, 4], 'vertical');
            }
            // Every normalised column reaches the top of the chart.
            for (const category of [0, 1, 2, 3]) {
                expect(runsThrough('vertical', category).at(-1)!.end).toBe(ctx.snapshot().height);
                expect(runsThrough('vertical', category)[0].start).toBe(0);
            }
        });

        it('a hidden middle series leaves one gap between its neighbours and no hole', async () => {
            await open(stackOptions({ gaps: [0, 0, 0], visible: [true, false, true] }));
            const base = runsThrough('vertical', 0);
            expect(base).toHaveLength(2);

            await update(stackOptions({ gaps: [4, 4, 4], visible: [true, false, true] }));
            const gapped = runsThrough('vertical', 0);
            expect(gapsBetween(gapped)).toEqual([4]);
            expectInsetOf(base, gapped, [4, 4], 'vertical');
        });

        it('a lone visible segment has no neighbour, so it is not inset', async () => {
            await open(stackOptions({ gaps: [0, 0, 0], visible: [false, true, false] }));
            const base = runsThrough('vertical', 0);

            await update(stackOptions({ gaps: [4, 4, 4], visible: [false, true, false] }));
            expect(runsThrough('vertical', 0)).toEqual(base);
        });

        it('keeps the pixel gap at any value scale', async () => {
            for (const max of [60, 120, 240]) {
                await open(stackOptions({ gaps: [4, 4, 4], max }));
                const runs = runsThrough('vertical', 0);
                expect(gapsBetween(runs)).toEqual([4, 4]);
                chart?.destroy();
            }
        });
    });

    describe('series that are not separated', () => {
        it.each([
            ['unstacked', { stacked: false }],
            ['grouped', { stacked: false, grouped: true }],
        ] as const)('%s bars render the same with and without a gap', async (_name, over) => {
            await open(stackOptions({ gaps: [0, 0, 0], ...over }));
            const without = ctx.snapshot();
            const unset = Array.from(without.data);

            await update(stackOptions({ gaps: [4, 4, 4], ...over }));
            expect(Array.from(ctx.snapshot().data)).toEqual(unset);
        });

        it('a gap of 0 renders the same as no gap', async () => {
            await open(stackOptions({ gaps: [undefined, undefined, undefined] }));
            const unset = Array.from(ctx.snapshot().data);

            await update(stackOptions({ gaps: [0, 0, 0] }));
            expect(Array.from(ctx.snapshot().data)).toEqual(unset);
        });
    });

    describe('theme and series options', () => {
        const themed = (gaps: (number | undefined)[], themeGap?: number) =>
            stackOptions({
                gaps,
                theme: themeGap == null ? undefined : { overrides: { bar: { series: { gap: themeGap } } } },
            });

        it('AC1: gap set in a theme separates stacked segments', async () => {
            await open(themed([undefined, undefined, undefined], 4));
            expect(gapsBetween(runsThrough('vertical', 0))).toEqual([4, 4]);
        });

        it('a series gap overrides the theme', async () => {
            await open(themed([0, 0, 0], 4));
            expect(gapsBetween(runsThrough('vertical', 0))).toEqual([0, 0]);

            await update(themed([8, undefined, undefined], 4));
            // Series a (the bottom one) takes 8 and the others take 4 from the theme.
            const outwards = fromBaseline(runsThrough('vertical', 0), 'vertical', true);
            expect(outwards.slice(1).map((run, i) => outwards[i].start - run.end)).toEqual([6, 4]);
        });

        it.each([-4, 'wide', Number.NaN])('an invalid gap (%s) warns and applies the default of 0', async (gap) => {
            await open(stackOptions({ gaps: [gap as number, gap as number, gap as number] }));
            expect(gapsBetween(runsThrough('vertical', 0))).toEqual([0, 0]);
            expectWarningsCalls().toEqual(
                [0, 1, 2].map((i) => [
                    `AG Charts - Option \`series[${i}].gap\` cannot be set to \`${typeof gap === 'string' ? JSON.stringify(gap) : gap}\`; expecting a number greater than or equal to 0, ignoring.`,
                ])
            );
        });
    });

    describe('parent rules', () => {
        it('cornerRadius stays on the outer ends of the stack and the gap leaves the inner edges square', async () => {
            // The coloured width of a row of the first column; a rounded corner takes pixels off the rows at its end.
            const rowWidths = (rows: number[]) => {
                const img = ctx.snapshot();
                const left = Math.round(categoryCentre(img, 'vertical', 0) - img.width / 8);
                return rows.map((y) => {
                    let n = 0;
                    for (let x = left; x < left + img.width / 4; x++) {
                        const i = (y * img.width + x) * 4;
                        const background = img.data[i + 3] === 0 || (img.data[i] > 250 && img.data[i + 1] > 250);
                        if (!background) n++;
                    }
                    return n;
                });
            };
            await open(stackOptions({ gaps: [0, 0, 0], cornerRadius: 24 }));
            const [top, middle, bottom] = runsThrough('vertical', 0);
            const outerRows = [top.start, top.start + 4, top.start + 12, bottom.end - 1];
            const full = rowWidths([Math.round((middle.start + middle.end) / 2)])[0];
            const withoutGap = rowWidths(outerRows);
            // The outer corners of the stack are rounded at all (the rows at its end are narrower than the column).
            expect(withoutGap[0]).toBeLessThan(full);

            await update(stackOptions({ gaps: [4, 4, 4], cornerRadius: 24 }));
            // The gap leaves the outer corners as they were...
            expect(rowWidths(outerRows)).toEqual(withoutGap);
            // ...and the rows either side of a gap are square.
            const gapped = runsThrough('vertical', 0);
            const sides = [gapped[0].end - 1, gapped[1].start, gapped[1].end - 1, gapped[2].start];
            expect(rowWidths(sides)).toEqual(sides.map(() => full));
        });

        it('strokeWidth neither widens nor narrows the gap', async () => {
            // The stroke is black, so a gap is the background between one segment's stroke and the next one's.
            await open(stackOptions({ gaps: [4, 4, 4], strokeWidth: 0 }));
            const openGaps = (runs: Run[]) => gapsBetween(runs).filter((g) => g > 0);
            expect(openGaps(runsThrough('vertical', 0))).toEqual([4, 4]);

            await update(stackOptions({ gaps: [4, 4, 4], strokeWidth: 2 }));
            const stroked = runsThrough('vertical', 0);
            expect(stroked.some((r) => r.rgb === '0,0,0')).toBe(true);
            expect(openGaps(stroked)).toEqual([4, 4]);
        });

        it('a highlighted segment keeps the gap', async () => {
            await open(
                stackOptions({
                    gaps: [4, 4, 4],
                    series: { highlight: { highlightedItem: { fill: '#ffff00', fillOpacity: 1 } } },
                })
            );
            const base = runsThrough('vertical', 0);
            expect(gapsBetween(base)).toEqual([4, 4]);

            const middle = base[1];
            await hoverAction(categoryCentre(ctx.snapshot(), 'vertical', 0), (middle.start + middle.end) / 2)(chart!);
            await waitForChartStability(chart!);
            expect(deproxy(chart!).ctx.highlightManager.getActiveHighlight()).toMatchObject({ yKey: 'b' });

            const highlighted = runsThrough('vertical', 0);
            expect(highlighted.some((r) => r.rgb === '255,255,0')).toBe(true);
            expect(gapsBetween(highlighted)).toEqual([4, 4]);
        });

        it('cross-filter phantom bars take the inset of the segment drawn on top of them', async () => {
            // [top, bottom] canvas edges of each drawn clip.
            const edges = (box: { y: number; height: number } | undefined) => [box!.y, box!.y + box!.height];
            const read = () =>
                [0, 1].map((i) => {
                    const { nodeData, phantomNodeData } = getBarSeriesContextNodeData(chart!, i);
                    return nodeData.map((node, d) => ({
                        node: edges(node.clipBBox),
                        phantom: edges(phantomNodeData[d].clipBBox),
                    }));
                });

            await open(crossFilterOptions(0));
            const base = read();
            await update(crossFilterOptions(4));
            const gapped = read();

            // Each filtered bar is pulled in only at the edges with a neighbour (see CROSS_FILTER_HALF_GAPS).
            for (const [series, column] of [
                [0, 0],
                [0, 1],
                [1, 0],
                [1, 1],
            ]) {
                const [top, bottom] = CROSS_FILTER_HALF_GAPS[series][column];
                const [baseTop, baseBottom] = base[series][column].node;
                expect(gapped[series][column].node, `series ${series} column ${column}`).toEqual([
                    baseTop + 2 * top,
                    baseBottom - 2 * bottom,
                ]);
            }
            // The phantom takes the inset of the segment drawn on top of it: an edge with a neighbour in the stack.
            // Series a, column A: only the top of the segment has a neighbour (b).
            expect(gapped[0][0].phantom).toEqual([base[0][0].phantom[0] + 2, base[0][0].phantom[1]]);
            // Series a, column B: the filtered bar fills its segment, so it and its phantom share the inset.
            expect(gapped[0][1].phantom).toEqual(gapped[0][1].node);
            // Series b, column A: full height; both are pulled in at the bottom only (the top of the stack stays).
            expect(gapped[1][0].phantom).toEqual(gapped[1][0].node);
            // Series b, column B: the phantom is pulled in at the bottom only.
            expect(gapped[1][1].phantom).toEqual([base[1][1].phantom[0], base[1][1].phantom[1] - 2]);
        });
    });

    describe('collapsed segments', () => {
        // The first segment is 1 unit (10px) of a 60 unit stack; a gap of 20 wants 10px from it.
        const SMALL = [
            { k: 'A', a: 1, b: 29, c: 30 },
            { k: 'B', a: 15, b: 15, c: 15 },
        ];

        it('a segment shorter than its share of the gap is not drawn and its neighbours keep their inset', async () => {
            await open(stackOptions({ gaps: [0, 0, 0], data: SMALL }));
            const base = fromBaseline(runsThrough('vertical', 0), 'vertical', true);
            expect(base).toHaveLength(3);

            await update(stackOptions({ gaps: [20, 20, 20], data: SMALL }));
            const gapped = fromBaseline(runsThrough('vertical', 0), 'vertical', true);
            // The first segment's span is shorter than its half gap on one edge plus the other: not drawn.
            expect(gapped).toHaveLength(2);
            expect(gapped.map((r) => r.rgb)).toEqual([base[1].rgb, base[2].rgb]);
            // The middle segment keeps its inset on the edge it shares with the collapsed segment (half the gap),
            // and its edge with the top segment.
            expect(gapped[0].start).toBe(base[1].start + 10);
            expect(gapped[0].end).toBe(base[1].end - 10);
            // The top of the stack stays on its true value.
            expect(gapped[1].start).toBe(base[2].start);
        });

        it('a collapsed segment keeps its pick area, so hovering the empty space picks it', async () => {
            await open(stackOptions({ gaps: [0, 0, 0], data: SMALL }));
            const base = fromBaseline(runsThrough('vertical', 0), 'vertical', true);
            const small = base[0];

            await update(stackOptions({ gaps: [20, 20, 20], data: SMALL }));
            const x = categoryCentre(ctx.snapshot(), 'vertical', 0);
            await hoverAction(x, (small.start + small.end) / 2)(chart!);
            await waitForChartStability(chart!);

            // Documents what happens today, pending a decision: the segment is not drawn, but its pick area is kept, so
            // hovering the empty space where it was picks it.
            const { nodeData } = getBarSeriesContextNodeData(chart!, 0);
            expect(nodeData[0].clipBBox?.height).toBe(0);
            expect(nodeData[0].pickLength).toBeGreaterThan(0);
            expect(deproxy(chart!).ctx.highlightManager.getActiveHighlight()).toMatchObject({ yKey: 'a' });
        });
    });

    describe('picking', () => {
        async function pickAt(canvasX: number, canvasY: number) {
            await hoverAction(canvasX, canvasY)(chart!);
            await waitForChartStability(chart!);
            return (deproxy(chart!).ctx.highlightManager.getActiveHighlight() as { yKey?: string } | undefined)?.yKey;
        }

        it.each(['vertical', 'horizontal'] as const)(
            '%s: hovering inside a gap picks the segment that owns that half of it',
            async (direction) => {
                await open(stackOptions({ gaps: [0, 0, 0], direction }));
                const img = ctx.snapshot();
                const boundaries = fromBaseline(runsThrough(direction, 0), direction, true);
                // Boundary between the first (a) and second (b) segments in canvas pixels.
                const between = direction === 'vertical' ? boundaries[0].start : boundaries[0].end;
                await update(stackOptions({ gaps: [8, 8, 8], direction }));

                const centre = categoryCentre(img, direction, 0);
                const at = (offset: number) =>
                    direction === 'vertical' ? pickAt(centre, between + offset) : pickAt(between + offset, centre);
                // Value order a (baseline) then b. `towardsA` is a pixel step towards the baseline segment.
                const towardsA = direction === 'vertical' ? 1 : -1;
                expect(await at(towardsA * 2)).toBe('a');
                expect(await at(towardsA * -2)).toBe('b');
                // Deep inside the gap, either side of the gap's own middle.
                expect(await at(towardsA * 1)).toBe('a');
                expect(await at(towardsA * -1)).toBe('b');
            }
        );

        it('clicking inside a gap selects the segment that owns that half', async () => {
            const clicked: string[] = [];
            const options = stackOptions({ gaps: [0, 0, 0] });
            for (const s of options.series!) {
                (s as AgBarSeriesOptions).listeners = {
                    seriesNodeClick: (e: any) => clicked.push(e.yKey),
                };
            }
            await open(options);
            const img = ctx.snapshot();
            const base = fromBaseline(runsThrough('vertical', 0), 'vertical', true);
            const between = base[0].start;

            const withGap = stackOptions({ gaps: [8, 8, 8] });
            for (const s of withGap.series!) {
                (s as AgBarSeriesOptions).listeners = { seriesNodeClick: (e: any) => clicked.push(e.yKey) };
            }
            await update(withGap);

            const centre = categoryCentre(img, 'vertical', 0);
            await clickAction(centre, between + 2)(chart!);
            await clickAction(centre, between - 2)(chart!);
            expect(clicked).toEqual(['a', 'b']);
        });

        it.each([
            { name: 'a stack of three segments', visible: [true, true, true] },
            { name: 'a lone visible segment', visible: [false, false, true] },
        ])(
            'with a corner radius, clicking the empty corner past the outer end of $name picks nothing',
            async ({ visible }) => {
                const clicked: string[] = [];
                const options = stackOptions({ gaps: [4, 4, 4], cornerRadius: 24, visible });
                for (const s of options.series!) {
                    (s as AgBarSeriesOptions).listeners = { seriesNodeClick: (e: any) => clicked.push(e.yKey) };
                }
                await open(options);
                const img = ctx.snapshot();
                const centre = categoryCentre(img, 'vertical', 0);

                // The top of the stack, and the left edge of the column below the rounded part of its corner.
                const top = fromBaseline(runsThrough('vertical', 0), 'vertical', true).at(-1)!.start;
                const rowAt = (y: number) => (x: number) => {
                    const i = (y * img.width + x) * 4;
                    return (
                        img.data[i + 3] !== 0 && !(img.data[i] > 250 && img.data[i + 1] > 250 && img.data[i + 2] > 250)
                    );
                };
                const filled = rowAt(top + 40);
                let left = Math.round(centre);
                while (left > 0 && filled(left - 1)) left--;
                expect(rowAt(top)(left)).toBe(false); // The corner pixel is outside the rounded shape.

                // Inside the segment's rect but outside its rounded corner: the shape test decides, not the gap.
                await clickAction(left + 1, top + 1)(chart!);
                expect(clicked).toEqual([]);

                // Control: the same column is picked from inside the drawn shape.
                await clickAction(centre, top + 10)(chart!);
                expect(clicked).toEqual(['c']);
            }
        );

        it('hovering between two columns picks nothing', async () => {
            await open(stackOptions({ gaps: [4, 4, 4] }));
            const img = ctx.snapshot();
            const columnEdge = img.width / 4; // The boundary between the first and second categories.
            expect(await pickAt(columnEdge, img.height / 2)).toBeUndefined();
        });

        it('without a gap nothing extra is kept for picking', async () => {
            await open(stackOptions({ gaps: [0, 0, 0] }));
            for (let i = 0; i < 3; i++) {
                for (const datum of getBarSeriesContextNodeData(chart!, i).nodeData) {
                    expect(datum.pickLength).toBe(0);
                }
            }
        });
    });

    describe('keyboard focus', () => {
        /**
         * Asserts that the focus box covers `[start, end]` along the value axis at `cross`, to within the pixel: points
         * 2px inside each end are in the box and points 2px outside each end are not. Bounds are not snapped to whole
         * pixels as the drawn bars are, so the check is not exact to the pixel.
         */
        function expectFocusSpan(direction: Direction, cross: number, [start, end]: [number, number], context: string) {
            const at = (along: number) =>
                direction === 'vertical' ? { canvasX: cross, canvasY: along } : { canvasX: along, canvasY: cross };
            const inFocus = (along: number) => focusIndicatorContainsCanvasPoint(chart!, at(along));
            expect(inFocus(start + 2), `${context}: inside the start`).toBe(true);
            expect(inFocus(end - 2), `${context}: inside the end`).toBe(true);
            expect(inFocus(start - 2), `${context}: outside the start`).toBe(false);
            expect(inFocus(end + 2), `${context}: outside the end`).toBe(false);
        }

        it.each(['vertical', 'horizontal'] as const)(
            '%s: the focus box of every segment is its drawn span, without the gap',
            async (direction) => {
                await open(stackOptions({ gaps: [8, 8, 8], direction }));
                // The drawn runs, from the baseline outwards: the first segment is the first series.
                const drawn = fromBaseline(runsThrough(direction, 0), direction, true);
                expect(drawn).toHaveLength(3);
                const cross = categoryCentre(ctx.snapshot(), direction, 0);

                // Tabbing in focuses the first datum of the first series; ArrowDown steps to the next series.
                await tabIntoChart(chart!);
                for (const [i, run] of drawn.entries()) {
                    if (i > 0) await pressKey(chart!, 'ArrowDown');
                    expectFocusSpan(direction, cross, [run.start, run.end], `segment ${i}`);
                }
            }
        );

        it('the focus box of a cross-filtered datum is the drawn span of the filtered bar', async () => {
            await open(crossFilterOptions(0));
            const spans = () =>
                [0, 1].map((series) =>
                    getBarSeriesContextNodeData(chart!, series).nodeData.map(
                        (node) => [node.clipBBox!.y, node.clipBBox!.y + node.clipBBox!.height] as [number, number]
                    )
                );
            const base = spans();

            // A gap of 8 pulls each edge with a neighbour in by 4, so the box is that much short of the no-gap bar.
            await update(crossFilterOptions(8));
            const expected = (series: number, column: number): [number, number] => {
                const [top, bottom] = CROSS_FILTER_HALF_GAPS[series][column];
                const [start, end] = base[series][column];
                return [start + 4 * top, end - 4 * bottom];
            };
            const cross = (column: number) => categoryCentre(ctx.snapshot(), 'vertical', column, 2);

            await tabIntoChart(chart!);
            expectFocusSpan('vertical', cross(0), expected(0, 0), 'a in column A, ends short of its segment');
            await pressKey(chart!, 'ArrowDown');
            expectFocusSpan('vertical', cross(0), expected(1, 0), 'b in column A, the top of the stack');
            await pressKey(chart!, 'ArrowRight');
            expectFocusSpan('vertical', cross(1), expected(1, 1), 'b in column B, ends inside its segment');
            await pressKey(chart!, 'ArrowUp');
            expectFocusSpan('vertical', cross(1), expected(0, 1), 'a in column B, fills its segment');
        });
    });

    describe('labels', () => {
        const withLabels = (gap: number, direction: Direction, data?: object[], hideable = false) => {
            const options = stackOptions({ gaps: [gap, gap, gap], direction, data, min: 0 });
            for (const s of options.series!) {
                (s as AgBarSeriesOptions).label = {
                    enabled: true,
                    placement: 'inside-center',
                    fontSize: 14,
                    ...(hideable ? { collision: { alwaysShow: false } } : {}),
                };
            }
            return options;
        };

        it.each(['vertical', 'horizontal'] as const)(
            '%s: the inside-centre label rect, midPoint and drawn label follow the drawn edge',
            async (direction) => {
                await open(withLabels(0, direction));
                const read = () =>
                    [0, 1, 2].map((i) => {
                        const datum = getBarSeriesContextNodeData(chart!, i).nodeData[0];
                        const [label] = getVisibleLabelNodes(chart!, i);
                        const mid = direction === 'vertical' ? datum.midPoint!.y : datum.midPoint!.x;
                        const clip = direction === 'vertical' ? datum.clipBBox!.height : datum.clipBBox!.width;
                        return { mid, clip, label: direction === 'vertical' ? label.y : label.x };
                    });
                const base = read();

                await update(withLabels(8, direction));
                const gapped = read();
                // A gap of 8 insets each neighbouring edge by 4: the first centre moves 2 towards the baseline, the middle
                // one stays put and the last moves outwards. Value 0 is at the bottom (vertical) or left (horizontal).
                const towardsBaseline = direction === 'vertical' ? 2 : -2;
                expect(gapped.map((g, i) => g.mid - base[i].mid)).toEqual([towardsBaseline, 0, -towardsBaseline]);
                expect(gapped.map((g, i) => g.label - base[i].label)).toEqual([towardsBaseline, 0, -towardsBaseline]);
                expect(gapped.map((g, i) => base[i].clip - g.clip)).toEqual([4, 8, 4]);
            }
        );

        it('a label that fits the segment without the gap is hidden once the gap leaves too little room', async () => {
            // The middle segment is 2 units of a 45 unit chart: tall enough for a 14px label, until the gap takes
            // half of 16 from each end.
            const data = [
                { k: 'A', a: 10, b: 2, c: 30 },
                { k: 'B', a: 15, b: 15, c: 15 },
            ];
            const drawnTexts = () => getVisibleLabelNodes(chart!, 1).map((node) => node.text);

            await open(withLabels(0, 'vertical', data, true));
            expect(drawnTexts()).toEqual(['2', '15']);
            const height = getBarSeriesContextNodeData(chart!, 1).nodeData[0].clipBBox!.height;
            expect(height).toBeGreaterThan(20);

            await update(withLabels(16, 'vertical', data, true));
            // The drawn segment is `height - 16` tall, far less than the label; the rect it had before the inset
            // would still have fitted it.
            expect(getBarSeriesContextNodeData(chart!, 1).nodeData[0].clipBBox!.height).toBeCloseTo(height - 16, 5);
            expect(drawnTexts()).toEqual(['15']);
        });
    });

    describe('aggregated data', () => {
        const N = 5000;
        const T0 = Date.UTC(2024, 0, 1);
        const RUN_START = 1000;
        const RUN_END = 2000;
        const SKEW_START = 2500;
        const SKEW_END = 2600;

        /** What the rows RUN_START..RUN_END and SKEW_START..SKEW_END hold for the series above or below the others. */
        type Shape =
            | 'full'
            | 'nullTop'
            | 'zeroTop'
            | 'negTop'
            | 'nullMiddle'
            | 'nullTwo'
            | 'nullBottom'
            | 'zeroBottom'
            | 'negBottom';
        /** How the keys of the rows SKEW_START..SKEW_END break the one-datum-per-group pattern. */
        type Skew = 'none' | 'duplicateKeys' | 'invalidKeys';

        type Row = Record<string, unknown> & { a: number | null; b: number | null; c: number | null };

        function aggregatedRows(shape: Shape, skew: Skew): Row[] {
            return Array.from({ length: N }, (_, i) => {
                const row: Row = { t: new Date(T0 + i * 60000), a: 10 + (i % 7), b: 20 + (i % 5), c: 30 + (i % 3) };
                if ((i >= RUN_START && i < RUN_END) || (i >= SKEW_START && i < SKEW_END)) {
                    if (shape === 'nullTop' || shape === 'nullTwo') row.c = null;
                    if (shape === 'zeroTop') row.c = 0;
                    if (shape === 'negTop') row.c = -(30 + (i % 3));
                    if (shape === 'nullMiddle' || shape === 'nullTwo') row.b = null;
                    if (shape === 'nullBottom') row.a = null;
                    if (shape === 'zeroBottom') row.a = 0;
                    if (shape === 'negBottom') row.a = -(10 + (i % 7));
                }
                if (i >= SKEW_START && i < SKEW_END) {
                    // Pairs of rows share a key, or a run of rows has none, so later rows sit in earlier groups.
                    if (skew === 'duplicateKeys')
                        row.t = new Date(T0 + (SKEW_START + Math.floor((i - SKEW_START) / 2)) * 60000);
                    if (skew === 'invalidKeys' && i < SKEW_START + 20) row.t = null;
                }
                return row;
            });
        }

        function aggregatedOptions(shape: Shape, gap: number, skew: Skew = 'none'): AgCartesianChartOptions {
            const options = stackOptions({ gaps: [gap, gap, gap], data: aggregatedRows(shape, skew) });
            for (const s of options.series!) (s as AgBarSeriesOptions).xKey = 't';
            (options.axes as any).x = { ...(options.axes as any).x, type: 'unit-time' };
            return options;
        }

        const aggregating = () => isBarSeriesAggregating(chart!, 0);

        /**
         * The drawn bucket nodes of a series with how far each edge was pulled in, in pixels, from the clip against the
         * segment before the inset. `top` and `bottom` are canvas edges.
         */
        const nodeInsets = (series: number) =>
            getBarSeriesContextNodeData(chart!, series)
                .nodeData.filter((d) => d.clipBBox != null && d.pickLength > 0)
                .map(({ datumIndex, x, width, clipBBox, pickStart, pickLength }) => ({
                    datumIndex,
                    x,
                    width,
                    top: Math.round((clipBBox!.y - pickStart) * 1000) / 1000,
                    bottom: Math.round((pickStart + pickLength - clipBBox!.y - clipBBox!.height) * 1000) / 1000,
                }));

        const value = (row: Row, series: number) => Number(row[KEYS[series]]);

        /**
         * The inset the end of a bucket's segment must have, from the row of its top datum alone: half the gap when a
         * later series has a value of the same sign in that row (a neighbour is there), otherwise 0. The end is the top
         * edge of a positive segment and the bottom edge of a negative one.
         */
        function expectedEnd(rows: Row[], series: number, datumIndex: number, halfGap: number) {
            const own = value(rows[datumIndex], series);
            const neighbour = KEYS.slice(series + 1).some((_, i) => {
                const v = value(rows[datumIndex], series + 1 + i);
                return Number.isFinite(v) && v * own > 0;
            });
            return { negative: own < 0, inset: neighbour ? halfGap : 0 };
        }

        /**
         * The inset the start of a bucket's segment must have, from the rows the bucket covers (those that sit within its
         * span on the x axis, with a value of the segment's sign): half the gap when every one of them has an earlier
         * series with a value of that sign, 0 when none does. A bucket whose rows disagree takes the start of whichever
         * row is closest to the baseline, so it has no single expected inset: `undefined`. The start is the bottom edge
         * of a positive segment and the top edge of a negative one.
         */
        function expectedStart(rows: Row[], xs: number[], series: number, node: ReturnType<typeof nodeInsets>[number]) {
            const sign = Math.sign(value(rows[node.datumIndex], series));
            const covered: Row[] = [];
            for (let r = Math.max(0, node.datumIndex - 40); r < Math.min(rows.length, node.datumIndex + 40); r++) {
                const inSpan = xs[r] >= node.x - 1e-6 && xs[r] <= node.x + node.width + 1e-6;
                if (inSpan && value(rows[r], series) * sign > 0) covered.push(rows[r]);
            }
            const hasNeighbour = (row: Row) =>
                KEYS.slice(0, series).some((_, i) => {
                    const v = value(row, i);
                    return Number.isFinite(v) && v * sign > 0;
                });
            const withNeighbour = covered.filter(hasNeighbour).length;
            let inset: number | undefined;
            if (withNeighbour === covered.length) inset = 2;
            else if (withNeighbour === 0) inset = 0;
            return { negative: sign < 0, inset };
        }

        const CASES: [Shape, Skew][] = [
            ['full', 'none'],
            ['nullTop', 'none'],
            ['zeroTop', 'none'],
            ['negTop', 'none'],
            ['nullMiddle', 'none'],
            ['nullTwo', 'none'],
            ['nullBottom', 'none'],
            ['zeroBottom', 'none'],
            ['negBottom', 'none'],
            ['full', 'duplicateKeys'],
            ['nullTop', 'duplicateKeys'],
            ['nullBottom', 'duplicateKeys'],
            ['full', 'invalidKeys'],
            ['nullMiddle', 'invalidKeys'],
        ];

        /**
         * Anti-vacuity: `seen` holds `series:run|rest:start|end:inset` for every bucket checked, and the shapes that take
         * a neighbour away in the run must have checked that edge at 0 inside it and 2 outside it.
         */
        function expectEdgesSeen(shape: Shape, seen: Set<string>) {
            // Where the neighbour above goes missing in the run, the end edge of the series below is checked at 0 inside
            // the run and 2 outside it.
            const lowered = { nullTop: 1, zeroTop: 1, negTop: 1, nullTwo: 0 } as Partial<Record<Shape, number>>;
            const series = lowered[shape];
            if (series != null) {
                expect(seen.has(`${series}:run:end:0`)).toBe(true);
                expect(seen.has(`${series}:rest:end:2`)).toBe(true);
            }
            // The same for the start edge: where the neighbour below goes missing in the run, the series above has
            // its start at the baseline there (0) and next to a neighbour outside it (2).
            const raised = { nullBottom: 1, zeroBottom: 1, negBottom: 1 } as Partial<Record<Shape, number>>;
            const above = raised[shape];
            if (above != null) {
                expect(seen.has(`${above}:run:start:0`)).toBe(true);
                expect(seen.has(`${above}:rest:start:2`)).toBe(true);
                // The series above that one still has the series in between below it.
                expect(seen.has('2:run:start:2')).toBe(true);
            }
            // A neighbour that is not directly above or below the series is still a neighbour.
            if (shape === 'nullMiddle') {
                expect(seen.has('0:run:end:2')).toBe(true);
                expect(seen.has('2:run:start:2')).toBe(true);
            }
        }

        it.each(CASES)(
            '%s rows, %s keys: an edge is inset only where a neighbour is beside it, at every bucket',
            async (shape, skew) => {
                const rows = aggregatedRows(shape, skew);
                await open(aggregatedOptions(shape, 4, skew));
                expect(aggregating()).toBe(true);
                if (skew === 'invalidKeys') {
                    expectWarningsCalls().toEqual([
                        [expect.stringContaining('invalid value of type [object]'), '[null]'],
                    ]);
                }
                const { scale } = deproxy(chart!).axes[0];
                const xs = rows.map((row) => (row.t instanceof Date ? scale.convert(row.t) : Number.NaN));

                const seen = new Set<string>();
                for (const series of [0, 1, 2]) {
                    const insets = nodeInsets(series);
                    expect(insets.length).toBeGreaterThan(0);
                    for (const node of insets) {
                        const { datumIndex, top, bottom } = node;
                        const where = `series ${series}, datum ${datumIndex}`;
                        const end = expectedEnd(rows, series, datumIndex, 2);
                        expect(end.negative ? bottom : top, `${where}, end`).toBe(end.inset);
                        const inRun = datumIndex >= RUN_START && datumIndex < RUN_END;
                        seen.add(`${series}:${inRun ? 'run' : 'rest'}:end:${end.inset}`);

                        // The rows of a skewed key range do not sit where their keys put them.
                        if (skew !== 'none' && Math.abs(datumIndex - (SKEW_START + SKEW_END) / 2) < 100) continue;
                        const start = expectedStart(rows, xs, series, node);
                        const startInset = start.negative ? top : bottom;
                        if (start.inset == null) expect([0, 2], `${where}, start`).toContain(startInset);
                        else expect(startInset, `${where}, start`).toBe(start.inset);
                        if (start.inset != null) seen.add(`${series}:${inRun ? 'run' : 'rest'}:start:${start.inset}`);
                    }
                }
                expectEdgesSeen(shape, seen);
            }
        );

        it('keeps one pick box per bucket across updates and quadtree rebuilds', async () => {
            const pickBoxes = () => getBarSeriesContextNodeData(chart!, 1).nodeData.map((d) => d.pickBBox);
            const hover = async () => {
                await hoverAction(100, 100)(chart!);
                await waitForChartStability(chart!);
            };
            await open(aggregatedOptions('full', 4));
            expect(aggregating()).toBe(true);
            await hover();
            const before = pickBoxes();
            expect(before.length).toBeGreaterThan(0);
            expect(before.every((box) => box != null)).toBe(true);

            await update(aggregatedOptions('full', 6));
            await hover();
            const after = pickBoxes();
            expect(after).toHaveLength(before.length);
            for (const [i, box] of after.entries()) expect(box).toBe(before[i]);
        });

        it('releases the datum-to-group index when the data is replaced', async () => {
            await open(aggregatedOptions('full', 4, 'invalidKeys'));
            expectWarningsCalls().toEqual([[expect.stringContaining('invalid value of type [object]'), '[null]']]);
            expect(holdsBarDatumGroupIndex(chart!, 1)).toBe(true);

            await update(aggregatedOptions('full', 4));
            expect(holdsBarDatumGroupIndex(chart!, 1)).toBe(false);
        });

        it('the bottom segment sits on the baseline and the top of the stack reaches its total', async () => {
            await open(aggregatedOptions('full', 0));
            const { nodeData: base } = getBarSeriesContextNodeData(chart!, 0);
            const baseline = base.map((d) => d.clipBBox!.y + d.clipBBox!.height);
            const topSeries = getBarSeriesContextNodeData(chart!, 2).nodeData;
            const tops = topSeries.map((d) => d.clipBBox!.y);

            await update(aggregatedOptions('full', 4));
            const gappedBottom = getBarSeriesContextNodeData(chart!, 0).nodeData;
            const gappedTop = getBarSeriesContextNodeData(chart!, 2).nodeData;
            expect(gappedBottom.map((d) => d.clipBBox!.y + d.clipBBox!.height)).toEqual(baseline);
            expect(gappedTop.map((d) => d.clipBBox!.y)).toEqual(tops);
        });

        it('a bucket whose neighbour above is null, zero or on the other side of the axis loses no baseline', async () => {
            for (const shape of ['nullTop', 'zeroTop', 'negTop'] as const) {
                await open(aggregatedOptions(shape, 0));
                const baseline = getBarSeriesContextNodeData(chart!, 0).nodeData.map(
                    (d) => d.clipBBox!.y + d.clipBBox!.height
                );
                await update(aggregatedOptions(shape, 4));
                const gapped = getBarSeriesContextNodeData(chart!, 0).nodeData.map(
                    (d) => d.clipBBox!.y + d.clipBBox!.height
                );
                expect(gapped).toEqual(baseline);
                chart?.destroy();
            }
        });
    });

    describe('image snapshots', () => {
        it('TC1: a stacked column chart with three series and four categories and gap 4', async () => {
            await open(stackOptions({ gaps: [4, 4, 4], axisFurniture: true }));
            await compareImageSnapshot(chart!, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('a horizontal stack with negative values and gap 4', async () => {
            await open(
                stackOptions({ gaps: [4, 4, 4], direction: 'horizontal', data: SIGNED_DATA, axisFurniture: true })
            );
            await compareImageSnapshot(chart!, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });
    });
});
