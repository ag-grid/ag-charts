import { ColorScale } from './colorScale';

describe('ColorScale', () => {
    it('should throw an error if the domain has less than 2 values', () => {
        expect(() => new ColorScale([1], ['#ff0000'])).toThrow(
            'Color scale domain size must be greater than or equal to 2.'
        );
    });

    it('should throw an error if the domain size is greater than 2 and does not match the range size', () => {
        expect(() => new ColorScale([1, 2, 3], ['#ff0000', '#00ff00'])).toThrow(
            'Color scale domain size must be equal to 2 or to the provided range size.'
        );
    });

    it('should convert domain values to corresponding color values', () => {
        const scale = new ColorScale([1, 2, 3], ['#ff0000', '#00ff00', '#0000ff']);

        expect(scale.convert(1)).toBe('rgba(255,0,0,1)');
        expect(scale.convert(2)).toBe('rgba(0,255,0,1)');
    });

    it('should interpolate colors correctly within the domain range for a 3-point domain and range', () => {
        const scale = new ColorScale([1, 2, 3], ['#ff0000', '#00ff00', '#0000ff']);

        expect([1, 1.25, 1.5, 1.75, 2, 2.1, 2.31, 2.57, 2.83, 2.99, 3].map((n) => scale.convert(n))).toMatchSnapshot();
    });

    it('should interpolate colors correctly within the domain range for a 2-point domain and a 3-point range', () => {
        const scale = new ColorScale([1, 3], ['#ff0000', '#00ff00', '#0000ff']);

        expect([1, 1.25, 1.5, 1.75, 2, 2.1, 2.31, 2.57, 2.83, 2.99, 3].map((n) => scale.convert(n))).toMatchSnapshot();
    });

    it('should produce identical color interpolations for different domain configurations', () => {
        const samples = [1, 1.25, 1.5, 1.75, 2, 2.1, 2.31, 2.57, 2.83, 2.99, 3];
        const scaleD2 = new ColorScale([1, 3], ['#ff0000', '#00ff00', '#0000ff']);
        const scaleD3 = new ColorScale([1, 2, 3], ['#ff0000', '#00ff00', '#0000ff']);

        expect(samples.map((n) => scaleD2.convert(n))).toEqual(samples.map((n) => scaleD3.convert(n)));
    });
});
