import { describe, expect, test } from '@jest/globals';

import { numberFormat } from './numberFormat';

describe('number format', () => {
    test('fixed point', () => {
        expect(numberFormat('.1f')(0.1 + 0.2)).toBe('0.3');
        expect(numberFormat('.2f')(0.337)).toBe('0.34');
        expect(numberFormat('.3f')(0.3337)).toBe('0.334');
        expect(numberFormat('.4f')(123)).toBe('123.0000');
        expect(numberFormat('f')(0.1234567890123456)).toBe('0.123457');
    });
    test('rounded percentage', () => {
        const f = numberFormat('.0%');
        expect(f(0.3)).toBe('30%');
        expect(f(0.123)).toBe('12%');
        expect(f(40)).toBe('4000%');
    });
    test('fixed point percentage', () => {
        expect(numberFormat('.2%')(0.345)).toBe('34.50%');
    });
    test('percentage rounded to significant digits', () => {
        expect(numberFormat('.2p')(0.678)).toBe('68%');
    });
    test('decimal rounded to integer', () => {
        expect(numberFormat('d')(67.7)).toBe('68');
    });
    test('localized fixed-point currency', () => {
        expect(numberFormat('$.2f')(3.5)).toBe('$3.50');
    });
    test('pound', () => {
        expect(numberFormat('£,.2f')(1000)).toBe('£1,000.00');
    });
    test('space-filled and signed', () => {
        expect(numberFormat('+20')(42)).toBe('                 +42');
        expect(numberFormat('(')(-42)).toBe('(42)');
    });
    test('dot-filled and centered', () => {
        expect(numberFormat('.^20')(42)).toBe('.........42.........');
        expect(numberFormat('.^21')(42)).toBe('..........42.........');
    });
    test('prefixed lowercase hexadecimal', () => {
        expect(numberFormat('#x')(48879)).toBe('0xbeef');
    });
    test('grouped thousands with fixed point', () => {
        expect(numberFormat(',.5f')(123456789.9876543)).toBe('123,456,789.98765');
    });
    test('number of significant digits', () => {
        expect(numberFormat(',.3r')(0.077)).toBe('0.0770');
        expect(numberFormat(',.3r')(0.07777)).toBe('0.0778');
        expect(numberFormat(',.3r')(0.77777)).toBe('0.778');
        expect(numberFormat(',.3r')(7.7777)).toBe('7.78');
        expect(numberFormat(',.3r')(77.777)).toBe('77.8');
        expect(numberFormat(',.3r')(777.77)).toBe('778');
        expect(numberFormat(',.3r')(7777.7)).toBe('7,780');
        expect(numberFormat(',.3r')(77777)).toBe('77,800');
    });
    test('grouped thousands', () => {
        expect(numberFormat(',d')(1)).toBe('1');
        expect(numberFormat(',d')(12)).toBe('12');
        expect(numberFormat(',d')(123)).toBe('123');
        expect(numberFormat(',d')(1234)).toBe('1,234');
        expect(numberFormat(',d')(12345)).toBe('12,345');
        expect(numberFormat(',d')(123456)).toBe('123,456');
        expect(numberFormat(',d')(1234567)).toBe('1,234,567');
        expect(numberFormat(',d')(12345678)).toBe('12,345,678');
        expect(numberFormat(',d')(-1)).toBe('\u22121');
        expect(numberFormat(',d')(-12)).toBe('\u221212');
        expect(numberFormat(',d')(-123)).toBe('\u2212123');
        expect(numberFormat(',d')(-1234)).toBe('\u22121,234');
        expect(numberFormat(',d')(-12345)).toBe('\u221212,345');
        expect(numberFormat(',d')(-123456)).toBe('\u2212123,456');
        expect(numberFormat(',d')(-1234567)).toBe('\u22121,234,567');
        expect(numberFormat(',d')(-12345678)).toBe('\u221212,345,678');
    });
    test('grouped thousands and parenthesis for negative values', () => {
        expect(numberFormat('(,d')(1)).toBe('1');
        expect(numberFormat('(,d')(12)).toBe('12');
        expect(numberFormat('(,d')(123)).toBe('123');
        expect(numberFormat('(,d')(1234)).toBe('1,234');
        expect(numberFormat('(,d')(12345)).toBe('12,345');
        expect(numberFormat('(,d')(123456)).toBe('123,456');
        expect(numberFormat('(,d')(1234567)).toBe('1,234,567');
        expect(numberFormat('(,d')(12345678)).toBe('12,345,678');
        expect(numberFormat('(,d')(-1)).toBe('(1)');
        expect(numberFormat('(,d')(-12)).toBe('(12)');
        expect(numberFormat('(,d')(-123)).toBe('(123)');
        expect(numberFormat('(,d')(-1234)).toBe('(1,234)');
        expect(numberFormat('(,d')(-12345)).toBe('(12,345)');
        expect(numberFormat('(,d')(-123456)).toBe('(123,456)');
        expect(numberFormat('(,d')(-1234567)).toBe('(1,234,567)');
        expect(numberFormat('(,d')(-12345678)).toBe('(12,345,678)');
    });
    test('grouped thousands with two significant digits', () => {
        expect(numberFormat(',.2r')(4223)).toBe('4,200');
    });
    test('general format', () => {
        expect(numberFormat('.1g')(0.049)).toBe('0.05');
        expect(numberFormat('.1g')(0.49)).toBe('0.5');
        expect(numberFormat('.2g')(0.449)).toBe('0.45');
        expect(numberFormat('.3g')(0.4449)).toBe('0.445');
        expect(numberFormat('.5g')(0.444449)).toBe('0.44445');
        expect(numberFormat('.1g')(100)).toBe('1e+2');
        expect(numberFormat('.2g')(100)).toBe('1.0e+2');
        expect(numberFormat('.3g')(100)).toBe('100');
        expect(numberFormat('.5g')(100)).toBe('100.00');
        expect(numberFormat('.5g')(100.2)).toBe('100.20');
        expect(numberFormat('.2g')(0.002)).toBe('0.0020');
    });
    test('empty type is a shorthand for ~g', () => {
        expect(numberFormat('.2')(42)).toBe('42');
        expect(numberFormat('.2')(4.2)).toBe('4.2');
        expect(numberFormat('.1')(42)).toBe('4e+1');
        expect(numberFormat('.1')(4.2)).toBe('4');
    });
    test('SI-prefix', () => {
        const f = numberFormat('.3s');
        expect(f(43e6)).toBe('43.0M');
        expect(numberFormat('s')(1500)).toMatch('1.50000k');
        // using '-' will make the test fail because it has a different char code
        expect(numberFormat('s')(-1500)).toMatch('\u22121.50000k');
        expect(numberFormat('.5s')(12345678)).toBe('12.346M');
        expect(numberFormat('.5s')(0.0123)).toBe('12.300m');
        expect(numberFormat('.5s')(0.01234567)).toBe('12.346m');
        expect(numberFormat('.2s')(0.0034)).toBe('3.4m');
    });
    test('trim insignificant trailing zeros across format types', () => {
        expect(numberFormat('~s')(1500)).toBe('1.5k');
        expect(numberFormat('~s')(-1500)).toBe('\u22121.5k');
    });
    test('no type specified', () => {
        expect(numberFormat(' ')(0.1234567890123456)).toBe('0.123456789012');
    });
    test('padding with prefix and suffix', () => {
        expect(numberFormat('🌧️ #{0>2.0f} °C')(4)).toBe('🌧️ 04 °C');
        expect(numberFormat('🌧️ #{0>2.0f} °C')(12)).toBe('🌧️ 12 °C');
        expect(numberFormat('#thisIsIgnored #{0>2.0f} #thisIsAlsoIgnored')(12)).toBe(
            '#thisIsIgnored 12 #thisIsAlsoIgnored'
        );
    });
});
