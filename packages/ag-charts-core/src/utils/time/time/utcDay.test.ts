import { expect, test } from '@jest/globals';

import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { intervalCeil, intervalFloor, intervalRange } from './index';

test('UTC day', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'day', utc: true };
    const date = new Date(Date.UTC(2023, 0, 18, 8, 31, 5, 100));

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(Date.UTC(2023, 0, 18, 0, 0, 0, 0)));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(Date.UTC(2023, 0, 19, 0, 0, 0, 0)));

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2023, 0, 18, 8, 31, 5, 100)),
        new Date(Date.UTC(2023, 0, 21, 8, 31, 5, 100))
    );
    expect(range).toEqual([
        new Date(Date.UTC(2023, 0, 19, 0, 0, 0, 0)),
        new Date(Date.UTC(2023, 0, 20, 0, 0, 0, 0)),
        new Date(Date.UTC(2023, 0, 21, 0, 0, 0, 0)),
    ]);
});

test('UTC day.every', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'day', step: 2, utc: true };
    const date = new Date(Date.UTC(2023, 0, 17, 8, 31, 5, 100));

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(Date.UTC(2023, 0, 17, 0, 0, 0, 0)));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(Date.UTC(2023, 0, 19, 0, 0, 0, 0)));

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2023, 0, 17, 8, 31, 5, 100)),
        new Date(Date.UTC(2023, 0, 23, 21, 31, 5, 100))
    );
    expect(range).toEqual([
        new Date(Date.UTC(2023, 0, 19, 0, 0, 0, 0)),
        new Date(Date.UTC(2023, 0, 21, 0, 0, 0, 0)),
        new Date(Date.UTC(2023, 0, 23, 0, 0, 0, 0)),
    ]);
});

test('UTC day.every with defaultAlignment: interval', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'day', step: 2, utc: true };

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2023, 0, 17, 8, 31, 5, 100)),
        new Date(Date.UTC(2023, 0, 23, 21, 31, 5, 100)),
        { defaultAlignment: 'interval' }
    );
    expect(range).toEqual([
        new Date(Date.UTC(2023, 0, 19, 0, 0, 0, 0)),
        new Date(Date.UTC(2023, 0, 21, 0, 0, 0, 0)),
        new Date(Date.UTC(2023, 0, 23, 0, 0, 0, 0)),
    ]);
});
