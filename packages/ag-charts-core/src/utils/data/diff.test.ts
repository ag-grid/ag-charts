import { diffArrays } from './diff';

describe('Diff Utilities', () => {
    describe('diffArrays', () => {
        it('identifies no changes when arrays are identical', () => {
            const previous = [1, 2, 3];
            const current = [1, 2, 3];
            const result = diffArrays(previous, current);

            expect(result.changed).toBe(false);
            expect(result.added.size).toBe(0);
            expect(result.removed.size).toBe(0);
        });

        it('identifies added elements', () => {
            const previous = [1, 2, 3];
            const current = [1, 2, 3, 4, 5];
            const result = diffArrays(previous, current);

            expect(result.changed).toBe(true);
            expect(result.added).toEqual(new Set([4, 5]));
            expect(result.removed.size).toBe(0);
        });

        it('identifies removed elements', () => {
            const previous = [1, 2, 3, 4, 5];
            const current = [1, 2, 3];
            const result = diffArrays(previous, current);

            expect(result.changed).toBe(true);
            expect(result.added.size).toBe(0);
            expect(result.removed).toEqual(new Set([4, 5]));
        });

        it('identifies both added and removed elements', () => {
            const previous = [1, 2, 3, 4];
            const current = [1, 2, 5, 6];
            const result = diffArrays(previous, current);

            expect(result.changed).toBe(true);
            expect(result.added).toEqual(new Set([5, 6]));
            expect(result.removed).toEqual(new Set([3, 4]));
        });

        it('handles empty previous array (all elements added)', () => {
            const previous: number[] = [];
            const current = [1, 2, 3];
            const result = diffArrays(previous, current);

            expect(result.changed).toBe(true);
            expect(result.added).toEqual(new Set([1, 2, 3]));
            expect(result.removed.size).toBe(0);
        });

        it('handles empty current array (all elements removed)', () => {
            const previous = [1, 2, 3];
            const current: number[] = [];
            const result = diffArrays(previous, current);

            expect(result.changed).toBe(true);
            expect(result.added.size).toBe(0);
            expect(result.removed).toEqual(new Set([1, 2, 3]));
        });

        it('handles arrays with duplicate elements', () => {
            const previous = [1, 2, 2, 3];
            const current = [1, 2, 3, 3];
            const result = diffArrays(previous, current);

            expect(result.changed).toBe(true);
            expect(result.added).toEqual(new Set([3]));
            expect(result.removed).toEqual(new Set([2]));
        });

        it('handles arrays with no overlap', () => {
            const previous = [1, 2, 3];
            const current = [4, 5, 6];
            const result = diffArrays(previous, current);

            expect(result.changed).toBe(true);
            expect(result.added).toEqual(new Set([4, 5, 6]));
            expect(result.removed).toEqual(new Set([1, 2, 3]));
        });
    });
});
