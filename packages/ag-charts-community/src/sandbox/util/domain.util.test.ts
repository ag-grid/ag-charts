import { convertDomain, niceDomain } from './domain.util';

describe('convertDomain', () => {
    it('should map a number from one range to another', () => {
        expect(convertDomain(5, [0, 10], [0, 100])).toBe(50);
    });

    it('should handle cases where the domain start and end are the same', () => {
        expect(convertDomain(5, [10, 10], [0, 100])).toBe(50);
    });

    it('should respect the boundaries of the domain when clamping is enabled', () => {
        expect(convertDomain(-5, [0, 10], [0, 100], true)).toBe(0);
        expect(convertDomain(15, [0, 10], [0, 100], true)).toBe(100);
    });

    it('should not clamp values when clamping is not enabled', () => {
        expect(convertDomain(-5, [0, 10], [0, 100], false)).toBe(-50);
        expect(convertDomain(15, [0, 10], [0, 100], false)).toBe(150);
    });

    it('should return exact range start or end for exact domain start or end inputs', () => {
        expect(convertDomain(0, [0, 10], [0, 100])).toBe(0);
        expect(convertDomain(10, [0, 10], [0, 100])).toBe(100);
    });
});

describe('niceDomain', () => {
    it('should apply Math.floor to the lower bound and Math.ceil to the upper bound', () => {
        expect(niceDomain([0.1, 5.9])).toEqual([0, 6]);
    });

    it('should handle negative numbers correctly', () => {
        expect(niceDomain([-5.9, -0.1])).toEqual([-6, 0]);
    });

    it('should use provided floor and ceil functions', () => {
        const floor = jest.fn((n) => Math.floor(n));
        const ceil = jest.fn((n) => Math.ceil(n));

        expect(niceDomain([1.2, 3.7], { floor, ceil })).toEqual([1, 4]);
        expect(floor).toHaveBeenCalledWith(1.2);
        expect(ceil).toHaveBeenCalledWith(3.7);
    });

    it('should handle single element arrays', () => {
        const result = niceDomain([2.7], { floor: Math.floor, ceil: Math.ceil });
        expect(result).toEqual([2, 3]);
    });

    it('should not mutate the original domain array', () => {
        const originalDomain = [1.2, 3.7];
        const copyDomain = [...originalDomain];
        niceDomain(originalDomain, { floor: Math.floor, ceil: Math.ceil });
        expect(originalDomain).toEqual(copyDomain);
    });

    it('should work with custom rounding functions', () => {
        const floor = (n: number) => Math.round(n) - 1;
        const ceil = (n: number) => Math.round(n) + 1;
        expect(niceDomain([1.5, 3.5], { floor, ceil })).toEqual([1, 5]);
    });
});
