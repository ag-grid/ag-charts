import { type AgDataTransaction } from 'ag-charts-community';

import { type Bar } from './data';
import { type ChartDatum } from './types';

export const toDatum = (bar: Bar): ChartDatum => ({ ...bar, date: new Date(bar.time) });

/**
 * Diff the chart's mirrored data against the feed's window, mutating `data` to match and returning
 * the transaction that carries the same change to the chart, or undefined when nothing moved.
 *
 * Both are trailing slices of one growing series on a shared time grid, so only the ends differ:
 * bars leave the front as the feed evicts and arrive at the back as it ticks. Scanning just those
 * ends keeps a tick independent of how much history is retained.
 */
export function diffBars(data: ChartDatum[], bars: Bar[]): AgDataTransaction<ChartDatum> | undefined {
    const oldest = bars.length ? bars[0].time : Number.POSITIVE_INFINITY;
    let evicted = 0;
    while (evicted < data.length && data[evicted].time < oldest) {
        evicted++;
    }

    const newest = data.length ? data[data.length - 1].time : Number.NEGATIVE_INFINITY;
    let appendFrom = bars.length;
    while (appendFrom > 0 && bars[appendFrom - 1].time > newest) {
        appendFrom--;
    }

    const transaction: AgDataTransaction<ChartDatum> = {};
    if (evicted > 0) transaction.remove = data.splice(0, evicted);
    if (appendFrom < bars.length) {
        const added = bars.slice(appendFrom).map(toDatum);
        data.push(...added);
        transaction.add = added;
    }
    return transaction.remove || transaction.add ? transaction : undefined;
}
