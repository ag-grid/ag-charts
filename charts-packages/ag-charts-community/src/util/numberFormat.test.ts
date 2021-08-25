import { describe, expect, test, it } from "@jest/globals";
import { format, formatDecimalParts, formatPrefix } from "./numberFormat";
import { LinearScale } from "../scale/linearScale";
import { NumericTicks } from "./ticks";

describe('formatDecimalParts', () => {
    test('1.23', () => {
        const v = formatDecimalParts(1.23);
        expect(v && v[0]).toBe('123');
        expect(v && v[1]).toBe(0);
    });
    test('1.23, 5', () => {
        const v = formatDecimalParts(1.23, 5);
        expect(v && v[0]).toBe('12300');
        expect(v && v[1]).toBe(0);
    });
    test('1.23, 2', () => {
        const v = formatDecimalParts(1.23, 2);
        expect(v && v[0]).toBe('12');
        expect(v && v[1]).toBe(0);
    });
});

describe('formatPrefix', () => {
    const f = formatPrefix(',.0', 1e-6);
    expect(f(0.00042)).toBe('420µ');
    expect(f(0.0042)).toBe('4,200µ');
});

describe('format', () => {
    test('fixed decimal', () => {
        const f = format('.1f');
        expect(f(0.1 + 0.2)).toBe('0.3');
    });
    test('fixed decimal', () => {
        const f = format('.1f');
        expect(f(0.1 + 0.2)).toBe('0.3');
    });
    test('rounded percentage', () => {
        const f = format('.0%');
        expect(f(0.3)).toBe('30%');
        expect(f(0.123)).toBe('12%');
        expect(f(40)).toBe('4000%');
    });
    test('localized fixed-point currency', () => {
        expect(format('$.2f')(3.5)).toBe('$3.50');
    });
    test('localized fixed-point currency', () => {
        expect(format('$.2f')(3.5)).toBe('$3.50');
    });
    test('space-filled and signed', () => {
        expect(format('+20')(42)).toBe('                 +42');
    });
    test('dot-filled and centered', () => {
        expect(format('.^20')(42)).toBe('.........42.........');
    });
    test('prefixed lowercase hexadecimal', () => {
        expect(format('#x')(48879)).toBe('0xbeef');
    });
    test('grouped thousands with two significant digits', () => {
        expect(format(',.2r')(4223)).toBe('4,200');
    });
    test('empty type is a shorthand for ~g', () => {
        expect(format('.2')(42)).toBe('42');
        expect(format('.2')(4.2)).toBe('4.2');
        expect(format('.1')(42)).toBe('4e+1');
        expect(format('.1')(4.2)).toBe('4');
    });
    test('SI-prefix', () => {
        const f = format('.3s');
        expect(f(43e6)).toBe('43.0M');

        expect(format('s')(1500)).toMatch('1.50000k');
        // using '-' will make the test fail because it has a different char code
        expect(format('s')(-1500)).toMatch('\u22121.50000k');
    });
    test('trim insignificant trailing zeros across format types', () => {
        expect(format('~s')(1500)).toBe('1.5k');
        expect(format('~s')(-1500)).toBe('\u22121.5k');
    });
    test('scale.tickFormat', () => {
        {
            const scale = new LinearScale();
            const f = scale.tickFormat(undefined, '~s');
            expect(f(43000000)).toBe('43000000');
        }
        {
            const scale = new LinearScale();
            scale.domain = [-50000000, 50000000];
            const f = scale.tickFormat(undefined, '~s');
            expect(f(43000000)).toBe('43M');
        }
        {
            const scale = new LinearScale();
            scale.domain = [-50000000, 50000000];
            const f = scale.tickFormat(undefined, '~s');
            expect(f(43500000)).toBe('44M');
        }
        {
            const scale = new LinearScale();
            scale.domain = [35000000, 44000000];
            const f = scale.tickFormat(undefined, '~s');
            const expectedTicks = ['35M', '36M', '37M', '38M', '39M', '40M', '41M', '42M', '43M', '44M'];
            scale.ticks().forEach((t, i) => expect(f(t)).toBe(expectedTicks[i]));
        }
    });
});