import { expect, test } from '@jest/globals';

import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { intervalCeil, intervalFloor, intervalRange } from './index';

test('UTC hour', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'hour', utc: true };
    const date = new Date(Date.UTC(2023, 0, 18, 8, 31, 5, 100));

    const floor = intervalFloor(interval, date);
    expect(floor.getTime()).toBe(Date.UTC(2023, 0, 18, 8, 0, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil.getTime()).toBe(Date.UTC(2023, 0, 18, 9, 0, 0, 0));

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2023, 0, 18, 8, 31, 5, 100)),
        new Date(Date.UTC(2023, 0, 18, 11, 31, 5, 100))
    );
    expect(range.map((d) => d.getTime())).toEqual([
        Date.UTC(2023, 0, 18, 9, 0, 0, 0),
        Date.UTC(2023, 0, 18, 10, 0, 0, 0),
        Date.UTC(2023, 0, 18, 11, 0, 0, 0),
    ]);
});

test('UTC hour.every', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = {
        unit: 'hour',
        step: 5,
        epoch: new Date(2023, 0, 18),
        utc: true,
    };
    const date = new Date(Date.UTC(2023, 0, 18, 8, 31, 5, 100));

    const floor = intervalFloor(interval, date);
    expect(floor.getTime()).toBe(Date.UTC(2023, 0, 18, 5, 0, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil.getTime()).toBe(Date.UTC(2023, 0, 18, 10, 0, 0, 0));

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2023, 0, 18, 8, 31, 5, 100)),
        new Date(Date.UTC(2023, 0, 18, 21, 31, 5, 100))
    );
    expect(range.map((d) => d.getTime())).toEqual([
        Date.UTC(2023, 0, 18, 10, 0, 0, 0),
        Date.UTC(2023, 0, 18, 15, 0, 0, 0),
        Date.UTC(2023, 0, 18, 20, 0, 0, 0),
    ]);
});

test('UTC hour.every with defaultAlignment: interval', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'hour', step: 5, utc: true };

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2023, 0, 18, 8, 31, 5, 100)),
        new Date(Date.UTC(2023, 0, 18, 21, 31, 5, 100)),
        { defaultAlignment: 'interval' }
    );
    expect(range.map((d) => d.getTime())).toEqual([
        Date.UTC(2023, 0, 18, 10, 0, 0, 0),
        Date.UTC(2023, 0, 18, 15, 0, 0, 0),
        Date.UTC(2023, 0, 18, 20, 0, 0, 0),
    ]);
});
