import { describe, expect, it } from 'vitest';

import { fmtCurrencyMillions, wholeMillionStep } from './format';

describe('wholeMillionStep', () => {
    it('picks the smallest 1-2-5 step that spans the maximum in at most five intervals', () => {
        expect(wholeMillionStep(4_000_000)).toBe(1_000_000);
        expect(wholeMillionStep(5_000_000)).toBe(1_000_000);
        expect(wholeMillionStep(5_000_001)).toBe(2_000_000);
        expect(wholeMillionStep(24_000_000)).toBe(5_000_000);
        expect(wholeMillionStep(26_000_000)).toBe(10_000_000);
    });

    it('never steps below a million, whatever the maximum', () => {
        expect(wholeMillionStep(250_000)).toBe(1_000_000);
        expect(wholeMillionStep(0)).toBe(1_000_000);
        expect(wholeMillionStep(Number.NaN)).toBe(1_000_000);
    });

    it('labels every tick it steps through differently', () => {
        const max = 37_000_000;
        const step = wholeMillionStep(max);
        const labels = Array.from({ length: Math.ceil(max / step) + 1 }, (_, index) =>
            fmtCurrencyMillions(index * step)
        );
        expect(new Set(labels).size).toBe(labels.length);
    });
});

describe('fmtCurrencyMillions', () => {
    it('reads zero as $0 and everything else in whole millions', () => {
        expect(fmtCurrencyMillions(0)).toBe('$0');
        expect(fmtCurrencyMillions(20_000_000)).toBe('$20M');
        expect(fmtCurrencyMillions(2_600_000)).toBe('$3M');
    });
});
