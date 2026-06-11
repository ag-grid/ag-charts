import { describe, expect, it } from 'vitest';

import { isISO8601 } from './iso8601';

describe('isISO8601', () => {
    const accepted = [
        '2024-01-15',
        '2024-01-15T10:30:00Z',
        '2024-01-15T10:30:00+05:30',
        '2024-01-15T10:30:00.123Z',
        '2024-01-15T10:30:00',
        // Minute-precision (seconds optional)
        '2024-01-15T10:30Z',
        '2024-01-15T10:30',
        '2024-01-15T10:30+05:30',
        // Calendar validation operates on the wall-clock date, even when the offset shifts the UTC day.
        '2024-01-15T02:00:00+05:30',
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
        // Basic/short offsets are intentionally rejected; only colon offsets (+HH:MM) are accepted.
        '2024-01-15T10:30:00+0530',
        '2024-01-15T10:30+05',
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
});
