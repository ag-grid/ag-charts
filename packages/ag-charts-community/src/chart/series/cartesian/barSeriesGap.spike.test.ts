import { describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions } from 'ag-charts-types';

import { getBarSeriesContextNodeData } from '../../test/communitySeriesAccessors';
import {
    createChart,
    deproxy,
    focusIndicatorContainsCanvasPoint,
    hoverAction,
    prepareTestOptions,
    resizeChartContainer,
    setupMockCanvas,
    tabIntoChart,
    waitForChartStability,
} from '../../test/utils';

type Run = { start: number; length: number; rgb: string };

const ctx = setupMockCanvas();

function isBackground(d: Uint8ClampedArray, i: number) {
    return d[i + 3] === 0 || (d[i] > 250 && d[i + 1] > 250 && d[i + 2] > 250);
}

/** Runs of non-background pixels along a line, in device pixels. */
function runs(img: ImageData, axis: 'v' | 'h', fixed: number): Run[] {
    const { data, width, height } = img;
    const n = axis === 'v' ? height : width;
    const out: Run[] = [];
    let cur: Run | undefined;
    for (let p = 0; p < n; p++) {
        const x = axis === 'v' ? fixed : p;
        const y = axis === 'v' ? p : fixed;
        const i = (y * width + x) * 4;
        if (isBackground(data, i)) {
            cur = undefined;
            continue;
        }
        const rgb = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        if (cur?.rgb === rgb) {
            cur.length++;
        } else {
            cur = { start: p, length: 1, rgb };
            out.push(cur);
        }
    }
    return out;
}

const COLOURS = ['#ff0000', '#00ff00', '#0000ff'];

function stackOptions(over: {
    gaps?: (number | undefined)[];
    direction?: 'vertical' | 'horizontal';
    data?: any[];
    normalizedTo?: number;
    strokeWidth?: number;
    cornerRadius?: number;
    visible?: boolean[];
    n?: number;
}): AgCartesianChartOptions {
    const { gaps = [4, 4, 4], direction = 'vertical', normalizedTo, strokeWidth = 0, cornerRadius = 0, n = 3 } = over;
    const vertical = direction === 'vertical';
    const data = over.data ?? [
        { c: 'A', a: 10, b: 20, d: 30 },
        { c: 'B', a: 15, b: 15, d: 15 },
        { c: 'C', a: 5, b: 25, d: 20 },
        { c: 'D', a: 20, b: 10, d: 10 },
    ];
    const keys = ['a', 'b', 'd'].slice(0, n);
    const hidden = { enabled: false };
    return {
        width: 400,
        height: 400,
        animation: { enabled: false },
        legend: { enabled: false },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        data,
        series: keys.map((yKey, i) => ({
            type: 'bar' as const,
            direction,
            xKey: 'c',
            yKey,
            stacked: true,
            fill: COLOURS[i],
            fillOpacity: 1,
            stroke: '#000000',
            strokeWidth,
            cornerRadius,
            gap: gaps[i],
            normalizedTo,
            visible: over.visible?.[i] ?? true,
        })),
        axes: [
            {
                type: 'category',
                position: vertical ? 'bottom' : 'left',
                line: hidden,
                tick: hidden,
                label: hidden,
                gridLine: hidden,
            },
            {
                type: 'number',
                position: vertical ? 'left' : 'bottom',
                line: hidden,
                tick: hidden,
                label: hidden,
                gridLine: hidden,
                nice: false,
                ...(over.data ? {} : { min: 0 }),
            },
        ],
    } as unknown as AgCartesianChartOptions;
}

function report(name: string, value: unknown) {
    process.stdout.write(`SPIKE ${name} ${JSON.stringify(value)}\n`);
}

/** The runs through the first bar, perpendicular to the value axis, plus the line they were read on. */
function firstBar(img: ImageData, vertical: boolean) {
    const probe = vertical ? Math.round(img.height * 0.75) : Math.round(img.width * 0.25);
    const across = runs(img, vertical ? 'h' : 'v', probe);
    const first = across.reduce((a, b) => (b.length > a.length ? b : a), across[0]);
    const centre = Math.round(first.start + first.length / 2);
    const along = runs(img, vertical ? 'v' : 'h', centre).map((r) => [r.start, r.length, r.rgb]);
    return { centre, along, size: [img.width, img.height] };
}

async function open(options: AgCartesianChartOptions) {
    const chart = await createChart(options);
    await waitForChartStability(chart);
    return chart;
}

async function updated(chart: Awaited<ReturnType<typeof open>>, options: AgCartesianChartOptions) {
    await chart.update(prepareTestOptions({ ...options }) as any);
    await waitForChartStability(chart);
    return ctx.snapshot();
}

