import { describe, expect, it } from 'vitest';

import { CARTESIAN_AXIS_TYPE, ChartAxisDirection } from 'ag-charts-core';
import type { AgCartesianSeriesOptions } from 'ag-charts-types';

import { predictCartesianAxis, predictCartesianFinancialAxis, rectLabelObstacles } from './util';

const TIME_KEY = 'date';
const NON_TIME_KEY = 'category';

function lineSeries(xKey: string): AgCartesianSeriesOptions {
    return { type: 'line', xKey, yKey: 'value' };
}

function candlestickSeries(xKey: string): AgCartesianSeriesOptions {
    return { type: 'candlestick', xKey } as AgCartesianSeriesOptions;
}

describe('predictCartesianAxis time-axis prediction', () => {
    const cases: Array<[label: string, key: string, value: unknown, expected: string | undefined]> = [
        ['Date under a time key', TIME_KEY, new Date('2024-01-15'), CARTESIAN_AXIS_TYPE.TIME],
        ['number under a time key', TIME_KEY, 1_700_000_000_000, CARTESIAN_AXIS_TYPE.TIME],
        ['bigint under a time key', TIME_KEY, BigInt(1_700_000_000_000), CARTESIAN_AXIS_TYPE.TIME],
        ['strict ISO string under a time key', TIME_KEY, '2024-01-15T10:30:00Z', CARTESIAN_AXIS_TYPE.TIME],
        ['date-only ISO string under a time key', TIME_KEY, '2024-01-15', CARTESIAN_AXIS_TYPE.TIME],
        ['non-ISO string under a time key', TIME_KEY, 'Q1', CARTESIAN_AXIS_TYPE.CATEGORY],
        ['ISO string under a non-time key', NON_TIME_KEY, '2024-01-15', CARTESIAN_AXIS_TYPE.CATEGORY],
    ];

    it.each(cases)('predicts %s', (_label, key, value, expected) => {
        const result = predictCartesianAxis(ChartAxisDirection.X, { [key]: value }, lineSeries(key));
        expect(result?.type).toBe(expected);
    });
});

describe('predictCartesianFinancialAxis ordinal-time prediction', () => {
    const cases: Array<[label: string, key: string, value: unknown, expected: string | undefined]> = [
        ['Date under a time key', TIME_KEY, new Date('2024-01-15'), CARTESIAN_AXIS_TYPE.ORDINAL_TIME],
        ['number under a time key', TIME_KEY, 1_700_000_000_000, CARTESIAN_AXIS_TYPE.ORDINAL_TIME],
        ['bigint under a time key', TIME_KEY, BigInt(1_700_000_000_000), CARTESIAN_AXIS_TYPE.ORDINAL_TIME],
        ['strict ISO string under a time key', TIME_KEY, '2024-01-15T10:30:00Z', CARTESIAN_AXIS_TYPE.ORDINAL_TIME],
        ['date-only ISO string under a time key', TIME_KEY, '2024-01-15', CARTESIAN_AXIS_TYPE.ORDINAL_TIME],
        ['non-ISO string under a time key', TIME_KEY, 'Q1', CARTESIAN_AXIS_TYPE.CATEGORY],
        ['ISO string under a non-time key', NON_TIME_KEY, '2024-01-15', CARTESIAN_AXIS_TYPE.CATEGORY],
    ];

    it.each(cases)('predicts %s', (_label, key, value, expected) => {
        const result = predictCartesianFinancialAxis(ChartAxisDirection.X, { [key]: value }, candlestickSeries(key));
        expect(result?.type).toBe(expected);
    });
});

describe('rectLabelObstacles', () => {
    it('maps rect node data to seriesItem rect obstacles', () => {
        const result = rectLabelObstacles([
            { x: 0, y: 10, width: 20, height: 30 },
            { x: 50, y: 5, width: 15, height: 25 },
        ]);
        expect(result).toEqual([
            { kind: 'rect', box: { x: 0, y: 10, width: 20, height: 30 }, category: 'seriesItem' },
            { kind: 'rect', box: { x: 50, y: 5, width: 15, height: 25 }, category: 'seriesItem' },
        ]);
    });

    it('skips phantom nodes', () => {
        const result = rectLabelObstacles([
            { x: 0, y: 0, width: 10, height: 10, phantom: true },
            { x: 0, y: 0, width: 10, height: 10, phantom: false },
        ]);
        expect(result).toEqual([{ kind: 'rect', box: { x: 0, y: 0, width: 10, height: 10 }, category: 'seriesItem' }]);
    });

    it('skips zero-area rects', () => {
        const result = rectLabelObstacles([
            { x: 0, y: 0, width: 0, height: 10 },
            { x: 0, y: 0, width: 10, height: 0 },
            { x: 0, y: 0, width: 10, height: 10 },
        ]);
        expect(result).toEqual([{ kind: 'rect', box: { x: 0, y: 0, width: 10, height: 10 }, category: 'seriesItem' }]);
    });

    it('returns undefined when there is nothing to contribute', () => {
        expect(rectLabelObstacles(undefined)).toBeUndefined();
        expect(rectLabelObstacles([])).toBeUndefined();
        expect(rectLabelObstacles([{ x: 0, y: 0, width: 0, height: 0, phantom: true }])).toBeUndefined();
    });
});
