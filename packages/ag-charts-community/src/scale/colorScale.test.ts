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

    describe('continuous mode with explicit stops', () => {
        test('non-equal stop boundaries interpolate within segments', () => {
            const scale = new ColorScale();

            // {red}, {yellow, stop:60}, {lightgreen, stop:80}, {green}
            // domain: [0, 60, 80, 100], using RGB values for precise comparison
            scale.domain = [0, 60, 80, 100];
            scale.range = ['rgb(255, 0, 0)', 'rgb(255, 255, 0)', 'rgb(144, 238, 144)', 'rgb(0, 128, 0)'];
            scale.update();

            // At domain boundaries: clamped values return range endpoints
            expect(scale.convert(0)).toBe('rgb(255, 0, 0)');
            expect(scale.convert(100)).toBe('rgb(0, 128, 0)');

            // Mid-segment: 30 is halfway between red and yellow (interpolated)
            const mid = scale.convert(30);
            expect(mid).not.toBe('rgb(255, 0, 0)');
            expect(mid).not.toBe('rgb(255, 255, 0)');

            // At internal boundary 60: interpolated with q=0 gives yellow
            expect(scale.convert(60)).toBe('rgb(255, 255, 0)');
        });

        test('values outside explicit stop range clamp to boundary colours', () => {
            const scale = new ColorScale();

            // All explicit: {red, stop:0}, {yellow, stop:60}, {green, stop:100}
            scale.domain = [0, 60, 100];
            scale.range = ['rgb(255, 0, 0)', 'rgb(255, 255, 0)', 'rgb(0, 128, 0)'];
            scale.update();

            expect(scale.convert(-100)).toBe('rgb(255, 0, 0)');
            expect(scale.convert(0)).toBe('rgb(255, 0, 0)');
            expect(scale.convert(100)).toBe('rgb(0, 128, 0)');
            expect(scale.convert(200)).toBe('rgb(0, 128, 0)');
        });

        test('consecutive items without stops divide space equally', () => {
            const scale = new ColorScale();

            // {blue}, {red}, {pink, stop:60} on domain [0, 100]
            // Blue and red split [0, 60] equally: blue at 0, red at 30, pink at 60
            scale.domain = [0, 30, 60];
            scale.range = ['rgb(0, 0, 255)', 'rgb(255, 0, 0)', 'rgb(255, 192, 203)'];
            scale.update();

            expect(scale.convert(0)).toBe('rgb(0, 0, 255)');
            expect(scale.convert(60)).toBe('rgb(255, 192, 203)');

            // At internal boundary 30: interpolated with q=0 gives red
            expect(scale.convert(30)).toBe('rgb(255, 0, 0)');

            // 15 is halfway between blue and red (should be interpolated)
            const midBlueRed = scale.convert(15);
            expect(midBlueRed).not.toBe('rgb(0, 0, 255)');
            expect(midBlueRed).not.toBe('rgb(255, 0, 0)');
        });
    });

    describe('discrete mode', () => {
        test('returns solid bin colours without interpolation', () => {
            const scale = new ColorScale();

            scale.domain = [0, 33, 66];
            scale.range = ['red', 'yellow', 'green'];
            scale.mode = 'discrete';
            scale.update();

            expect(scale.convert(0)).toBe('red');
            expect(scale.convert(16)).toBe('red');
            expect(scale.convert(33)).toBe('yellow');
            expect(scale.convert(50)).toBe('yellow');
            expect(scale.convert(66)).toBe('green');
            expect(scale.convert(100)).toBe('green');
        });

        test('edge values: below domain returns first colour', () => {
            const scale = new ColorScale();

            scale.domain = [10, 50, 90];
            scale.range = ['red', 'blue', 'green'];
            scale.mode = 'discrete';
            scale.update();

            expect(scale.convert(5)).toBe('red');
            expect(scale.convert(10)).toBe('red');
        });

        test('edge values: above domain returns last colour', () => {
            const scale = new ColorScale();

            scale.domain = [10, 50, 90];
            scale.range = ['red', 'blue', 'green'];
            scale.mode = 'discrete';
            scale.update();

            expect(scale.convert(90)).toBe('green');
            expect(scale.convert(100)).toBe('green');
        });

        test('two-value domain with multiple colours', () => {
            const scale = new ColorScale();

            scale.domain = [0, 100];
            scale.range = ['red', 'yellow', 'green'];
            scale.mode = 'discrete';
            scale.update();

            expect(scale.convert(0)).toBe('red');
            expect(scale.convert(30)).toBe('red');
            expect(scale.convert(50)).toBe('yellow');
            expect(scale.convert(80)).toBe('yellow');
            expect(scale.convert(100)).toBe('green');
        });

        test('JIRA example: 3 colours no stops, equal blocks', () => {
            // Given data 0-100 and {red}, {yellow}, {green}
            // 0=red, 1-32=red, 33=yellow, 34-65=yellow, 66-99=green, 100=green
            const scale = new ColorScale();

            const third = 100 / 3;
            const twoThirds = 200 / 3;
            scale.domain = [0, third, twoThirds];
            scale.range = ['red', 'yellow', 'green'];
            scale.mode = 'discrete';
            scale.update();

            expect(scale.convert(0)).toBe('red');
            expect(scale.convert(1)).toBe('red');
            expect(scale.convert(32)).toBe('red');
            expect(scale.convert(34)).toBe('yellow');
            expect(scale.convert(65)).toBe('yellow');
            expect(scale.convert(67)).toBe('green');
            expect(scale.convert(99)).toBe('green');
            expect(scale.convert(100)).toBe('green');
        });

        test('JIRA example: explicit stops with 4 colours', () => {
            // {red, stop:40}, {yellow, stop:60}, {lightgreen, stop:80}, {green}
            // computeColorBins produces domain [0, 40, 60, 80] (bin-end positions)
            // 0-39=red, 40-59=yellow, 60-79=lightgreen, 80-100=green
            const scale = new ColorScale();

            scale.domain = [0, 40, 60, 80];
            scale.range = ['red', 'yellow', 'lightgreen', 'green'];
            scale.mode = 'discrete';
            scale.update();

            expect(scale.convert(0)).toBe('red');
            expect(scale.convert(39)).toBe('red');
            expect(scale.convert(40)).toBe('yellow');
            expect(scale.convert(59)).toBe('yellow');
            expect(scale.convert(60)).toBe('lightgreen');
            expect(scale.convert(79)).toBe('lightgreen');
            expect(scale.convert(80)).toBe('green');
            expect(scale.convert(100)).toBe('green');
        });

        test('mixed stops: fills without stops share space equally', () => {
            // {red}, {yellow, stop:60}, {lightgreen, stop:80}, {green}
            // computeColorBins produces domain [0, 30, 60, 80]
            // red=[0,30), yellow=[30,60), lightgreen=[60,80), green=[80,100]
            const scale = new ColorScale();

            scale.domain = [0, 30, 60, 80];
            scale.range = ['red', 'yellow', 'lightgreen', 'green'];
            scale.mode = 'discrete';
            scale.update();

            expect(scale.convert(0)).toBe('red');
            expect(scale.convert(29)).toBe('red');
            expect(scale.convert(30)).toBe('yellow');
            expect(scale.convert(59)).toBe('yellow');
            expect(scale.convert(60)).toBe('lightgreen');
            expect(scale.convert(79)).toBe('lightgreen');
            expect(scale.convert(80)).toBe('green');
            expect(scale.convert(100)).toBe('green');
        });

        test('stop value is first number of next block', () => {
            // With {red, stop:0}, {yellow, stop:60}: 60 itself is yellow
            const scale = new ColorScale();

            scale.domain = [0, 60];
            scale.range = ['red', 'yellow'];
            scale.mode = 'discrete';
            scale.update();

            expect(scale.convert(59)).toBe('red');
            expect(scale.convert(60)).toBe('yellow');
            expect(scale.convert(100)).toBe('yellow');
        });

        test('negative domain', () => {
            const scale = new ColorScale();

            scale.domain = [-50, 0, 50];
            scale.range = ['red', 'white', 'green'];
            scale.mode = 'discrete';
            scale.update();

            expect(scale.convert(-100)).toBe('red');
            expect(scale.convert(-50)).toBe('red');
            expect(scale.convert(-1)).toBe('red');
            expect(scale.convert(0)).toBe('white');
            expect(scale.convert(49)).toBe('white');
            expect(scale.convert(50)).toBe('green');
            expect(scale.convert(100)).toBe('green');
        });

        test('two colours produces two equal bins', () => {
            // computeColorBins for 2 colours produces domain [0, 50]
            const scale = new ColorScale();

            scale.domain = [0, 50];
            scale.range = ['red', 'green'];
            scale.mode = 'discrete';
            scale.update();

            expect(scale.convert(0)).toBe('red');
            expect(scale.convert(49)).toBe('red');
            expect(scale.convert(50)).toBe('green');
            expect(scale.convert(100)).toBe('green');
        });

        test('five colours with multi-value domain produces five equal bins', () => {
            // computeColorBins for 5 colours produces domain [0, 20, 40, 60, 80]
            const scale = new ColorScale();

            scale.domain = [0, 20, 40, 60, 80];
            scale.range = ['red', 'orange', 'yellow', 'lightgreen', 'green'];
            scale.mode = 'discrete';
            scale.update();

            expect(scale.convert(0)).toBe('red');
            expect(scale.convert(19)).toBe('red');
            expect(scale.convert(20)).toBe('orange');
            expect(scale.convert(39)).toBe('orange');
            expect(scale.convert(40)).toBe('yellow');
            expect(scale.convert(59)).toBe('yellow');
            expect(scale.convert(60)).toBe('lightgreen');
            expect(scale.convert(79)).toBe('lightgreen');
            expect(scale.convert(80)).toBe('green');
            expect(scale.convert(100)).toBe('green');
        });
    });
});
