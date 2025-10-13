import { countLines, joinFormatted, stringifyValue } from './strings';

describe('Strings Utilities', () => {
    describe('joinFormatted', () => {
        it('joins a single value without a conjunction', () => {
            const result = joinFormatted(['apple']);
            expect(result).toBe('apple');
        });

        it('joins two values with the default conjunction', () => {
            const result = joinFormatted(['apple', 'banana']);
            expect(result).toBe('apple and banana');
        });

        it('joins multiple values with the default conjunction', () => {
            const result = joinFormatted(['apple', 'banana', 'cherry']);
            expect(result).toBe('apple, banana and cherry');
        });

        it('joins multiple values with a custom conjunction', () => {
            const result = joinFormatted(['apple', 'banana', 'cherry'], 'or');
            expect(result).toBe('apple, banana or cherry');
        });

        it('applies a custom format function to values', () => {
            const result = joinFormatted(['apple', 'banana'], 'and', (value) => value.toUpperCase());
            expect(result).toBe('APPLE and BANANA');
        });

        it('limits the number of items displayed and adds a truncation message', () => {
            const result = joinFormatted(['apple', 'banana', 'cherry', 'date'], 'and', String, 3);
            expect(result).toBe('apple, banana, and 1 more and date');
        });
    });

    describe('stringifyValue', () => {
        it('stringifies undefined', () => {
            const result = stringifyValue(undefined);
            expect(result).toBe('undefined');
        });

        it('stringifies NaN', () => {
            const result = stringifyValue(Number.NaN);
            expect(result).toBe('NaN');
        });

        it('stringifies Infinity and -Infinity', () => {
            expect(stringifyValue(Infinity)).toBe('Infinity');
            expect(stringifyValue(-Infinity)).toBe('-Infinity');
        });

        it('handle stringification of symbols', () => {
            const result = stringifyValue(Symbol('test-symbol'));
            expect(result).toBe('symbol');
        });

        it('handle stringification of functions', () => {
            const result1 = stringifyValue(function named() {});
            const result2 = stringifyValue(() => false);
            expect(result1).toBe('function');
            expect(result2).toBe('function');
        });

        it('truncates long strings exceeding the maxLength', () => {
            const result = stringifyValue('abcdefghijklmnopqrstuvwxyz', 10);
            expect(result).toBe('"abcdefghi... (+18 characters)');
        });

        it('handles JSON stringification of objects', () => {
            const result = stringifyValue({ key: 'value' });
            expect(result).toBe('{"key":"value"}');
        });
    });

    describe('countLines', () => {
        it('counts lines in a single-line string', () => {
            const result = countLines('This is a single line.');
            expect(result).toBe(1);
        });

        it('counts lines in a multi-line string', () => {
            const result = countLines('Line one.\nLine two.\nLine three.');
            expect(result).toBe(3);
        });

        it('returns 1 for an empty string', () => {
            const result = countLines('');
            expect(result).toBe(1);
        });

        it('counts lines correctly for strings with consecutive newlines', () => {
            const result = countLines('Line one.\n\nLine three.');
            expect(result).toBe(3);
        });
    });
});
