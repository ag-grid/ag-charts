import { describe, expect, test, it } from "@jest/globals";
import { toFixed, toReadableNumber } from "./number";

test('toFixed', () => {
    expect(toFixed(0.000347985)).toBe('0.00035');
    expect(toFixed(234.000347985)).toBe('234.00');
    expect(toFixed(234.2343)).toBe('234.23');
    expect(toFixed(234.2343, 3)).toBe('234.234');
    expect(toFixed(-0.0830894028175203)).toBe('-0.083');
    expect(toFixed(-0.0830894028175203, 4)).toBe('-0.08309');
    expect(toFixed(0)).toBe('0.00');
});

test('toReadableNumber', () => {
    expect(toReadableNumber(10550000000)).toBe('10.55B');
    expect(toReadableNumber(-10550000000, 1)).toBe('-10.6B');
});