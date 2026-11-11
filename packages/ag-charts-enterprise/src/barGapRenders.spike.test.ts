import { mkdirSync, writeFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import {
    deproxy,
    scrollAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart } from './test/utils';

setupMockConsole();
const ctx = setupMockCanvas();

type Run = { start: number; length: number; rgb: string };

function report(name: string, value: unknown) {
    process.stdout.write(`SPIKE ${name} ${JSON.stringify(value)}\n`);
}

function isBackground(d: Uint8ClampedArray, i: number) {
    return d[i + 3] === 0 || (d[i] > 250 && d[i + 1] > 250 && d[i + 2] > 250);
}

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
        if (cur?.rgb === rgb) cur.length++;
        else {
            cur = { start: p, length: 1, rgb };
            out.push(cur);
        }
    }
    return out;
}

const COLOURS = ['#ff0000', '#00ff00', '#0000ff'];
const hidden = { enabled: false };

const DATA = [
    { c: 'A', a: 10, b: 20, d: 30 },
    { c: 'B', a: 15, b: 15, d: 15 },
    { c: 'C', a: 5, b: 25, d: 20 },
    { c: 'D', a: 20, b: 10, d: 10 },
];

function base(extra: Record<string, unknown>, series: Record<string, unknown>[]): AgCartesianChartOptions {
    return {
        width: 400,
        height: 400,
        animation: { enabled: false },
        legend: { enabled: false },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        data: DATA,
        series: ['a', 'b', 'd'].map((yKey, i) => ({
            type: 'bar',
            xKey: 'c',
            yKey,
            stacked: true,
            fill: COLOURS[i],
            fillOpacity: 1,
            stroke: '#000000',
            strokeWidth: 0,
            ...series[i],
        })),
        axes: {
            x: { type: 'category', position: 'bottom', line: hidden, tick: hidden, label: hidden, gridLine: hidden },
            y: {
                type: 'number',
                position: 'left',
                line: hidden,
                tick: hidden,
                label: hidden,
                gridLine: hidden,
                nice: false,
                min: 0,
            },
        },
        ...extra,
    } as unknown as AgCartesianChartOptions;
}

/** Vertical runs through the centre of the widest first bar, plus the line they were read on. */
function firstBar(img: ImageData, column?: 'centre' | 'edge') {
    const probe = Math.round(img.height * 0.75);
    const across = runs(img, 'h', probe);
    const first = across.reduce((a, b) => (b.length > a.length ? b : a), across[0]);
    const x = column === 'edge' ? first.start + 1 : Math.round(first.start + first.length / 2);
    return { x, widthAtProbe: first.length, along: runs(img, 'v', x).map((r) => [r.start, r.length, r.rgb]) };
}

const SHOTS = process.env.SPIKE_SHOTS;

