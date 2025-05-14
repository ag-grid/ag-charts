import { expect, test } from '@jest/globals';

import { TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

import { intervalCeil, intervalFloor, intervalRange } from './index';

test('millisecond', () => {
    const interval: TimeInterval | TimeIntervalUnit = 'millisecond';
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
});

test('millisecond.every', () => {
    const interval: TimeInterval | TimeIntervalUnit = { unit: 'millisecond', step: 100 };
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
    const interval: TimeInterval | TimeIntervalUnit = { unit: 'millisecond', step: 100 };

    const range = intervalRange(interval, new Date(2023, 0, 18, 8, 31, 5, 125), new Date(2023, 0, 18, 8, 31, 5, 457), {
        defaultAlignment: 'interval',
    });
    expect(range).toEqual([
        new Date(2023, 0, 18, 8, 31, 5, 200),
        new Date(2023, 0, 18, 8, 31, 5, 300),
        new Date(2023, 0, 18, 8, 31, 5, 400),
    ]);
});
