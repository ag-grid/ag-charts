import { expect, test } from '@jest/globals';

import { isFiniteNumber as isNumber } from './type-guards';
import { isContinuous, isStringObject } from './value';

describe('value module', () => {
    test('isNumber', () => {
        expect(isNumber(1)).toBe(true);
        expect(isNumber(0)).toBe(true);
        expect(isNumber(-1)).toBe(true);
        expect(isNumber(Number(1))).toBe(true);
        expect(isNumber(Number('wow'))).toBe(false);
        expect(isNumber(Infinity)).toBe(false);
        expect(isNumber(-Infinity)).toBe(false);
        expect(isNumber(NaN)).toBe(false);
        expect(isNumber(null)).toBe(false);
        expect(isNumber(undefined)).toBe(false);
        expect(isNumber('1')).toBe(false);
        expect(isNumber({})).toBe(false);
        expect(isNumber([])).toBe(false);
        expect(isNumber('')).toBe(false);
        expect(
            isNumber({
                valueOf: () => 0,
            })
        ).toBe(false);
    });

    test('isContinuous', () => {
        expect(isContinuous(1)).toBe(true);
        expect(isContinuous(0)).toBe(true);
        expect(isContinuous(-1)).toBe(true);
        expect(isContinuous(new Date())).toBe(true);
        expect(isContinuous(+new Date())).toBe(true);
        expect(
            isContinuous({
                valueOf: () => 5,
            })
        ).toBe(true);
        expect(
            isContinuous({
                valueOf: () => '',
            })
        ).toBe(false);
        expect(isContinuous(NaN)).toBe(false);
        expect(isContinuous(null)).toBe(false);
        expect(isContinuous(undefined)).toBe(false);
        expect(isContinuous('')).toBe(false);
        expect(isContinuous([])).toBe(false);
        expect(isContinuous({})).toBe(false);
        expect(isContinuous(Symbol.iterator)).toBe(false);
        expect(isContinuous(Infinity)).toBe(false);
        expect(isContinuous(-Infinity)).toBe(false);
    });

    test('isStringObject', () => {
        expect(isStringObject({})).toBe(false);
        expect(isStringObject([])).toBe(false);
        expect(isStringObject(false)).toBe(false);
        expect(isStringObject(true)).toBe(false);
        expect(isStringObject(0)).toBe(false);
        expect(isStringObject(1)).toBe(false);
        expect(isStringObject(-1)).toBe(false);
        expect(isStringObject(null)).toBe(false);
        expect(isStringObject(NaN)).toBe(false);
        expect(isStringObject(undefined)).toBe(false);
        expect(isStringObject(Symbol.iterator)).toBe(false);
        expect(isStringObject(Number(5))).toBe(false);
        expect(isStringObject(String('hello'))).toBe(false);
        expect(isStringObject('hello')).toBe(false);
        expect(
            isStringObject({
                toString: () => 5,
            })
        ).toBe(false);
        expect(
            isStringObject({
                toString: () => [],
            })
        ).toBe(false);
        expect(
            isStringObject({
                toString: () => false,
            })
        ).toBe(false);
        expect(
            isStringObject({
                toString: () => true,
            })
        ).toBe(false);
        expect(
            isStringObject({
                toString: () => ({}),
            })
        ).toBe(false);
        expect(
            isStringObject({
                toString: () => undefined,
            })
        ).toBe(false);
        expect(
            isStringObject({
                toString: () => 'hello',
            })
        ).toBe(true);
        expect(
            isStringObject({
                toString: () => String('hello'),
            })
        ).toBe(true);
    });
});
