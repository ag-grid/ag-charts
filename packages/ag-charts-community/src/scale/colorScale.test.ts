import { expect, test } from '@jest/globals';

import { ColorScale } from './colorScale';

describe('ColorScale', () => {
    test('domain', () => {
        const scale = new ColorScale();

        expect(scale.domain).toEqual([0, 1]);
        scale.domain = [5, 10];
        expect(scale.domain).toEqual([5, 10]);
    });

    test('range', () => {
        const scale = new ColorScale();

        expect(scale.range).toEqual(['red', 'blue']);
        scale.range = ['rgb(0, 0, 0)', 'rgb(255, 255, 255)'];
        scale.update();
        expect(scale.range).toEqual(['rgb(0, 0, 0)', 'rgb(255, 255, 255)']);
    });

    test('convert', () => {
        const scale = new ColorScale();

        scale.domain = [-100, 100];
        scale.range = ['rgb(0, 0, 0)', 'rgb(255, 255, 255)'];
        scale.update();

        expect(scale.convert(-101)).toBe('rgb(0, 0, 0)');
        expect(scale.convert(-100)).toBe('rgb(0, 0, 0)');
        expect(scale.convert(0)).toBe('rgb(99, 99, 99)');
        expect(scale.convert(100)).toBe('rgb(255, 255, 255)');
        expect(scale.convert(101)).toBe('rgb(255, 255, 255)');
    });

    test('multi-color range', () => {
        const scale = new ColorScale();

        scale.domain = [-100, 100];
        scale.range = ['rgb(0, 0, 0)', 'rgb(255, 0, 0)', 'rgb(255, 255, 255)'];
        scale.update();

        expect(scale.convert(-101)).toBe('rgb(0, 0, 0)');
        expect(scale.convert(-100)).toBe('rgb(0, 0, 0)');
        expect(scale.convert(-50)).toBe('rgb(99, 0, 0)');
        expect(scale.convert(0)).toBe('rgb(255, 0, 0)');
        expect(scale.convert(50)).toBe('rgb(255, 161, 145)');
        expect(scale.convert(100)).toBe('rgb(255, 255, 255)');
        expect(scale.convert(101)).toBe('rgb(255, 255, 255)');
    });

    test('multi-value domain', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100, 500];
        scale.range = ['rgb(0, 0, 0)', 'rgb(255, 0, 0)', 'rgb(255, 255, 255)'];
        scale.update();

        expect(scale.convert(-1)).toBe('rgb(0, 0, 0)');
        expect(scale.convert(0)).toBe('rgb(0, 0, 0)');
        expect(scale.convert(50)).toBe('rgb(99, 0, 0)');
        expect(scale.convert(100)).toBe('rgb(255, 0, 0)');
        expect(scale.convert(300)).toBe('rgb(255, 161, 145)');
        expect(scale.convert(500)).toBe('rgb(255, 255, 255)');
        expect(scale.convert(501)).toBe('rgb(255, 255, 255)');
    });

    test('heatmap multistop', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100, 200, 300, 400];
        scale.range = ['rgb(255, 255, 255)', 'rgb(255, 255, 0)', 'rgb(255, 0, 0)', 'rgb(0, 0, 255)', 'rgb(0, 0, 0)'];
        scale.update();

        expect(scale.convert(0)).toBe('rgb(255, 255, 255)');
        expect(scale.convert(50)).toBe('rgb(254, 255, 172)');
        expect(scale.convert(100)).toBe('rgb(255, 255, 0)');
        expect(scale.convert(150)).toBe('rgb(255, 152, 0)');
        expect(scale.convert(200)).toBe('rgb(255, 0, 0)');
        expect(scale.convert(250)).toBe('rgb(186, 0, 194)');
        expect(scale.convert(300)).toBe('rgb(0, 0, 255)');
        expect(scale.convert(350)).toBe('rgb(0, 0, 99)');
        expect(scale.convert(400)).toBe('rgb(0, 0, 0)');
    });

    test('hsl interpolation', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100];
        scale.range = ['rgb(255, 0, 0)', 'rgb(0, 128, 0)'];
        scale.update();

        expect(scale.convert(0)).toBe('rgb(255, 0, 0)');
        expect(scale.convert(50)).toBe('rgb(176, 102, 0)');
        expect(scale.convert(100)).toBe('rgb(0, 128, 0)');
    });

    test('hsl interpolation anti-clockwise starting at red', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100];
        scale.range = ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'];
        scale.update();

        expect(scale.convert(0)).toBe('rgb(255, 0, 0)');
        expect(scale.convert(50)).toBe('rgb(186, 0, 194)');
        expect(scale.convert(100)).toBe('rgb(0, 0, 255)');
    });

    test('hsl interpolation anti-clockwise not starting at red', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100];
        scale.range = ['rgb(255, 255, 0)', 'rgb(255, 0, 255)'];
        scale.update();

        expect(scale.convert(0)).toBe('rgb(255, 255, 0)');
        expect(scale.convert(50)).toBe('rgb(255, 116, 2)');
        expect(scale.convert(100)).toBe('rgb(255, 0, 255)');
    });

    test('fade to rgb(0, 0, 0)', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100];
        scale.range = ['rgb(0, 0, 255)', 'rgb(0, 0, 0)'];
        scale.update();

        expect(scale.convert(0)).toBe('rgb(0, 0, 255)');
        expect(scale.convert(50)).toBe('rgb(0, 0, 99)');
        expect(scale.convert(100)).toBe('rgb(0, 0, 0)');
    });

    test('fade to white', () => {
        const scale = new ColorScale();

        scale.domain = [0, 100];
        scale.range = ['rgb(0, 0, 255)', 'rgb(255, 255, 255)'];
        scale.update();

        expect(scale.convert(0)).toBe('rgb(0, 0, 255)');
        expect(scale.convert(50)).toBe('rgb(116, 163, 255)');
        expect(scale.convert(100)).toBe('rgb(255, 255, 255)');
    });
});
