import { clamp, countFractionDigits, inRange, isInteger, isNegative, isNumberEqual, modulus, roundTo } from './numbers';

describe('Number Utilities', () => {
    test('clamp', () => {
        expect(clamp(0, 5, 10)).toBe(5);
        expect(clamp(0, 15, 10)).toBe(10);
        expect(clamp(0, -5, 10)).toBe(0);
        expect(clamp(-10, -5, -1)).toBe(-5);
    });

    test('inRange', () => {
        expect(inRange(5, [0, 10])).toBe(true);
        expect(inRange(0, [0, 10])).toBe(true);
        expect(inRange(10, [0, 10])).toBe(true);
        expect(inRange(15, [0, 10])).toBe(false);
        expect(inRange(5, [6, 10])).toBe(false);
        expect(inRange(5, [4.9, 5.1], 1e-10)).toBe(true);
    });

    test('isNumberEqual', () => {
        expect(isNumberEqual(5, 5)).toBe(true);
        expect(isNumberEqual(5, 5.00000000001, 1e-10)).toBe(true);
        expect(isNumberEqual(5, 5.0000000001, 1e-10)).toBe(false);
        expect(isNumberEqual(5, 6)).toBe(false);
    });

    test('isNegative', () => {
        expect(isNegative(-1)).toBe(true);
        expect(isNegative(0)).toBe(false);
        expect(isNegative(1)).toBe(false);
        expect(isNegative(-0)).toBe(true); // Negative zero check
    });

    test('isInteger', () => {
        expect(isInteger(5)).toBe(true);
        expect(isInteger(5)).toBe(true); // Integer value as a float
        expect(isInteger(5.1)).toBe(false);
        expect(isInteger(-5)).toBe(true);
        expect(isInteger(-5.1)).toBe(false);
    });

    test('roundTo', () => {
        expect(roundTo(5.1234, 2)).toBe(5.12);
        expect(roundTo(5.1267, 2)).toBe(5.13);
        expect(roundTo(5, 3)).toBe(5);
        expect(roundTo(5.1234, 0)).toBe(5);
    });

    test('modulus', () => {
        expect(modulus(-5, 3)).toBe(1);
        expect(modulus(5, 3)).toBe(2);
        expect(modulus(-7, 3)).toBe(2);
        expect(modulus(7, -3)).toBe(1);
        expect(modulus(-5, -3)).toBe(1);
    });

    test('countFractionDigits', () => {
        expect(countFractionDigits(0)).toBe(0);
        expect(countFractionDigits(0.5)).toBe(1);
        expect(countFractionDigits(0.25)).toBe(2);
        expect(countFractionDigits(1)).toBe(0);
        expect(countFractionDigits(1.5)).toBe(1);
        expect(countFractionDigits(1.25)).toBe(2);
        expect(countFractionDigits(400 - 0.6)).toBe(1); // AG-10143
        expect(countFractionDigits(1e-8)).toBe(8);
        expect(countFractionDigits(1.23e-8)).toBe(10);
    });
});
