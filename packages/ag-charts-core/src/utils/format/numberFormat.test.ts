import { describe, expect, test } from '@jest/globals';

import { createNumberFormatter } from './numberFormat';

describe('number format', () => {
    test('fixed point', () => {
        expect(createNumberFormatter('.1f')!(0.1 + 0.2)).toBe('0.3');
        expect(createNumberFormatter('.2f')!(0.337)).toBe('0.34');
        expect(createNumberFormatter('.3f')!(0.3337)).toBe('0.334');
        expect(createNumberFormatter('.4f')!(123)).toBe('123.0000');
        expect(createNumberFormatter('f')!(0.1234567890123456)).toBe('0.123457');
    });
    test('rounded percentage', () => {
        const f = createNumberFormatter('.0%')!;
        expect(f(0.3)).toBe('30%');
        expect(f(0.123)).toBe('12%');
        expect(f(40)).toBe('4000%');
    });
    test('fixed point percentage', () => {
        expect(createNumberFormatter('.2%')!(0.345)).toBe('34.50%');
    });
    test('percentage rounded to significant digits', () => {
        expect(createNumberFormatter('.2p')!(0.678)).toBe('68%');
    });
    test('embedded percent format via #{p}', () => {
        const withPrecision = createNumberFormatter('Growth #{.2p}')!;
        expect(withPrecision(0.678)).toBe('Growth 68%');

        const withoutPrecision = createNumberFormatter('Growth #{p}')!;
        expect(withoutPrecision(0.5)).toBe('Growth 50.0000%');
    });
    test('decimal rounded to integer', () => {
        expect(createNumberFormatter('d')!(67.7)).toBe('68');
    });
    test('localized fixed-point currency', () => {
        expect(createNumberFormatter('$.2f')!(3.5)).toBe('$3.50');
    });
    test('pound', () => {
        expect(createNumberFormatter('£,.2f')!(1000)).toBe('£1,000.00');
    });
    test('space-filled and signed', () => {
        expect(createNumberFormatter('+20')!(42)).toBe('                 +42');
        expect(createNumberFormatter('(')!(-42)).toBe('(42)');
        const spaceSign = createNumberFormatter(' 6d')!;
        expect(spaceSign(42)).toBe('    42');
        expect(spaceSign(-42)).toBe('   \u221242');
    });
    test('dot-filled and centered', () => {
        expect(createNumberFormatter('.^20')!(42)).toBe('.........42.........');
        expect(createNumberFormatter('.^21')!(42)).toBe('..........42.........');
    });
    test('prefixed lowercase hexadecimal', () => {
        const formatter = createNumberFormatter('#x')!;
        expect(formatter(48879)).toBe('0xbeef');
        expect(formatter(-48879)).toBe('\u22120xbeef');
    });
    test('grouped thousands with fixed point', () => {
        expect(createNumberFormatter(',.5f')!(123456789.9876543)).toBe('123,456,789.98765');
    });
    test('alternate form prefixes for binary, octal, and hexadecimal', () => {
        const binary = createNumberFormatter('#b')!;
        expect(binary(10)).toBe('0b1010');
        expect(binary(-10)).toBe('\u22120b1010');

        const octal = createNumberFormatter('#o')!;
        expect(octal(10)).toBe('0o12');
        expect(octal(-10)).toBe('\u22120o12');

        expect(createNumberFormatter('#X')!(48879)).toBe('0XBEEF');
        expect(createNumberFormatter('#08x')!(48879)).toBe('0x00beef');
    });
    test('remove trailing zeros', () => {
        expect(createNumberFormatter('.3~f')!(-0.87)).toBe('−0.87');
    });
    test('number of significant digits', () => {
        const f = createNumberFormatter(',.3r')!;
        expect(f(0.077)).toBe('0.0770');
        expect(f(0.07777)).toBe('0.0778');
        expect(f(0.77777)).toBe('0.778');
        expect(f(7.7777)).toBe('7.78');
        expect(f(77.777)).toBe('77.8');
        expect(f(777.77)).toBe('778');
        expect(f(7777.7)).toBe('7,780');
        expect(f(77777)).toBe('77,800');
    });
    test('grouped thousands', () => {
        const f = createNumberFormatter(',d')!;
        expect(f(1)).toBe('1');
        expect(f(12)).toBe('12');
        expect(f(123)).toBe('123');
        expect(f(1234)).toBe('1,234');
        expect(f(12345)).toBe('12,345');
        expect(f(123456)).toBe('123,456');
        expect(f(1234567)).toBe('1,234,567');
        expect(f(12345678)).toBe('12,345,678');
        expect(f(-1)).toBe('\u22121');
        expect(f(-12)).toBe('\u221212');
        expect(f(-123)).toBe('\u2212123');
        expect(f(-1234)).toBe('\u22121,234');
        expect(f(-12345)).toBe('\u221212,345');
        expect(f(-123456)).toBe('\u2212123,456');
        expect(f(-1234567)).toBe('\u22121,234,567');
        expect(f(-12345678)).toBe('\u221212,345,678');
    });
    test('grouped thousands and parenthesis for negative values', () => {
        const f = createNumberFormatter('(,d')!;
        expect(f(1)).toBe('1');
        expect(f(12)).toBe('12');
        expect(f(123)).toBe('123');
        expect(f(1234)).toBe('1,234');
        expect(f(12345)).toBe('12,345');
        expect(f(123456)).toBe('123,456');
        expect(f(1234567)).toBe('1,234,567');
        expect(f(12345678)).toBe('12,345,678');
        expect(f(-1)).toBe('(1)');
        expect(f(-12)).toBe('(12)');
        expect(f(-123)).toBe('(123)');
        expect(f(-1234)).toBe('(1,234)');
        expect(f(-12345)).toBe('(12,345)');
        expect(f(-123456)).toBe('(123,456)');
        expect(f(-1234567)).toBe('(1,234,567)');
        expect(f(-12345678)).toBe('(12,345,678)');
    });
    test('grouped thousands with two significant digits', () => {
        expect(createNumberFormatter(',.2r')!(4223)).toBe('4,200');
    });
    test('zero flag keeps sign before padding', () => {
        const f = createNumberFormatter('05d')!;
        expect(f(42)).toBe('00042');
        expect(f(-42)).toBe('\u22120042');
    });
    test('explicit = alignment with custom fill', () => {
        const f = createNumberFormatter('0=6d')!;
        expect(f(-42)).toBe('\u221200042');
    });
    test('currency with = alignment keeps sign and symbol before padding', () => {
        const f = createNumberFormatter('0=$6d')!;
        expect(f(-42)).toBe('\u2212$0042');
    });
    test('parentheses honour zero flag padding', () => {
        const f = createNumberFormatter('($07d')!;
        expect(f(-42)).toBe('($0042)');
    });
    test('space fill with = alignment', () => {
        const f = createNumberFormatter(' =8d')!;
        expect(f(-42)).toBe('\u2212     42');
    });
    test('general format', () => {
        expect(createNumberFormatter('.1g')!(0.049)).toBe('0.05');
        expect(createNumberFormatter('.1g')!(0.49)).toBe('0.5');
        expect(createNumberFormatter('.2g')!(0.449)).toBe('0.45');
        expect(createNumberFormatter('.3g')!(0.4449)).toBe('0.445');
        expect(createNumberFormatter('.5g')!(0.444449)).toBe('0.44445');
        expect(createNumberFormatter('.1g')!(100)).toBe('1e+2');
        expect(createNumberFormatter('.2g')!(100)).toBe('1.0e+2');
        expect(createNumberFormatter('.3g')!(100)).toBe('100');
        expect(createNumberFormatter('.5g')!(100)).toBe('100.00');
        expect(createNumberFormatter('.5g')!(100.2)).toBe('100.20');
        expect(createNumberFormatter('.2g')!(0.002)).toBe('0.0020');
    });
    test('empty type is a shorthand for ~g', () => {
        expect(createNumberFormatter('.2')!(42)).toBe('42');
        expect(createNumberFormatter('.2')!(4.2)).toBe('4.2');
        expect(createNumberFormatter('.1')!(42)).toBe('4e+1');
        expect(createNumberFormatter('.1')!(4.2)).toBe('4');
    });
    test('SI-prefix', () => {
        const f = createNumberFormatter('.3s')!;
        expect(f(43e6)).toBe('43.0M');
        expect(createNumberFormatter('s')!(1500)).toMatch('1.50000k');
        // using '-' will make the test fail because it has a different char code
        expect(createNumberFormatter('s')!(-1500)).toMatch('\u22121.50000k');
        expect(createNumberFormatter('.5s')!(12345678)).toBe('12.346M');
        expect(createNumberFormatter('.5s')!(0.0123)).toBe('12.300m');
        expect(createNumberFormatter('.5s')!(0.01234567)).toBe('12.346m');
        expect(createNumberFormatter('.2s')!(0.0034)).toBe('3.4m');
    });
    test('trim insignificant trailing zeros across format types', () => {
        expect(createNumberFormatter('~s')!(1500)).toBe('1.5k');
        expect(createNumberFormatter('~s')!(-1500)).toBe('\u22121.5k');
    });
    test('currency with SI prefix and trim', () => {
        const f = createNumberFormatter('$~s')!;
        expect(f(0)).toBe('$0');
        expect(f(100)).toBe('$100');
        expect(f(150)).toBe('$150');
        expect(f(200)).toBe('$200');
        expect(f(1500)).toBe('$1.5k');
        expect(f(15000)).toBe('$15k');
        expect(f(150000)).toBe('$150k');
        expect(f(1500000)).toBe('$1.5M');
    });
    test('fractionDigits should not override format precision for SI type', () => {
        const f = createNumberFormatter('$~s')!;
        // When fractionDigits is 0 (from axis), it should not override the format's precision
        expect(f(0, 0)).toBe('$0');
        expect(f(100, 0)).toBe('$100');
        expect(f(150, 0)).toBe('$150');
        expect(f(200, 0)).toBe('$200');
        expect(f(1500, 0)).toBe('$1.5k');
        expect(f(15000, 0)).toBe('$15k');
    });
    test('fractionDigits should not override format precision for ~s type', () => {
        const f = createNumberFormatter('~s')!;
        expect(f(0, 0)).toBe('0');
        expect(f(100, 0)).toBe('100');
        expect(f(150, 0)).toBe('150');
        expect(f(200, 0)).toBe('200');
        expect(f(1500, 0)).toBe('1.5k');
    });
    test('explicit precision in format string always takes precedence', () => {
        const f = createNumberFormatter('.3s')!;
        expect(f(1500, 0)).toBe('1.50k');
        expect(f(1500, 5)).toBe('1.50k'); // fractionDigits ignored when precision is explicit
    });
    test('no type specified', () => {
        expect(createNumberFormatter('')!(0.1234567890123456)).toBe('0.123456789012');
    });
    test('padding with prefix and suffix', () => {
        expect(createNumberFormatter('🌧️ #{0>2.0f} °C')!(4)).toBe('🌧️ 04 °C');
        expect(createNumberFormatter('🌧️ #{0>2.0f} °C')!(12)).toBe('🌧️ 12 °C');
        expect(createNumberFormatter('#thisIsIgnored #{0>2.0f} #thisIsAlsoIgnored')!(12)).toBe(
            '#thisIsIgnored 12 #thisIsAlsoIgnored'
        );
    });
});
