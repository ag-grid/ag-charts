import { describe, expect, it } from 'vitest';

import type { AgNumericValue } from 'ag-charts-types';

import { getLabelText } from './label';

describe('gauge getLabelText', () => {
    const ctx = { chartService: {} };

    // The count-up animation override is Number-narrowed, but the user formatter must still receive
    // the raw bigint so callbacks preserve the value type.
    it('passes the raw bigint to the formatter even when the animation override narrows it', () => {
        const value = 9_007_199_254_740_993n; // Number.MAX_SAFE_INTEGER + 2
        let received: AgNumericValue | undefined;
        const datum = {
            value,
            formatter: (params: any) => {
                received = params.value;
                return String(params.value);
            },
        };

        const text = getLabelText('gauge-id', ctx, datum, Number(value));

        expect(typeof received).toBe('bigint');
        expect(received).toBe(value);
        expect(text).toBe('9007199254740993');
    });

    it('uses the Number animation override for a non-bigint value so the count-up still animates', () => {
        let received: AgNumericValue | undefined;
        const datum = {
            value: 100,
            formatter: (params: any) => {
                received = params.value;
                return String(params.value);
            },
        };

        getLabelText('gauge-id', ctx, datum, 42);

        expect(received).toBe(42);
    });
});
