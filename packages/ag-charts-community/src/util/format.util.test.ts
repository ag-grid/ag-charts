import { expect, test } from '@jest/globals';

import { formatNumber, formatPercent, formatValue } from './format.util';

describe('Format utils', () => {
    test('formatNumber', () => {
        expect(formatNumber(0.000347985, 2)).toBe('0.00035');
        expect(formatNumber(234.000347985, 2)).toBe('234.00');
        expect(formatNumber(234.2343, 2)).toBe('234.23');
        expect(formatNumber(234.2343, 3)).toBe('234.234');
        expect(formatNumber(-0.0830894028175203, 2)).toBe('-0.083');
        expect(formatNumber(-0.0830894028175203, 4)).toBe('-0.08309');
        expect(formatNumber(0, 2)).toBe('0.00');
    });

    test('formatValue', () => {
        expect(formatValue(123.456)).toBe('123.46');
        expect(formatValue(0.0000345)).toBe('0.00003');
        expect(formatValue('test')).toBe('test');
        expect(formatValue(undefined)).toBe('');
        expect(formatValue(null)).toBe('');
        expect(formatValue(true)).toBe('true');
    });

    test('formatPercent', () => {
        expect(formatPercent(0.25)).toBe('25%');
        expect(formatPercent(1)).toBe('100%');
        expect(formatPercent(0)).toBe('0%');
        expect(formatPercent(0.345)).toBe('35%');
        expect(formatPercent(-0.5)).toBe('-50%');
    });
});
