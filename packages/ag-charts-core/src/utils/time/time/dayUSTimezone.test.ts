/**
 * @timezone US/Pacific
 */
import { expect, test } from '@jest/globals';

import { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { intervalCeil, intervalFloor, intervalRange } from './index';

it('should execute with Los Angeles timezone', () => {
    expect(new Date(2023, 0, 1).getTimezoneOffset()).toEqual(480);
});

test('day', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = 'day';
    const date = new Date(2023, 0, 18, 8, 31, 5, 100);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2023, 0, 18, 0, 0, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2023, 0, 19, 0, 0, 0, 0));

    const range = intervalRange(interval, new Date(2023, 0, 18, 8, 31, 5, 100), new Date(2023, 0, 21, 8, 31, 5, 100));
    expect(range).toEqual([
        new Date(2023, 0, 19, 0, 0, 0, 0),
        new Date(2023, 0, 20, 0, 0, 0, 0),
        new Date(2023, 0, 21, 0, 0, 0, 0),
    ]);
});

test('day.every', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'day', step: 2 };
    const date = new Date(2023, 0, 17, 8, 31, 5, 100);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2023, 0, 17, 0, 0, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2023, 0, 19, 0, 0, 0, 0));

    const range = intervalRange(interval, new Date(2023, 0, 17, 8, 31, 5, 100), new Date(2023, 0, 23, 21, 31, 5, 100));
    expect(range).toEqual([
        new Date(2023, 0, 19, 0, 0, 0, 0),
        new Date(2023, 0, 21, 0, 0, 0, 0),
        new Date(2023, 0, 23, 0, 0, 0, 0),
    ]);
});

test('day.every with defaultAlignment: interval', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'day', step: 2 };

    const range = intervalRange(interval, new Date(2023, 0, 17, 8, 31, 5, 100), new Date(2023, 0, 23, 21, 31, 5, 100), {
        defaultAlignment: 'interval',
    });
    expect(range).toEqual([
        new Date(2023, 0, 19, 0, 0, 0, 0),
        new Date(2023, 0, 21, 0, 0, 0, 0),
        new Date(2023, 0, 23, 0, 0, 0, 0),
    ]);
});

test('day.every stick to a date', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'day', step: 5, epoch: new Date(2023, 1, 2) };
    const ticks = intervalRange(interval, new Date(2023, 1, 1), new Date(2023, 1, 28));
    expect(ticks).toEqual([
        new Date(2023, 1, 2),
        new Date(2023, 1, 7),
        new Date(2023, 1, 12),
        new Date(2023, 1, 17),
        new Date(2023, 1, 22),
        new Date(2023, 1, 27),
    ]);
});

test('day.every stick to a different date', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'day', step: 5, epoch: new Date(2023, 1, 4) };
    const ticks = intervalRange(interval, new Date(2023, 1, 1), new Date(2023, 1, 28));
    expect(ticks).toEqual([
        new Date(2023, 1, 4),
        new Date(2023, 1, 9),
        new Date(2023, 1, 14),
        new Date(2023, 1, 19),
        new Date(2023, 1, 24),
    ]);
});
