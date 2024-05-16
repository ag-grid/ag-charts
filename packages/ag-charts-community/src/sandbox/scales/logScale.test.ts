import { LogScale } from './logScale';

describe('LogScale', () => {
    it('should throw error for invalid domain', () => {
        expect(() => new LogScale([0, 10], [0, 100])).toThrow(
            'Log scale domain must be strictly-positive or strictly-negative.'
        );
        expect(() => new LogScale([-10, 0], [0, 100])).toThrow(
            'Log scale domain must be strictly-positive or strictly-negative.'
        );
        expect(() => new LogScale([-10, 10], [0, 100])).toThrow(
            'Log scale domain must be strictly-positive or strictly-negative.'
        );
    });

    describe('convert and invert methods', () => {
        const positiveScale = new LogScale([10, 1000], [0, 1]);
        const negativeScale = new LogScale([-1000, -10], [0, 1]);

        it('should convert positive values using log scale', () => {
            expect(positiveScale.convert(50)).toBe(0.3494850021680094);
        });

        it('should convert negative values using log scale', () => {
            expect(negativeScale.convert(-50)).toBe(0.6505149978319906);
        });

        it('should invert positive values using log scale', () => {
            expect(positiveScale.invert(0.3494850021680094)).toBeCloseTo(50);
        });

        it('should invert negative values using log scale', () => {
            expect(negativeScale.invert(0.6505149978319906)).toBeCloseTo(-50);
        });

        it('should clamp converted values if clamp is true', () => {
            expect(positiveScale.convert(0.1, true)).toBe(0);
            expect(positiveScale.convert(10000, true)).toBe(1);
            expect(negativeScale.convert(-10000, true)).toBe(0);
            expect(negativeScale.convert(-0.1, true)).toBe(1);
        });
    });

    it.only('niceDomain should return a nicely rounded domain for a LogScale instance with different base values', () => {
        const scaleBase10 = new LogScale([57, 775], [0, 1]);
        expect(scaleBase10.niceDomain()).toEqual([10, 1000]);

        const scaleBaseE = new LogScale([Math.E * 1.234, Math.E * 5.783], [0, 1], Math.E);
        expect(scaleBaseE.niceDomain().map(Math.log)).toEqual([1, 3]);
    });
});
