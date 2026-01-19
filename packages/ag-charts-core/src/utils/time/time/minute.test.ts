import { expect, test } from '@jest/globals';

import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { intervalCeil, intervalFloor, intervalRange } from './index';

test('minute', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = 'minute';
    const date = new Date(2019, 7, 23, 15, 17, 5, 100);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2019, 7, 23, 15, 17, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2019, 7, 23, 15, 18, 0, 0));

    const range = intervalRange(interval, new Date(2019, 7, 23, 15, 17, 5, 100), new Date(2019, 7, 23, 15, 20, 5, 100));
    expect(range).toEqual([
        new Date(2019, 7, 23, 15, 18, 0, 0),
        new Date(2019, 7, 23, 15, 19, 0, 0),
        new Date(2019, 7, 23, 15, 20, 0, 0),
    ]);
});

test('minute.every', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'minute', step: 5 };
    const date = new Date(2019, 7, 23, 15, 17, 5, 100);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2019, 7, 23, 15, 15, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2019, 7, 23, 15, 20, 0, 0));

    const range = intervalRange(interval, new Date(2019, 7, 23, 15, 17, 5, 100), new Date(2019, 7, 23, 15, 32, 5, 100));
    expect(range).toEqual([
        new Date(2019, 7, 23, 15, 22, 0, 0),
        new Date(2019, 7, 23, 15, 27, 0, 0),
        new Date(2019, 7, 23, 15, 32, 0, 0),
    ]);
});

test('minute.every with defaultAlignment: interval', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'minute', step: 5 };

    const range = intervalRange(
        interval,
        new Date(2019, 7, 23, 15, 17, 5, 100),
        new Date(2019, 7, 23, 15, 32, 5, 100),
        { defaultAlignment: 'interval' }
    );
    expect(range).toEqual([
        new Date(2019, 7, 23, 15, 20, 0, 0),
        new Date(2019, 7, 23, 15, 25, 0, 0),
        new Date(2019, 7, 23, 15, 30, 0, 0),
    ]);
});
