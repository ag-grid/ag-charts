import { expect, test } from '@jest/globals';

import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { intervalAgo, intervalCeil, intervalFloor, intervalRange } from './index';

test('millisecond', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = 'millisecond';
    const date = new Date(2023, 0, 18, 8, 31, 5, 125);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2023, 0, 18, 8, 31, 5, 125));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2023, 0, 18, 8, 31, 5, 125));

    const range = intervalRange(interval, new Date(2023, 0, 18, 8, 31, 5, 125), new Date(2023, 0, 18, 8, 31, 5, 127));
    expect(range).toEqual([
        new Date(2023, 0, 18, 8, 31, 5, 125),
        new Date(2023, 0, 18, 8, 31, 5, 126),
        new Date(2023, 0, 18, 8, 31, 5, 127),
    ]);

    const ago = intervalAgo(interval, date);
    expect(ago).toEqual(new Date(2023, 0, 18, 8, 31, 5, 124));
});

test('millisecond.every', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'millisecond', step: 100 };
    const date = new Date(2023, 0, 18, 8, 31, 5, 125);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2023, 0, 18, 8, 31, 5, 100));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2023, 0, 18, 8, 31, 5, 200));

    const range = intervalRange(interval, new Date(2023, 0, 18, 8, 31, 5, 125), new Date(2023, 0, 18, 8, 31, 5, 457));
    expect(range).toEqual([
        new Date(2023, 0, 18, 8, 31, 5, 125),
        new Date(2023, 0, 18, 8, 31, 5, 225),
        new Date(2023, 0, 18, 8, 31, 5, 325),
        new Date(2023, 0, 18, 8, 31, 5, 425),
    ]);
});

test('millisecond.every with defaultAlignment: interval', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'millisecond', step: 100 };

    const range = intervalRange(interval, new Date(2023, 0, 18, 8, 31, 5, 125), new Date(2023, 0, 18, 8, 31, 5, 457), {
        defaultAlignment: 'interval',
    });
    expect(range).toEqual([
        new Date(2023, 0, 18, 8, 31, 5, 200),
        new Date(2023, 0, 18, 8, 31, 5, 300),
        new Date(2023, 0, 18, 8, 31, 5, 400),
    ]);
});