describe('bar gap renders (theme override, yFilterKey, wheel zoom)', () => {
    // One chart per test: the mock canvas snapshot follows the canvas of the chart created in that test.
    let current: any;
    afterEach(() => {
        current?.destroy?.();
        current = undefined;
    });
    async function open(options: AgCartesianChartOptions) {
        const pub = await createEnterpriseChart(options);
        current = pub;
        await pub.waitForUpdate();
        await waitForChartStability(deproxy(pub));
        return { pub, chart: deproxy(pub) as any };
    }

    const themed = (gap: number) => ({ theme: { overrides: { bar: { series: { gap } } } } });
    const THEME_CASES: [string, Record<string, unknown>, Record<string, unknown>[]][] = [
        ['none', {}, [{}, {}, {}]],
        ['series-gap4', {}, [{ gap: 4 }, { gap: 4 }, { gap: 4 }]],
        ['override-gap4', themed(4), [{}, {}, {}]],
        ['override-gap4.series-b-gap0', themed(4), [{}, { gap: 0 }, {}]],
        ['override-gap4.series-all-gap0', themed(4), [{ gap: 0 }, { gap: 0 }, { gap: 0 }]],
        ['override-gap0', themed(0), [{}, {}, {}]],
    ];
    it.each(THEME_CASES)('item 3a: theme %s', async (name, extra, series) => {
        const h = await open(base(extra, series));
        report(`r.theme.${name}`, {
            ...firstBar(ctx.snapshot()),
            halfGaps: (h.chart.series as any[]).map((s: any) => s.nodeDatumContext?.halfGap),
        });
        if (SHOTS != null && SHOTS !== '' && name === 'override-gap4') {
            mkdirSync(SHOTS, { recursive: true });
            writeFileSync(`${SHOTS}/theme-override-gap4.png`, await ctx.nodeCanvas.toBuffer('png'));
        }
        expect(true).toBe(true);
    });

    it.each([0, 4])('item 3b: yFilterKey gap %i', async (gap) => {
        const data = DATA.map((r) => ({ ...r, fa: r.a * 0.5, fb: r.b * 0.5, fd: r.d * 0.5 }));
        const h = await open(
            base({ data }, [
                { gap, yFilterKey: 'fa' },
                { gap, yFilterKey: 'fb' },
                { gap, yFilterKey: 'fd' },
            ])
        );
        const img = ctx.snapshot();
        report(`r.filter.gap${gap}.centre`, firstBar(img, 'centre'));
        report(`r.filter.gap${gap}.edge`, firstBar(img, 'edge'));
        report(
            `r.filter.gap${gap}.nodes`,
            (h.chart.series as any[]).map((s: any) => {
                const pick = (nd: any) =>
                    nd == null
                        ? null
                        : {
                              clipY: +nd.clipBBox.y.toFixed(2),
                              clipH: +nd.clipBBox.height.toFixed(2),
                              pickY: nd.pickBBox ? +nd.pickBBox.y.toFixed(2) : null,
                              pickH: nd.pickBBox ? +nd.pickBBox.height.toFixed(2) : null,
                          };
                return {
                    overlay: pick(s.contextNodeData.nodeData[0]),
                    phantom: pick(s.contextNodeData.phantomNodeData[0]),
                };
            })
        );
        if (SHOTS != null && SHOTS !== '' && gap === 4) {
            mkdirSync(SHOTS, { recursive: true });
            writeFileSync(`${SHOTS}/yfilter-gap4.png`, await ctx.nodeCanvas.toBuffer('png'));
        }
        expect(true).toBe(true);
    });

    const n = 30;
    const zoomData = Array.from({ length: n }, (_, i) => ({
        c: `K${String(i).padStart(2, '0')}`,
        a: 10 + (i % 5) * 4,
        b: 20 - (i % 4) * 3,
        d: 15 + (i % 3) * 5,
    }));
    /** Coverage-weighted column read: summed whiteness between the first and last bar row, and the true stack ends. */
    const probe = (img: ImageData) => {
        const bar = firstBar(img, 'centre');
        const { data, width, height } = img;
        const wh: number[] = [];
        for (let y = 0; y < height; y++) {
            const i = (y * width + bar.x) * 4;
            wh.push(data[i + 3] === 0 ? 1 : Math.min(data[i], data[i + 1], data[i + 2]) / 255);
        }
        const first = wh.findIndex((w) => w < 1);
        let last = wh.length - 1;
        while (last > 0 && wh[last] >= 1) last--;
        let interior = 0;
        for (let y = first + 1; y < last; y++) interior += wh[y];
        return {
            x: bar.x,
            barWidth: bar.widthAtProbe,
            top: +(first + wh[first]).toFixed(2),
            bottom: +(last + 1 - wh[last]).toFixed(2),
            interior: +interior.toFixed(2),
            clippedAtTop: first === 0,
        };
    };
    const ZOOM_CASES: [string, number][] = [];
    for (const axes of ['xy', 'y', 'x']) for (const gap of [4, 0]) ZOOM_CASES.push([axes, gap]);
    it.each(ZOOM_CASES)(
        'item 4: wheel zoom axes %s gap %i',
        async (axes, gap) => {
            const h = await open(
                base(
                    {
                        data: zoomData,
                        zoom: {
                            enabled: true,
                            axes,
                            anchorPointX: 'pointer',
                            anchorPointY: 'pointer',
                            minVisibleItems: 0,
                        },
                    },
                    [{ gap }, { gap }, { gap }]
                )
            );
            const rows: unknown[] = [];
            for (let step = 0; step <= 4; step++) {
                if (step > 0) {
                    await scrollAction(200, 400, -1)(h.chart);
                    await h.pub.waitForUpdate();
                    await waitForChartStability(h.chart);
                }
                const s0 = h.chart.series[0];
                rows.push({
                    step,
                    ...probe(ctx.snapshot()),
                    nodes: s0.contextNodeData.nodeData.length,
                    aggregated: s0.nodeDatumContext?.dataAggregationFilter != null,
                    crisp: s0.nodeDatumContext?.crisp,
                });
            }
            report(`r.zoom.${axes}.gap${gap}`, rows);
            expect(true).toBe(true);
        },
        300000
    );
});
