import { expect, test } from '@jest/globals';

import { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { intervalCeil, intervalFloor, intervalRange } from './index';

test('second', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = 'second';
    const date = new Date(2023, 0, 18, 8, 31, 5, 125);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2023, 0, 18, 8, 31, 5, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2023, 0, 18, 8, 31, 6, 0));

    const range = intervalRange(interval, new Date(2023, 0, 18, 8, 31, 5, 125), new Date(2023, 0, 18, 8, 31, 8, 127));
    expect(range).toEqual([
        new Date(2023, 0, 18, 8, 31, 6, 0),
        new Date(2023, 0, 18, 8, 31, 7, 0),
        new Date(2023, 0, 18, 8, 31, 8, 0),
    ]);
});

test('second.every', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'second', step: 10 };
    const date = new Date(2023, 0, 18, 8, 31, 25, 125);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2023, 0, 18, 8, 31, 20, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2023, 0, 18, 8, 31, 30, 0));

    const range = intervalRange(interval, new Date(2023, 0, 18, 8, 31, 25, 125), new Date(2023, 0, 18, 8, 31, 55, 457));
    expect(range).toEqual([
        new Date(2023, 0, 18, 8, 31, 35, 0),
        new Date(2023, 0, 18, 8, 31, 45, 0),
        new Date(2023, 0, 18, 8, 31, 55, 0),
    ]);
});

test('second.every with defaultAlignment: interval', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'second', step: 10 };

    const range = intervalRange(
        interval,
        new Date(2023, 0, 18, 8, 31, 25, 125),
        new Date(2023, 0, 18, 8, 31, 55, 457),
        { defaultAlignment: 'interval' }
    );
    expect(range).toEqual([
        new Date(2023, 0, 18, 8, 31, 30, 0),
        new Date(2023, 0, 18, 8, 31, 40, 0),
        new Date(2023, 0, 18, 8, 31, 50, 0),
    ]);
});
