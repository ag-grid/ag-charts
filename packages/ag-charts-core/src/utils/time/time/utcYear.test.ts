import { expect, test } from '@jest/globals';

import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { intervalCeil, intervalFloor, intervalRange } from './index';

test('UTC year', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'year', utc: true };
    const date = new Date(Date.UTC(2023, 2, 18, 8, 31, 5, 125));

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(Date.UTC(2023, 0, 1, 0, 0, 0, 0)));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(Date.UTC(2024, 0, 1, 0, 0, 0, 0)));

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2023, 2, 18, 8, 31, 5, 125)),
        new Date(Date.UTC(2026, 3, 18, 8, 31, 5, 127))
    );
    expect(range).toEqual([
        new Date(Date.UTC(2024, 0, 1, 0, 0, 0, 0)),
        new Date(Date.UTC(2025, 0, 1, 0, 0, 0, 0)),
        new Date(Date.UTC(2026, 0, 1, 0, 0, 0, 0)),
    ]);
});

test('UTC year.every', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'year', step: 100, utc: true };
    const date = new Date(Date.UTC(2023, 2, 18, 8, 31, 5, 125));

    const floor = intervalFloor(interval, date);
    expect(floor).toEqual(new Date(Date.UTC(2000, 0, 1, 0, 0, 0, 0)));

    const ceil = intervalCeil(interval, date);
    expect(ceil).toEqual(new Date(Date.UTC(2100, 0, 1, 0, 0, 0, 0)));

    const range = intervalRange(
        interval,
        new Date(Date.UTC(2023, 2, 18, 8, 31, 5, 125)),
        new Date(Date.UTC(2345, 11, 18, 8, 31, 5, 127))
    );
    expect(range).toEqual([
        new Date(Date.UTC(2123, 0, 1, 0, 0, 0, 0)),
        new Date(Date.UTC(2223, 0, 1, 0, 0, 0, 0)),
        new Date(Date.UTC(2323, 0, 1, 0, 0, 0, 0)),
    ]);
});

test('UTC year.every with defaultAlignment: interval', () => {
    const interval: AgTimeInterval | AgTimeIntervalUnit = { unit: 'year', step: 100, utc: true };
    const range = intervalRange(
        interval,
        new Date(Date.UTC(2023, 2, 18, 8, 31, 5, 125)),
        new Date(Date.UTC(2345, 11, 18, 8, 31, 5, 127)),
        { defaultAlignment: 'interval' }
    );
    expect(range).toEqual([
        new Date(Date.UTC(2100, 0, 1, 0, 0, 0, 0)),
        new Date(Date.UTC(2200, 0, 1, 0, 0, 0, 0)),
        new Date(Date.UTC(2300, 0, 1, 0, 0, 0, 0)),
    ]);
});
