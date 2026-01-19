import { expect, test } from '@jest/globals';

import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { intervalCeil, intervalFloor, intervalRange } from './index';

test('year', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = 'year';
    const date = new Date(2023, 2, 18, 8, 31, 5, 125);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2023, 0, 1, 0, 0, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2024, 0, 1, 0, 0, 0, 0));

    const range = intervalRange(interval, new Date(2023, 2, 18, 8, 31, 5, 125), new Date(2026, 3, 18, 8, 31, 5, 127));
    expect(range).toEqual([
        new Date(2024, 0, 1, 0, 0, 0, 0),
        new Date(2025, 0, 1, 0, 0, 0, 0),
        new Date(2026, 0, 1, 0, 0, 0, 0),
    ]);
});

test('year.every', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'year', step: 100 };
    const date = new Date(2023, 2, 18, 8, 31, 5, 125);

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(2000, 0, 1, 0, 0, 0, 0));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(2100, 0, 1, 0, 0, 0, 0));

    const range = intervalRange(interval, new Date(2023, 2, 18, 8, 31, 5, 125), new Date(2345, 11, 18, 8, 31, 5, 127));
    expect(range).toEqual([
        new Date(2123, 0, 1, 0, 0, 0, 0),
        new Date(2223, 0, 1, 0, 0, 0, 0),
        new Date(2323, 0, 1, 0, 0, 0, 0),
    ]);
});

test('year.every with defaultAlignment: interval', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'year', step: 100 };
    const range = intervalRange(interval, new Date(2023, 2, 18, 8, 31, 5, 125), new Date(2345, 11, 18, 8, 31, 5, 127), {
        defaultAlignment: 'interval',
    });
    expect(range).toEqual([
        new Date(2100, 0, 1, 0, 0, 0, 0),
        new Date(2200, 0, 1, 0, 0, 0, 0),
        new Date(2300, 0, 1, 0, 0, 0, 0),
    ]);
});
