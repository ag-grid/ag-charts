import { describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { getData } from '../../ag-charts-website/src/content/docs/benchmarks/_examples/high-perf-bar-stacked/data';
import { createEnterpriseChart } from './test/utils';

setupMockConsole();
setupMockCanvas();

function report(name: string, value: unknown) {
    process.stdout.write(`SPIKE ${name} ${JSON.stringify(value)}\n`);
}

const UNSET = 0xffffffff;
const SPAN = 5;

/**
 * Classifies every aggregated bucket of the bench data from the values at its `yMinIndex` and `yMaxIndex`,
 * and checks the drawn edges against the stack: a stack end or baseline that moved, or an inset on an edge with no neighbour.
 */
describe('bar gap odd-inset buckets (bench data)', () => {
    it('classifies buckets', async () => {
        const options = {
            data: getData(),
            animation: { enabled: false },
            zoom: { enabled: true, anchorPointX: 'pointer', anchorPointY: 'pointer', minVisibleItems: 0 },
            navigator: { enabled: true },
            series: [
                { type: 'bar', xKey: 'timestamp', yKey: 'open', stacked: true, gap: 4 },
                { type: 'bar', xKey: 'timestamp', yKey: 'close', stacked: true, gap: 4 },
            ],
            axes: { x: { type: 'unit-time' } },
        } as unknown as AgCartesianChartOptions;
        const pub = await createEnterpriseChart(options);
        const chart = deproxy(pub);

        const sums: unknown[] = [];
        const samples: Record<string, unknown[]> = {};
        let moved = 0;
        let spurious = 0;
        let edgeWrong = 0;
        const bySeries: Record<
            number,
            Map<string, { cLen: number; pLen: number; startInset: number; endInset: number }>
        > = {};

        for (const [seriesIndex, se] of (chart.series as any[]).entries()) {
            const ctx = se.nodeDatumContext;
            const filter = ctx.dataAggregationFilter;
            const nodes = new Map<number, any[]>();
            for (const nd of se.contextNodeData.nodeData) {
                const list = nodes.get(nd.datumIndex) ?? [];
                list.push(nd);
                nodes.set(nd.datumIndex, list);
            }
            const classes: Record<string, number> = {};
            let matched = 0;
            let duplicateKeys = 0;
            const hist: Record<string, number> = {};
            const pairs = new Map<string, { cLen: number; pLen: number; startInset: number; endInset: number }>();
            bySeries[seriesIndex] = pairs;

            for (const positive of [true, false]) {
                const indexData: Uint32Array = positive ? filter.positiveIndexData : filter.negativeIndexData;
                const Y_MIN = positive ? 2 : 3;
                const Y_MAX = positive ? 3 : 2;
                for (let i = 0; i < indexData.length / SPAN; i++) {
                    const a = i * SPAN;
                    if (indexData[a] === UNSET) continue;
                    const yMinIndex = indexData[a + Y_MIN];
                    const yMaxIndex = indexData[a + Y_MAX];
                    const list = nodes.get(yMaxIndex);
                    if (list == null) continue;
                    if (list.length > 1) duplicateKeys++;
                    const nd = list[0];
                    if (nd.pickBBox == null || nd.clipBBox == null) continue;
                    matched++;

                    const yStart = Number(ctx.yStartValues[yMinIndex]);
                    const yEnd = Number(ctx.yEndValues[yMaxIndex]);
                    const total = se.stackTotalOfDatum(yMaxIndex, positive);
                    const yRange = total == null ? yEnd : Number(total);

                    // Pixel extents: pick is the bucket before the inset, clip is what is drawn
                    const pLow = nd.pickBBox.y;
                    const pLen = nd.pickBBox.height;
                    const cLow = nd.clipBBox.y;
                    const cLen = nd.clipBBox.height;
                    const lowInset = cLow - pLow;
                    const highInset = pLow + pLen - (cLow + cLen);
                    const key = `${Math.round(lowInset)}/${Math.round(highInset)}`;
                    hist[key] = (hist[key] ?? 0) + 1;

                    // Neighbours as the stack sees them at each datum: raw values of both series
                    const raw = (s: any, idx: number) => Number(s.nodeDatumContext.yRawValues[idx]);
                    const other = chart.series[1 - seriesIndex] as any;
                    const row = {
                        positive,
                        yMinIndex,
                        yMaxIndex,
                        own: [raw(se, yMinIndex), raw(se, yMaxIndex)],
                        other: [raw(other, yMinIndex), raw(other, yMaxIndex)],
                        yStart,
                        yEnd,
                        yRange,
                        pLen: +pLen.toFixed(3),
                        cLen: +cLen.toFixed(3),
                        lowInset: +lowInset.toFixed(3),
                        highInset: +highInset.toFixed(3),
                    };

                    // Neighbour on the same side at a datum
                    const sameSide = (v: number) => (positive ? v > 0 : v < 0);
                    const hasBelowNeighbour = seriesIndex === 1 && sameSide(raw(other, yMinIndex));
                    const hasAboveNeighbour = seriesIndex === 0 && sameSide(raw(other, yMaxIndex));
                    const startEdgeInset = hasBelowNeighbour ? 2 : 0;
                    const endEdgeInset = hasAboveNeighbour ? 2 : 0;
                    const collapsed = cLen <= 1e-9;

                    // Which pixel side is the start edge: lowest value is nearest the baseline
                    // (insets are reported in pixel order, so sum both for comparison)
                    const expectedTotal = startEdgeInset + endEdgeInset;
                    const drawnTotal = lowInset + highInset;
                    let cls: string;
                    if (collapsed) {
                        const owed = expectedTotal > 0 && pLen <= expectedTotal;
                        cls = owed ? 'collapsed (segment <= its share of the gap)' : 'zero-length, no inset owed';
                    } else if (expectedTotal === 0 && drawnTotal < 1e-9) {
                        cls = 'no neighbour, no inset';
                    } else if (Math.abs(drawnTotal - expectedTotal) < 1e-6) {
                        cls = 'expected inset';
                    } else {
                        cls = 'MISMATCH';
                    }
                    // Per edge: the start edge is the larger pixel row on the positive side, the smaller on the negative side
                    const startIsLow = !positive;
                    const lowExpected = startIsLow ? startEdgeInset : endEdgeInset;
                    const highExpected = startIsLow ? endEdgeInset : startEdgeInset;
                    if (
                        !collapsed &&
                        (Math.abs(lowInset - lowExpected) > 1e-6 || Math.abs(highInset - highExpected) > 1e-6)
                    ) {
                        edgeWrong++;
                    }
                    pairs.set(`${positive}:${i}`, {
                        cLen,
                        pLen,
                        startInset: startIsLow ? lowInset : highInset,
                        endInset: startIsLow ? highInset : lowInset,
                    });
                    classes[cls] = (classes[cls] ?? 0) + 1;
                    if (cls === 'MISMATCH' && expectedTotal === 0 && drawnTotal > 0) spurious++;
                    if (cls === 'MISMATCH' && drawnTotal < expectedTotal) moved++;
                    const sampleKey = `s${seriesIndex} ${key} ${cls}`;
                    const sampleList = samples[sampleKey] ?? [];
                    samples[sampleKey] = sampleList;
                    if (sampleList.length < 3) sampleList.push(row);
                }
            }
            sums.push({
                seriesIndex,
                nodes: se.contextNodeData.nodeData.length,
                matched,
                duplicateKeys,
                hist,
                classes,
            });
        }
        // Series 1 buckets whose start edge is inset because of a series 0 segment that is not drawn in the same bucket
        let floating = 0;
        let floatingOfCollapsed = 0;
        const floatingLen: number[] = [];
        for (const [key, b1] of bySeries[1]) {
            const b0 = bySeries[0].get(key);
            if (b1.startInset > 0 && b1.cLen > 0 && (b0 == null || b0.cLen === 0)) {
                floating++;
                if (b0 != null) floatingOfCollapsed++;
                if (b0 != null) floatingLen.push(+b0.pLen.toFixed(2));
            }
        }
        report('odd.floating', { floating, floatingOfCollapsed, s0PickLenOfThose: floatingLen });
        report('odd.edges', { edgeWrong });
        report('odd.summary', sums);
        report('odd.moved', { moved, spurious });
        report('odd.samples', samples);
        expect(true).toBe(true);
    }, 300000);
});
