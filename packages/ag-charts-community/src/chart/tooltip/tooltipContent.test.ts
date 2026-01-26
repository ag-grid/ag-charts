import { describe, expect, it } from '@jest/globals';

import { isTooltipValueMissing } from './tooltipContent';

describe('tooltipContent', () => {
    describe('isTooltipValueMissing', () => {
        it('should return true for null by default', () => {
            expect(isTooltipValueMissing(null)).toBe(true);
        });

        it('should return true for undefined by default', () => {
            expect(isTooltipValueMissing(undefined)).toBe(true);
        });

        it('should return false for null when allowNull is true', () => {
            expect(isTooltipValueMissing(null, true)).toBe(false);
        });

        it('should return false for undefined when allowNull is true', () => {
            expect(isTooltipValueMissing(undefined, true)).toBe(false);
        });

        it('should return true for null when allowNull is false', () => {
            expect(isTooltipValueMissing(null, false)).toBe(true);
        });

        it('should return true for NaN regardless of allowNull', () => {
            expect(isTooltipValueMissing(Number.NaN)).toBe(true);
            expect(isTooltipValueMissing(Number.NaN, true)).toBe(true);
            expect(isTooltipValueMissing(Number.NaN, false)).toBe(true);
        });

        it('should return true for Infinity regardless of allowNull', () => {
            expect(isTooltipValueMissing(Infinity)).toBe(true);
            expect(isTooltipValueMissing(Infinity, true)).toBe(true);
            expect(isTooltipValueMissing(-Infinity, true)).toBe(true);
        });

        it('should return false for valid string values', () => {
            expect(isTooltipValueMissing('test')).toBe(false);
            expect(isTooltipValueMissing('')).toBe(false);
        });

        it('should return false for valid number values', () => {
            expect(isTooltipValueMissing(0)).toBe(false);
            expect(isTooltipValueMissing(42)).toBe(false);
            expect(isTooltipValueMissing(-1)).toBe(false);
        });

        it('should return false for Date values', () => {
            expect(isTooltipValueMissing(new Date())).toBe(false);
        });

        it('should return false for objects and arrays', () => {
            expect(isTooltipValueMissing({})).toBe(false);
            expect(isTooltipValueMissing([])).toBe(false);
        });
    });
});
