import { ColorScale } from './colorScale';

describe('ColorScale', () => {
    it('should throw an error if the domain has less than 2 values', () => {
        expect(() => new ColorScale([1], ['#ff0000'])).toThrow('Color scale domain must contain at least 2 values.');
    });

    it('should throw an error if the domain size does not match the range size', () => {
        expect(() => new ColorScale([1, 2, 3], ['#ff0000', '#00ff00'])).toThrow(
            'Color scale range size must match the provided domain size.'
        );
    });

    it('should convert domain values to corresponding color values', () => {
        const scale = new ColorScale([1, 2, 3], ['#ff0000', '#00ff00', '#0000ff']);

        expect(scale.convert(1)).toBe('rgba(255,0,0,1)');
        expect(scale.convert(2)).toBe('rgba(0,255,0,1)');
    });

    it('should interpolate colors correctly within the domain range', () => {
        const scale = new ColorScale([1, 2, 3], ['#ff0000', '#00ff00', '#0000ff']);

        expect([1, 1.25, 1.5, 1.75, 2, 2.1, 2.31, 2.57, 2.83, 2.99, 3].map((n) => scale.convert(n))).toMatchSnapshot();
    });
});
