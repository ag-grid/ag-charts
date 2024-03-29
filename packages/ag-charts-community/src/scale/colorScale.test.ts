import { expect, test } from '@jest/globals';

import { Color } from '../util/color';
import { ColorScale } from './colorScale';

describe('ColorScale', () => {
    beforeEach(() => {
        // It's too much effort to compute values in the OKLCH space
        // Use HSL instead, reordering components so it's "equivalent"
        Color.fromOKLCH = (l, c, h) => Color.fromHSL(h, c, l);
        Color.RGBtoOKLCH = (r, g, b) => {
            const [h, s, l] = Color.RGBtoHSL(r, g, b);
            return [l, s, h];
        };
    });

    test('domain', () => {
        const scale = new ColorScale();

        expect(scale.domain).toEqual([0, 1]);
        scale.domain = [5, 10];
        expect(scale.domain).toEqual([5, 10]);
    });

    test('range', () => {
        const scale = new ColorScale();

        expect(scale.range).toEqual(['red', 'blue']);
        scale.range = ['black', '#ffffff'];
        scale.update();
        expect(scale.range).toEqual(['black', '#ffffff']);
    });

    test('convert', () => {
        const scale = new ColorScale();

        scale.domain = [-100, 100];
        scale.range = ['black', '#ffffff'];
        scale.update();

        expect(scale.convert(-101)).toBe('black');
        expect(scale.convert(-100)).toBe('black');
        expect(scale.convert(0)).toBe('rgb(128, 128, 128)');
        expect(scale.convert(100)).toBe('#ffffff');
        expect(scale.convert(101)).toBe('#ffffff');
    });

    test('multi-color range', () => {
        const scale = new ColorScale();

        scale.domain = [-100, 100];
        scale.range = ['black', 'red', '#ffffff'];
        scale.update();

        expect(scale.convert(-101)).toBe('black');
        expect(scale.convert(-100)).toBe('black');
        expect(scale.convert(-50)).toBe('rgb(128, 0, 0)');
        expect(scale.convert(0)).toBe('rgb(255, 0, 0)');
        expect(scale.convert(50)).toBe('rgb(255, 128, 128)');
        expect(scale.convert(100)).toBe('#ffffff');
        expect(scale.convert(101)).toBe('#ffffff');
    });

    test('multi-value domain', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100, 500];
        scale.range = ['black', 'red', '#ffffff'];
        scale.update();

        expect(scale.convert(-1)).toBe('black');
        expect(scale.convert(0)).toBe('black');
        expect(scale.convert(50)).toBe('rgb(128, 0, 0)');
        expect(scale.convert(100)).toBe('rgb(255, 0, 0)');
        expect(scale.convert(300)).toBe('rgb(255, 128, 128)');
        expect(scale.convert(500)).toBe('#ffffff');
        expect(scale.convert(501)).toBe('#ffffff');
    });

    test('heatmap multistop', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100, 200, 300, 400];
        scale.range = ['white', 'yellow', 'red', 'blue', 'black'];
        scale.update();

        expect(scale.convert(0)).toBe('white');
        expect(scale.convert(50)).toBe('rgb(255, 255, 128)');
        expect(scale.convert(100)).toBe('rgb(255, 255, 0)');
        expect(scale.convert(150)).toBe('rgb(255, 128, 0)');
        expect(scale.convert(200)).toBe('rgb(255, 0, 0)');
        expect(scale.convert(250)).toBe('rgb(255, 0, 255)');
        expect(scale.convert(300)).toBe('rgb(0, 0, 255)');
        expect(scale.convert(350)).toBe('rgb(0, 0, 128)');
        expect(scale.convert(400)).toBe('black');
    });

    test('hsl interpolation', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100];
        scale.range = ['red', 'green'];
        scale.update();

        expect(scale.convert(0)).toBe('red');
        expect(scale.convert(50)).toBe('rgb(191, 192, 0)');
        expect(scale.convert(100)).toBe('green');
    });

    test('hsl interpolation anti-clockwise starting at red', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100];
        scale.range = ['red', 'blue'];
        scale.update();

        expect(scale.convert(0)).toBe('red');
        expect(scale.convert(50)).toBe('rgb(255, 0, 255)');
        expect(scale.convert(100)).toBe('blue');
    });

    test('hsl interpolation anti-clockwise not starting at red', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100];
        scale.range = ['yellow', 'magenta'];
        scale.update();

        expect(scale.convert(0)).toBe('yellow');
        expect(scale.convert(50)).toBe('rgb(255, 0, 0)');
        expect(scale.convert(100)).toBe('magenta');
    });

    test('fade to black', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100];
        scale.range = ['blue', 'black'];
        scale.update();

        expect(scale.convert(0)).toBe('blue');
        expect(scale.convert(50)).toBe('rgb(0, 0, 128)');
        expect(scale.convert(100)).toBe('black');
    });

    test('fade to white', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100];
        scale.range = ['blue', 'white'];
        scale.update();

        expect(scale.convert(0)).toBe('blue');
        expect(scale.convert(50)).toBe('rgb(128, 128, 255)');
        expect(scale.convert(100)).toBe('white');
    });
});
