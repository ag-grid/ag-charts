import { describe, expect, it } from 'vitest';

import { diffBars, toDatum } from './barTransaction';
import { BAR_INTERVAL_MS, type Bar } from './data';
import { type ChartDatum } from './types';

const T0 = Date.UTC(2024, 0, 1, 12, 0, 0);

const bar = (index: number): Bar => ({
    time: T0 + index * BAR_INTERVAL_MS,
    open: 100 + index,
    high: 101 + index,
    low: 99 + index,
    close: 100.5 + index,
    volume: 1_000 + index,
});

const window = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => bar(from + i));
const times = (items: { time: number }[]) => items.map((item) => item.time);

describe('diffBars', () => {
    it('reports no transaction when the window has not moved', () => {
        const bars = window(0, 10);
        const data = bars.map(toDatum);

        expect(diffBars(data, bars)).toBeUndefined();
        expect(times(data)).toEqual(times(bars));
    });

    it('appends bars that arrived since the last sync', () => {
        const data = window(0, 10).map(toDatum);
        const bars = window(0, 13);

        const transaction = diffBars(data, bars);

        expect(times(transaction!.add!)).toEqual(times(window(10, 13)));
        expect(transaction!.remove).toBeUndefined();
        expect(times(data)).toEqual(times(bars));
    });

    it('removes bars the feed has evicted from the front', () => {
        const data = window(0, 10).map(toDatum);
        const bars = window(3, 10);

        const transaction = diffBars(data, bars);

        expect(times(transaction!.remove!)).toEqual(times(window(0, 3)));
        expect(transaction!.add).toBeUndefined();
        expect(times(data)).toEqual(times(bars));
    });

    it('handles a window that both evicted and advanced in one step', () => {
        const data = window(0, 10).map(toDatum);
        const bars = window(2, 14);

        const transaction = diffBars(data, bars);

        expect(times(transaction!.remove!)).toEqual(times(window(0, 2)));
        expect(times(transaction!.add!)).toEqual(times(window(10, 14)));
        expect(times(data)).toEqual(times(bars));
    });

    it('replaces the data outright when the windows no longer overlap', () => {
        const data = window(0, 10).map(toDatum);
        const bars = window(50, 60);

        const transaction = diffBars(data, bars);

        expect(times(transaction!.remove!)).toEqual(times(window(0, 10)));
        expect(times(transaction!.add!)).toEqual(times(bars));
        expect(times(data)).toEqual(times(bars));
    });

    it('seeds an empty mirror from the whole window', () => {
        const data: ChartDatum[] = [];
        const bars = window(0, 5);

        const transaction = diffBars(data, bars);

        expect(times(transaction!.add!)).toEqual(times(bars));
        expect(times(data)).toEqual(times(bars));
    });

    it('scans only the changed ends, so cost is independent of retained history', () => {
        // A long pinned history with a single new bar: the removed/added ends are what matters,
        // not the 20k bars between them.
        const bars = window(0, 20_000);
        const data = bars.slice(0, 19_999).map(toDatum);

        const transaction = diffBars(data, bars);

        expect(transaction!.add).toHaveLength(1);
        expect(transaction!.remove).toBeUndefined();
        expect(data).toHaveLength(20_000);
    });

    it('carries a date derived from the bar time onto every datum', () => {
        const data: ChartDatum[] = [];

        diffBars(data, window(0, 3));

        expect(data.map((datum) => datum.date.getTime())).toEqual(times(window(0, 3)));
    });
});
