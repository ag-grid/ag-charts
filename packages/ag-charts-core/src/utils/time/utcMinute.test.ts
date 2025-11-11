import { expect, test } from '@jest/globals';

import { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { intervalCeil, intervalFloor, intervalRange } from './index';

test('UTC minute', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'minute', utc: true };
    const date = new Date(Date.UTC(2019, 7, 23, 15, 17, 5, 100));

    const floor = intervalFloor(interval, date);
    expect(floor.getTime()).toBe(Date.UTC(2019, 7, 23, 15, 17, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil.getTime()).toBe(Date.UTC(2019, 7, 23, 15, 18, 0, 0));

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2019, 7, 23, 15, 17, 5, 100)),
        new Date(Date.UTC(2019, 7, 23, 15, 20, 5, 100))
    );
    expect(range.map((d) => d.getTime())).toEqual([
        Date.UTC(2019, 7, 23, 15, 18, 0, 0),
        Date.UTC(2019, 7, 23, 15, 19, 0, 0),
        Date.UTC(2019, 7, 23, 15, 20, 0, 0),
    ]);
});

test('UTC minute.every', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'minute', step: 5, utc: true };
    const date = new Date(Date.UTC(2019, 7, 23, 15, 17, 5, 100));

    const floor = intervalFloor(interval, date);
    expect(floor.getTime()).toBe(Date.UTC(2019, 7, 23, 15, 15, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil.getTime()).toBe(Date.UTC(2019, 7, 23, 15, 20, 0, 0));

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2019, 7, 23, 15, 17, 5, 100)),
        new Date(Date.UTC(2019, 7, 23, 15, 32, 5, 100))
    );
    expect(range.map((d) => d.getTime())).toEqual([
        Date.UTC(2019, 7, 23, 15, 22, 0, 0),
        Date.UTC(2019, 7, 23, 15, 27, 0, 0),
        Date.UTC(2019, 7, 23, 15, 32, 0, 0),
    ]);
});

test('UTC minute.every with defaultAlignment: interval', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'minute', step: 5, utc: true };

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2019, 7, 23, 15, 17, 5, 100)),
        new Date(Date.UTC(2019, 7, 23, 15, 32, 5, 100)),
        { defaultAlignment: 'interval' }
    );
    expect(range.map((d) => d.getTime())).toEqual([
        Date.UTC(2019, 7, 23, 15, 20, 0, 0),
        Date.UTC(2019, 7, 23, 15, 25, 0, 0),
        Date.UTC(2019, 7, 23, 15, 30, 0, 0),
    ]);
});
