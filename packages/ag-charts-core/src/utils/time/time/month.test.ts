import { expect, test } from '@jest/globals';

import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { intervalAgo, intervalCeil, intervalFloor, intervalRange } from './index';

test('month', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = 'month';
    const date = new Date(2023, 0, 18, 8, 31, 5, 125);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2023, 0, 1, 0, 0, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2023, 1, 1, 0, 0, 0, 0));

    const range = intervalRange(interval, new Date(2023, 0, 18, 8, 31, 5, 125), new Date(2023, 3, 18, 8, 31, 5, 127));
    expect(range).toEqual([
        new Date(2023, 1, 1, 0, 0, 0, 0),
        new Date(2023, 2, 1, 0, 0, 0, 0),
        new Date(2023, 3, 1, 0, 0, 0, 0),
    ]);

    const ago = intervalAgo(interval, date);
    expect(ago).toEqual(new Date(2022, 11, 18, 8, 31, 5, 125));
});

test('month.every', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'month', step: 3 };
    const date = new Date(2023, 1, 18, 8, 31, 5, 125);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2023, 0, 1, 0, 0, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2023, 3, 1, 0, 0, 0, 0));

    const range = intervalRange(interval, new Date(2023, 1, 18, 8, 31, 5, 125), new Date(2023, 11, 18, 8, 31, 5, 127));
    expect(range).toEqual([
        new Date(2023, 4, 1, 0, 0, 0, 0),
        new Date(2023, 7, 1, 0, 0, 0, 0),
        new Date(2023, 10, 1, 0, 0, 0, 0),
    ]);
});

test('month.every with defaultAlignment: interval', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'month', step: 3 };

    const range = intervalRange(interval, new Date(2023, 1, 18, 8, 31, 5, 125), new Date(2023, 11, 18, 8, 31, 5, 127), {
        defaultAlignment: 'interval',
    });
    expect(range).toEqual([
        new Date(2023, 3, 1, 0, 0, 0, 0),
        new Date(2023, 6, 1, 0, 0, 0, 0),
        new Date(2023, 9, 1, 0, 0, 0, 0),
    ]);
});
