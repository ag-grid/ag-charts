import { calculatePlacement } from './placement';

describe('calculatePosition function', () => {
    it('should calculate position with provided bounds (top, left)', () => {
        const naturalWidth = 100;
        const naturalHeight = 100;
        const containerWidth = 500;
        const containerHeight = 500;
        const bounds = {
            top: 50,
            left: 50,
        };
        const position = calculatePlacement(naturalWidth, naturalHeight, containerWidth, containerHeight, bounds);
        expect(position).toEqual({ x: 50, y: 50, width: 100, height: 100 });
    });

    it('should calculate position with provided bounds (right, bottom)', () => {
        const naturalWidth = 100;
        const naturalHeight = 100;
        const containerWidth = 500;
        const containerHeight = 500;
        const bounds = {
            right: 50,
            bottom: 50,
        };
        const position = calculatePlacement(naturalWidth, naturalHeight, containerWidth, containerHeight, bounds);
        expect(position).toEqual({ x: 350, y: 350, width: 100, height: 100 });
    });

    it('should calculate position with provided bounds (top, right)', () => {
        const naturalWidth = 100;
        const naturalHeight = 100;
        const containerWidth = 500;
        const containerHeight = 500;
        const bounds = {
            top: 50,
            right: 50,
        };
        const position = calculatePlacement(naturalWidth, naturalHeight, containerWidth, containerHeight, bounds);
        expect(position).toEqual({ x: 350, y: 50, width: 100, height: 100 });
    });

    it('should calculate position with provided bounds (bottom, left)', () => {
        const naturalWidth = 100;
        const naturalHeight = 100;
        const containerWidth = 500;
        const containerHeight = 500;
        const bounds = {
            bottom: 50,
            left: 50,
        };
        const position = calculatePlacement(naturalWidth, naturalHeight, containerWidth, containerHeight, bounds);
        expect(position).toEqual({ x: 50, y: 350, width: 100, height: 100 });
    });

    it('should calculate position with provided bounds (width, height)', () => {
        const naturalWidth = 100;
        const naturalHeight = 100;
        const containerWidth = 500;
        const containerHeight = 500;
        const bounds = {
            width: 200,
            height: 200,
        };
        const position = calculatePlacement(naturalWidth, naturalHeight, containerWidth, containerHeight, bounds);
        expect(position).toEqual({ x: 150, y: 150, width: 200, height: 200 });
    });

    it('should calculate position with natural size if width and height not provided in bounds', () => {
        const naturalWidth = 100;
        const naturalHeight = 100;
        const containerWidth = 500;
        const containerHeight = 500;
        const bounds = {};
        const position = calculatePlacement(naturalWidth, naturalHeight, containerWidth, containerHeight, bounds);
        expect(position).toEqual({ x: 200, y: 200, width: 100, height: 100 });
    });
});
