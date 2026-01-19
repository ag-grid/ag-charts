import { expect, test } from '@jest/globals';

import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { intervalCeil, intervalFloor, intervalRange } from './index';

it('should execute with UTC timezone', () => {
    expect(new Date(2023, 0, 1).getTimezoneOffset()).toEqual(0);
});

test('hour', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = 'hour';
    const date = new Date(2023, 0, 18, 8, 31, 5, 100);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2023, 0, 18, 8, 0, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2023, 0, 18, 9, 0, 0, 0));

    const range = intervalRange(interval, new Date(2023, 0, 18, 8, 31, 5, 100), new Date(2023, 0, 18, 11, 31, 5, 100));
    expect(range).toEqual([
        new Date(2023, 0, 18, 9, 0, 0, 0),
        new Date(2023, 0, 18, 10, 0, 0, 0),
        new Date(2023, 0, 18, 11, 0, 0, 0),
    ]);
});

test('hour.every', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'hour', step: 5, epoch: new Date(2023, 0, 18) };
    const date = new Date(2023, 0, 18, 8, 31, 5, 100);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2023, 0, 18, 5, 0, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2023, 0, 18, 10, 0, 0, 0));

    const range = intervalRange(interval, new Date(2023, 0, 18, 8, 31, 5, 100), new Date(2023, 0, 18, 21, 31, 5, 100));
    expect(range).toEqual([
        new Date(2023, 0, 18, 10, 0, 0, 0),
        new Date(2023, 0, 18, 15, 0, 0, 0),
        new Date(2023, 0, 18, 20, 0, 0, 0),
    ]);
});

test('hour.every with defaultAlignment: interval', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'hour', step: 4 };

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();

    const range = intervalRange(
        interval,
        new Date(year, month, date, 8, 31, 5, 100),
        new Date(year, month, date, 21, 31, 5, 100),
        { defaultAlignment: 'interval' }
    );
    expect(range).toEqual([
        new Date(year, month, date, 12, 0, 0, 0),
        new Date(year, month, date, 16, 0, 0, 0),
        new Date(year, month, date, 20, 0, 0, 0),
    ]);
});
