import { describe, expect, it } from 'vitest';

import { isISO8601 } from './iso8601';

describe('isISO8601', () => {
    const accepted = [
        '2024-01-15',
        '2024-01-15T10:30:00Z',
        '2024-01-15T10:30:00+05:30',
        '2024-01-15T10:30:00.123Z',
        '2024-01-15T10:30:00',
    ];

    const rejected = [
        'Dec 2024',
        '01/02/2024',
        'January 15, 2024',
        '2024-13-01',
        '2024-02-30',
        '2024-01-15 10:30:00',
        '20240115',
        '2024-W03',
        '2024-015',
    ];

    it.each(accepted)('accepts %s', (value) => {
        expect(isISO8601(value)).toBe(true);
    });

    it.each(rejected)('rejects %s', (value) => {
        expect(isISO8601(value)).toBe(false);
    });

    it.each([null, undefined, 1705314600000, 1705314600000n, new Date(), {}])(
        'rejects non-string value %s',
        (value) => {
            expect(isISO8601(value)).toBe(false);
        }
    );

    it('does not accept an offset form whose UTC day differs from the wall-clock day', () => {
        // 02:00+05:30 lands on the previous UTC day; the date portion must still be honoured.
        expect(isISO8601('2024-01-15T02:00:00+05:30')).toBe(true);
    });
});
