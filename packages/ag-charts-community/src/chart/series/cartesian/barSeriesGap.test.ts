import { afterEach, describe, expect, it } from 'vitest';

import type { AgBarSeriesOptions, AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { getBarSeriesContextNodeData, withUndocumentedOptions } from '../../test/communitySeriesAccessors';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    compareImageSnapshot,
    createChart,
    deproxy,
    expectWarningsCalls,
    focusIndicatorContainsCanvasPoint,
    hoverAction,
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

    /** Canvas position of the centre of the `index`th of the four categories. */
    function categoryCentre(img: ImageData, direction: Direction, index: number) {
        return ((direction === 'vertical' ? img.width : img.height) / 4) * (index + 0.5);
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
            // Series a is the bottom segment and b the top one. In column A the filtered `a` ends inside its segment;
            // in column B the filtered `b` ends inside its segment.
            const data = [
                { k: 'A', a: 10, aF: 4, b: 20, bF: 20 },
                { k: 'B', a: 15, aF: 15, b: 15, bF: 5 },
            ];
            const options = (gap: number) =>
                ({
                    ...stackOptions({ gaps: [gap, gap] }),
                    data,
                    series: [
                        ['a', 'aF', '#ff0000'],
                        ['b', 'bF', '#00ff00'],
                    ].map(([yKey, filter, fill]) =>
                        withUndocumentedOptions<AgBarSeriesOptions>(
                            { type: 'bar', xKey: 'k', yKey, stacked: true, fill, fillOpacity: 1, gap, strokeWidth: 0 },
                            { yFilterKey: filter }
                        )
                    ),
                }) as AgCartesianChartOptions;
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

            await open(options(0));
            const base = read();
            await update(options(4));
            const gapped = read();

            // Series a, column A: the filtered bar is short of its end, so only its phantom is pulled in at the top.
            expect(gapped[0][0].node).toEqual(base[0][0].node);
            expect(gapped[0][0].phantom).toEqual([base[0][0].phantom[0] + 2, base[0][0].phantom[1]]);
            // Series a, column B: the filtered bar fills its segment, so it and its phantom share the inset.
            expect(gapped[0][1].node).toEqual([base[0][1].node[0] + 2, base[0][1].node[1]]);
            expect(gapped[0][1].phantom).toEqual(gapped[0][1].node);
            // Series b, column A: full height; both are pulled in at the bottom only (the top of the stack stays).
            expect(gapped[1][0].node).toEqual([base[1][0].node[0], base[1][0].node[1] - 2]);
            expect(gapped[1][0].phantom).toEqual(gapped[1][0].node);
            // Series b, column B: the filtered bar ends inside its segment, but still starts pulled in; its phantom
            // is pulled in at the bottom only.
            expect(gapped[1][1].node).toEqual([base[1][1].node[0], base[1][1].node[1] - 2]);
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
            expect(nodeData[0].pickBBox?.height).toBeGreaterThan(0);
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
                    expect(datum.pickBBox).toBeUndefined();
                }
            }
        });
    });

    describe('keyboard focus', () => {
        it('the focus box follows the drawn segment and excludes the gap', async () => {
            await open(stackOptions({ gaps: [0, 0, 0] }));
            const [bottom] = fromBaseline(runsThrough('vertical', 0), 'vertical', true);
            const x = categoryCentre(ctx.snapshot(), 'vertical', 0);

            await update(stackOptions({ gaps: [8, 8, 8] }));
            await tabIntoChart(chart!);
            // The first focused datum is the bottom segment of the first column. Its top edge has a neighbour, so it is
            // 4px (half the gap) short of the no-gap edge; its baseline edge has none.
            const inFocus = (y: number) => focusIndicatorContainsCanvasPoint(chart!, { canvasX: x, canvasY: y });
            expect(inFocus(bottom.start + 3)).toBe(false);
            expect(inFocus(bottom.start + 5)).toBe(true);
            expect(inFocus(bottom.end - 1)).toBe(true);
        });

        it.each(['vertical', 'horizontal'] as const)(
            '%s: the focus bounds of every segment are its drawn span',
            async (direction) => {
                await open(stackOptions({ gaps: [4, 4, 4], direction }));
                const drawn = fromBaseline(runsThrough(direction, 0), direction, true);
                const bounds = deproxy(chart!).series.map((s: any) => {
                    const b = s.pickFocus({
                        datumIndex: 0,
                        datumIndexDelta: 0,
                        otherIndex: 0,
                        otherIndexDelta: 0,
                    })?.bounds;
                    return direction === 'vertical' ? [b.y, b.y + b.height] : [b.x, b.x + b.width];
                });
                // Focus bounds are not snapped to whole pixels as the drawn bars are.
                for (const [i, [start, end]] of bounds.entries()) {
                    expect(start).toBeCloseTo(drawn[i].start, 0);
                    expect(end).toBeCloseTo(drawn[i].end, 0);
                }
            }
        );
    });

    describe('labels', () => {
        it('the inside-centre label rect and midPoint follow the drawn edge', async () => {
            const withLabels = (gap: number) => {
                const options = stackOptions({ gaps: [gap, gap, gap] });
                for (const s of options.series!) {
                    (s as AgBarSeriesOptions).label = { enabled: true, placement: 'inside-center' };
                }
                return options;
            };
            await open(withLabels(0));
            const read = () =>
                [0, 1, 2].map((i) => {
                    const datum = getBarSeriesContextNodeData(chart!, i).nodeData[0];
                    return { mid: datum.midPoint, clip: datum.clipBBox, label: datum.label };
                });
            const base = read();

            await update(withLabels(8));
            const gapped = read();
            // The bottom segment (a): its top edge is inset by 4, so its centre moves down by 2 and its drawn height
            // shrinks by 4. The middle segment is inset at both ends, so its centre does not move.
            expect(gapped[0].mid!.y - base[0].mid!.y).toBe(2);
            expect(gapped[1].mid!.y - base[1].mid!.y).toBe(0);
            expect(gapped[2].mid!.y - base[2].mid!.y).toBe(-2);
            expect(base[0].clip!.height - gapped[0].clip!.height).toBe(4);
            expect(base[1].clip!.height - gapped[1].clip!.height).toBe(8);
            expect(base[2].clip!.height - gapped[2].clip!.height).toBe(4);
        });
    });

    describe('aggregated data', () => {
        const N = 5000;
        const T0 = Date.UTC(2024, 0, 1);
        type Shape = 'full' | 'nullTop' | 'zeroTop' | 'negTop' | 'nullMiddle';

        function aggregatedOptions(shape: Shape, gap: number): AgCartesianChartOptions {
            const data = Array.from({ length: N }, (_, i) => {
                const row: Record<string, unknown> = {
                    t: new Date(T0 + i * 60000),
                    a: 10 + (i % 7),
                    b: 20 + (i % 5),
                    c: 30 + (i % 3),
                };
                const odd = i % 2 === 1;
                if (shape === 'nullTop' && odd) row.c = null;
                if (shape === 'zeroTop' && odd) row.c = 0;
                if (shape === 'negTop' && odd) row.c = -(30 + (i % 3));
                if (shape === 'nullMiddle' && odd) row.b = null;
                return row;
            });
            const options = stackOptions({ gaps: [gap, gap, gap], data });
            for (const s of options.series!) (s as AgBarSeriesOptions).xKey = 't';
            (options.axes as any).x = { ...(options.axes as any).x, type: 'unit-time' };
            return options;
        }

        const aggregating = () => (deproxy(chart!).series[0] as any).nodeDatumContext?.dataAggregationFilter != null;

        // [top edge, bottom edge] insets of every aggregated node, from the clip against the segment before the inset.
        const nodeInsets = (series: number) =>
            getBarSeriesContextNodeData(chart!, series)
                .nodeData.filter((d) => d.clipBBox != null && d.pickBBox != null)
                .map(({ clipBBox, pickBBox }) => [
                    Math.round((clipBBox!.y - pickBBox!.y) * 1000) / 1000,
                    Math.round((pickBBox!.y + pickBBox!.height - clipBBox!.y - clipBBox!.height) * 1000) / 1000,
                ]);

        it.each(['full', 'nullTop', 'zeroTop', 'negTop', 'nullMiddle'] as const)(
            '%s: only edges with a neighbour are inset, and never the baseline or the end of the stack',
            async (shape) => {
                await open(aggregatedOptions(shape, 4));
                expect(aggregating()).toBe(true);

                for (const series of [0, 1, 2]) {
                    const insets = nodeInsets(series);
                    expect(insets.length).toBeGreaterThan(0);
                    // An edge is inset by half the gap or not at all.
                    for (const inset of insets.flat()) expect([0, 2]).toContain(inset);
                }
                // The bottom series sits on the baseline (the bottom edge, as every value is positive).
                for (const [, bottom] of nodeInsets(0)) expect(bottom).toBe(0);
                // The top series ends the stack where its buckets stay above the axis.
                if (shape !== 'negTop') for (const [top] of nodeInsets(2)) expect(top).toBe(0);
                // Anti-vacuity: the edges that do have a neighbour were inset.
                if (shape === 'full') {
                    expect(nodeInsets(0).some(([top]) => top === 2)).toBe(true);
                    expect(nodeInsets(1).every(([top, bottom]) => top === 2 && bottom === 2)).toBe(true);
                    expect(nodeInsets(2).some(([, bottom]) => bottom === 2)).toBe(true);
                }
            }
        );

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
