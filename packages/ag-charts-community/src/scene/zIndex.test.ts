import { compareZIndex } from './zIndex';

describe('zIndex', () => {
    describe('compareZIndex', () => {
        test('numbers', () => {
            expect(compareZIndex(0, 0)).toBe(0);
            expect(compareZIndex(0, 1)).toBe(-1);
            expect(compareZIndex(1, 0)).toBe(1);
            expect(compareZIndex(1, 1)).toBe(0);
        });

        test('arrays', () => {
            expect(compareZIndex([1, 2, 3], [1, 2, 3])).toBe(0);
            expect(compareZIndex([1, 2, 3], [1, 2, 4])).toBe(-1);
            expect(compareZIndex([1, 2, 3], [1, 2, 2])).toBe(1);

            expect(compareZIndex([1, 2, 3], [1, 2])).toBe(1);
            expect(compareZIndex([1, 2, 3], [1, 2, 3, 4])).toBe(-1);
        });
    });
});
