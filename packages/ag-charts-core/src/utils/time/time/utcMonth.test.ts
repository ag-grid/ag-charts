import { expect, test } from '@jest/globals';

import { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { intervalCeil, intervalFloor, intervalRange } from './index';

test('UTC month', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'month', utc: true };
    const date = new Date(Date.UTC(2023, 0, 18, 8, 31, 5, 125));

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(Date.UTC(2023, 0, 1, 0, 0, 0, 0)));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(Date.UTC(2023, 1, 1, 0, 0, 0, 0)));

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2023, 0, 18, 8, 31, 5, 125)),
        new Date(Date.UTC(2023, 3, 18, 8, 31, 5, 127))
    );
    expect(range).toEqual([
        new Date(Date.UTC(2023, 1, 1, 0, 0, 0, 0)),
        new Date(Date.UTC(2023, 2, 1, 0, 0, 0, 0)),
        new Date(Date.UTC(2023, 3, 1, 0, 0, 0, 0)),
    ]);
});

test('UTC month.every', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'month', step: 3, utc: true };
    const date = new Date(Date.UTC(2023, 1, 18, 8, 31, 5, 125));

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(Date.UTC(2023, 0, 1, 0, 0, 0, 0)));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(Date.UTC(2023, 3, 1, 0, 0, 0, 0)));

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2023, 1, 18, 8, 31, 5, 125)),
        new Date(Date.UTC(2023, 11, 18, 8, 31, 5, 127))
    );
    expect(range).toEqual([
        new Date(Date.UTC(2023, 4, 1, 0, 0, 0, 0)),
        new Date(Date.UTC(2023, 7, 1, 0, 0, 0, 0)),
        new Date(Date.UTC(2023, 10, 1, 0, 0, 0, 0)),
    ]);
});

test('UTC month.every with defaultAlignment: interval', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'month', step: 3, utc: true };

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2023, 1, 18, 8, 31, 5, 125)),
        new Date(Date.UTC(2023, 11, 18, 8, 31, 5, 127)),
        { defaultAlignment: 'interval' }
    );
    expect(range).toEqual([
        new Date(Date.UTC(2023, 3, 1, 0, 0, 0, 0)),
        new Date(Date.UTC(2023, 6, 1, 0, 0, 0, 0)),
        new Date(Date.UTC(2023, 9, 1, 0, 0, 0, 0)),
    ]);
});
