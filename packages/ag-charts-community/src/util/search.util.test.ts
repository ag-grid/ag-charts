import { findMaxValue } from './search.util';

describe('findMaxValue', () => {
    it('finds the minimum value', () => {
        expect(findMaxValue(0, 10, (x) => (x === 0 ? x : undefined))).toBe(0);
    });

    it('finds the maximum value', () => {
        expect(findMaxValue(0, 10, (x) => x)).toBe(10);
    });

    it('finds a middle value', () => {
        expect(findMaxValue(0, 10, (x) => (x <= 7 ? x : undefined))).toBe(7);
        expect(findMaxValue(0, 10, (x) => (x <= 2 ? x : undefined))).toBe(2);
    });
});