describe('bar gap spike', () => {
    it('Q1 vertical TC1 and mixed gaps', async () => {
        const chart = await open(stackOptions({ gaps: [0, 0, 0] }));
        report('q1.v.gap0', firstBar(ctx.snapshot(), true));
        report('q1.v.gap4', firstBar(await updated(chart, stackOptions({ gaps: [4, 4, 4] })), true));
        report('q1.v.mixed[4,0,4]', firstBar(await updated(chart, stackOptions({ gaps: [4, 0, 4] })), true));
        report('q1.v.mixed[0,4,0]', firstBar(await updated(chart, stackOptions({ gaps: [0, 4, 0] })), true));
        report('q1.v.top-only-gap[0,0,4]', firstBar(await updated(chart, stackOptions({ gaps: [0, 0, 4] })), true));
        report('q1.v.stroke2', firstBar(await updated(chart, stackOptions({ gaps: [4, 4, 4], strokeWidth: 2 })), true));
        report(
            'q1.v.radius12',
            firstBar(await updated(chart, stackOptions({ gaps: [4, 4, 4], cornerRadius: 12 })), true)
        );
        report(
            'q1.v.hidden-middle',
            firstBar(await updated(chart, stackOptions({ gaps: [4, 4, 4], visible: [true, false, true] })), true)
        );
        report(
            'q1.v.hidden-middle.gap0',
            firstBar(await updated(chart, stackOptions({ gaps: [0, 0, 0], visible: [true, false, true] })), true)
        );
        const small = [
            { c: 'A', a: 1, b: 29, d: 30 },
            { c: 'B', a: 15, b: 15, d: 15 },
        ];
        report(
            'q1.v.small-seg.gap0',
            firstBar(await updated(chart, stackOptions({ gaps: [0, 0, 0], data: small })), true)
        );
        report(
            'q1.v.small-seg.gap4',
            firstBar(await updated(chart, stackOptions({ gaps: [4, 4, 4], data: small })), true)
        );
        report(
            'q1.v.small-seg.gap20',
            firstBar(await updated(chart, stackOptions({ gaps: [20, 20, 20], data: small })), true)
        );
        expect(true).toBe(true);
    });

    it('Q1 horizontal and rescale', async () => {
        const chart = await open(stackOptions({ gaps: [0, 0, 0], direction: 'horizontal' }));
        report('q1.h.gap0', firstBar(ctx.snapshot(), false));
        report(
            'q1.h.gap4',
            firstBar(await updated(chart, stackOptions({ gaps: [4, 4, 4], direction: 'horizontal' })), false)
        );
        report(
            'q1.h.mixed[4,0,4]',
            firstBar(await updated(chart, stackOptions({ gaps: [4, 0, 4], direction: 'horizontal' })), false)
        );
        expect(true).toBe(true);
    });

    it('Q1 negative values', async () => {
        const data = [
            { c: 'A', a: 10, b: -20, d: -30 },
            { c: 'B', a: -15, b: 15, d: 15 },
            { c: 'C', a: -5, b: -25, d: 20 },
        ];
        const o = (gaps: number[], direction: 'vertical' | 'horizontal' = 'vertical') => ({
            ...stackOptions({ gaps, data, direction }),
        });
        const chart = await open(o([0, 0, 0]));
        report('q1.neg.v.gap0', firstBar(ctx.snapshot(), true));
        report('q1.neg.v.gap4', firstBar(await updated(chart, o([4, 4, 4])), true));
        report('q1.neg.h.gap4', firstBar(await updated(chart, o([4, 4, 4], 'horizontal')), false));
        expect(true).toBe(true);
    });

    it('Q1 normalised', async () => {
        const chart = await open(stackOptions({ gaps: [0, 0, 0], normalizedTo: 100 }));
        report('q1.norm.gap0', firstBar(ctx.snapshot(), true));
        report(
            'q1.norm.gap4',
            firstBar(await updated(chart, stackOptions({ gaps: [4, 4, 4], normalizedTo: 100 })), true)
        );
        expect(true).toBe(true);
    });

    it('Q1 unstacked has no effect', async () => {
        const unstacked = (gap: number) => {
            const o: any = stackOptions({ gaps: [gap, gap, gap] });
            for (const s of o.series) s.stacked = false;
            return o as AgCartesianChartOptions;
        };
        const chart = await open(unstacked(0));
        const a = ctx.snapshot();
        const b = await updated(chart, unstacked(4));
        let differing = 0;
        for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) differing++;
        report('q1.unstacked.differingBytes', differing);
        expect(true).toBe(true);
    });

    it('Q4 crisp snapping at pixel ratio 1 and 2', async () => {
        const chart = await open(stackOptions({ gaps: [0, 0, 0] }));
        for (const pixelRatio of [1, 2]) {
            await resizeChartContainer(chart, { width: 800, height: 600, pixelRatio });
            for (const gap of [0, 1, 2, 3, 4, 5]) {
                const img = await updated(chart, stackOptions({ gaps: [gap, gap, gap] }));
                const bar = firstBar(img, true);
                report(`q4.pr${pixelRatio}.gap${gap}`, bar);
            }
        }
        expect(true).toBe(true);
    });

    it('Q1 rows at the stack ends with a corner radius, and rescale', async () => {
        await open(stackOptions({ gaps: [4, 4, 4], cornerRadius: 24 }));
        const img = ctx.snapshot();
        const { centre } = firstBar(img, true);
        const rowRuns = (y: number) =>
            runs(img, 'h', y)
                .filter((r) => r.length > 20)
                .map((r) => [r.start, r.length, r.rgb]);
        for (const y of [0, 2, 8, 24, 286, 290, 294, 477, 481, 485, 570, 574])
            report(`q1.radius24.row${y}`, rowRuns(y));
        report('q1.radius24.centre', centre);
        expect(true).toBe(true);
    });

    it.each([30, 60, 120])('Q1 gap is pixel-constant under rescale, max %d', async (max) => {
        const x: any = stackOptions({ gaps: [4, 4, 4] });
        x.axes[1].max = max;
        const rc = await open(x as AgCartesianChartOptions);
        report(
            `q1.rescale.domain${max}`,
            deproxy(rc).axes.map((a: any) => a.scale.domain)
        );
        report(`q1.rescale.max${max}`, firstBar(ctx.snapshot(), true).along.slice(0, 7));
        expect(true).toBe(true);
    });

    it('Q1 labels and midPoints follow the drawn edge', async () => {
        const o = (gap: number) => {
            const x: any = stackOptions({ gaps: [gap, gap, gap] });
            for (const s of x.series) s.label = { enabled: true, placement: 'inside-center' };
            return x as AgCartesianChartOptions;
        };
        const chart = await open(o(0));
        const read = () =>
            [0, 1, 2].map((i) => {
                const d = getBarSeriesContextNodeData(chart, i).nodeData[0];
                return {
                    key: d.yKey,
                    mid: [d.midPoint?.x, d.midPoint?.y],
                    clip: d.clipBBox && [d.clipBBox.y, d.clipBBox.height],
                    labelY: d.label?.y,
                };
            });
        report('q1.labels.gap0', read());
        await updated(chart, o(4));
        report('q1.labels.gap4', read());
        expect(true).toBe(true);
    });

    it('Q1 keyboard focus box excludes the gap', async () => {
        const chart = await open(stackOptions({ gaps: [4, 4, 4] }));
        await tabIntoChart(chart);
        const inBox = (y: number) => focusIndicatorContainsCanvasPoint(chart, { canvasX: 122, canvasY: y });
        report('q1.focus.series-a-datum0', {
            y482: inBox(482),
            y480: inBox(480),
            y479_5: inBox(479.5),
            y574: inBox(574),
            y575: inBox(575.5),
        });
        expect(true).toBe(true);
    });

    it('Q1 stroke on the bar centre', async () => {
        const chart = await open(stackOptions({ gaps: [4, 4, 4], strokeWidth: 2 }));
        report('q1.stroke2.centre', firstBar(ctx.snapshot(), true));
        const gap0 = await updated(chart, stackOptions({ gaps: [0, 0, 0], strokeWidth: 2 }));
        report('q1.stroke2.gap0', firstBar(gap0, true));
        expect(true).toBe(true);
    });

    it('Q2 picking in the gap', async () => {
        const pub = await open(stackOptions({ gaps: [4, 4, 4] }));
        const chart = deproxy(pub);
        const bar = firstBar(ctx.snapshot(), true);
        report('q2.runs', bar.along.slice(0, 5));
        const out: Record<string, string | undefined> = {};
        for (const y of [
            100, 284, 285, 286, 287, 288, 289, 290, 291, 300, 475, 476, 477, 478, 479, 480, 481, 482, 500, 574,
        ]) {
            await hoverAction(bar.centre, y)(chart);
            await waitForChartStability(chart);
            const h = chart.ctx.highlightManager.getActiveHighlight() as any;
            out[`y${y}`] = h?.yKey;
        }
        report('q2.gap4.pick-by-y', out);
        expect(true).toBe(true);
    });

    it('Q2 hover between bars picks nothing', async () => {
        const chart = deproxy(await open(stackOptions({ gaps: [4, 4, 4] })));
        await hoverAction(215, 288)(chart);
        await waitForChartStability(chart);
        report('q2.between-bars', (chart.ctx.highlightManager.getActiveHighlight() as any)?.yKey ?? null);
        await hoverAction(122, 288)(chart);
        await waitForChartStability(chart);
        report('q2.in-gap-fresh', (chart.ctx.highlightManager.getActiveHighlight() as any)?.yKey ?? null);
        expect(true).toBe(true);
    });

    it('Q1 focus bounds follow the drawn edge', async () => {
        const pub = await open(stackOptions({ gaps: [0, 0, 0] }));
        const read = () =>
            deproxy(pub).series.map((se: any) => {
                const out = se.pickFocus({ datumIndex: 0, datumIndexDelta: 0, otherIndex: 0, otherIndexDelta: 0 });
                const b = out?.bounds;
                return b && [se.options.yKey, b.x, b.y, b.width, b.height];
            });
        report('q1.focus.gap0', read());
        await updated(pub, stackOptions({ gaps: [4, 4, 4] }));
        report('q1.focus.gap4', read());
        expect(true).toBe(true);
    });
});
