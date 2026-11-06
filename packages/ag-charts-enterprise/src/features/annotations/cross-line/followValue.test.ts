import { describe, expect, it } from 'vitest';

import { ChartAxisDirection } from 'ag-charts-core';

import { type FollowableSeries, findFollowedSeries, normaliseFollow, readFollowedValue } from './followValue';

function createSeries(
    id: string,
    rows: Array<Record<string, unknown>>,
    { visible = true, keys = ['yKey'] }: { visible?: boolean; keys?: string[] } = {}
): FollowableSeries {
    return {
        id,
        visible,
        data: { size: () => rows.length, getDatumAt: (index) => rows[index] },
        getKeys: (direction) => (direction === ChartAxisDirection.Y ? keys : ['xKey']),
    };
}

describe('followValue', () => {
    describe('normaliseFollow', () => {
        it.each([
            ['first', { follow: 'first' }],
            ['last', { follow: 'last' }],
            [
                { follow: 'last', seriesId: 'a' },
                { follow: 'last', seriesId: 'a' },
            ],
            [{ follow: 'first' }, { follow: 'first', seriesId: undefined }],
        ] as const)('reads %j', (input, expected) => {
            expect(normaliseFollow(input)).toEqual(expected);
        });

        it.each([undefined, 'average', { follow: 'average' }, { seriesId: 'a' }] as const)('rejects %j', (input) => {
            expect(normaliseFollow(input as any)).toBeUndefined();
        });
    });

    describe('readFollowedValue', () => {
        const rows = [{ yKey: 3 }, { yKey: 7 }, { yKey: 5 }];

        it('reads the first and last datum', () => {
            const series = createSeries('a', rows);
            expect(readFollowedValue(series, 'first')).toBe(3);
            expect(readFollowedValue(series, 'last')).toBe(5);
        });

        it('reads the last y key, which is the close of a financial series', () => {
            const series = createSeries('a', [{ low: 1, high: 9, open: 2, close: 4 }], {
                keys: ['low', 'high', 'open', 'close'],
            });
            expect(readFollowedValue(series, 'last')).toBe(4);
        });

        it('reads a nested key', () => {
            const series = createSeries('a', [{ price: { close: 12 } }], { keys: ['price.close'] });
            expect(readFollowedValue(series, 'last')).toBe(12);
        });

        it('keeps a date value', () => {
            const date = new Date('2026-01-01');
            expect(readFollowedValue(createSeries('a', [{ yKey: date }]), 'last')).toBe(date);
        });

        it('falls back to the nearest datum that has a value', () => {
            const series = createSeries('a', [{ yKey: undefined }, { yKey: 3 }, { yKey: 7 }, { yKey: null }, {}]);
            expect(readFollowedValue(series, 'last')).toBe(7);
            expect(readFollowedValue(series, 'first')).toBe(3);
        });

        it('has no value when every datum is empty', () => {
            const series = createSeries('a', [{ yKey: null }, {}, { yKey: undefined }]);
            expect(readFollowedValue(series, 'last')).toBeUndefined();
            expect(readFollowedValue(series, 'first')).toBeUndefined();
        });

        it.each([0, 'text', Number.NaN, Infinity])('uses the value %j as it is', (yKey) => {
            expect(readFollowedValue(createSeries('a', [{ yKey: 1 }, { yKey }]), 'last')).toBe(yKey);
        });

        it('has no value without data or a y key', () => {
            expect(readFollowedValue(createSeries('a', []), 'last')).toBeUndefined();
            expect(readFollowedValue(createSeries('a', rows, { keys: [] }), 'last')).toBeUndefined();
            expect(readFollowedValue({ id: 'a', visible: true, getKeys: () => ['yKey'] }, 'last')).toBeUndefined();
        });

        it('follows an appended datum', () => {
            const data = [{ yKey: 1 }];
            const series = createSeries('a', data);
            expect(readFollowedValue(series, 'last')).toBe(1);

            data.push({ yKey: 2 });
            expect(readFollowedValue(series, 'last')).toBe(2);
        });
    });

    describe('findFollowedSeries', () => {
        const a = createSeries('a', [{ yKey: 1 }]);
        const b = createSeries('b', [{ yKey: 2 }]);
        const hidden = createSeries('hidden', [{ yKey: 3 }], { visible: false });
        const empty = createSeries('empty', []);
        const series = [a, b, hidden, empty];

        it('takes the first visible series with data bound to the axis, in axis order', () => {
            expect(findFollowedSeries({ follow: 'last' }, series, ['empty', 'hidden', 'b', 'a'])).toBe(b);
        });

        it('ignores series that are not bound to the axis', () => {
            expect(findFollowedSeries({ follow: 'last' }, series, ['b'])).toBe(b);
            expect(findFollowedSeries({ follow: 'last' }, series, [])).toBeUndefined();
        });

        it('takes the series named by seriesId, even if it is not first', () => {
            expect(findFollowedSeries({ follow: 'last', seriesId: 'b' }, series, ['a', 'b'])).toBe(b);
        });

        it('follows a series named by seriesId while it is hidden', () => {
            expect(findFollowedSeries({ follow: 'last', seriesId: 'hidden' }, series, ['a', 'hidden'])).toBe(hidden);
        });

        it('has no series for a seriesId that is not bound to the axis', () => {
            expect(findFollowedSeries({ follow: 'last', seriesId: 'b' }, series, ['a'])).toBeUndefined();
        });

        it('has no series for an unknown seriesId', () => {
            expect(findFollowedSeries({ follow: 'last', seriesId: 'missing' }, series, ['a'])).toBeUndefined();
        });
    });
});
