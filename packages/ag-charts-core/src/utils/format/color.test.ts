import { expect, test } from 'vitest';

import { Color } from './color';

describe('Color', () => {
    test('constructor', () => {
        {
            const color = new Color(-1, 1, -2, 3);
            expect(color.r).toBe(0);
            expect(color.g).toBe(1);
            expect(color.b).toBe(0);
            expect(color.a).toBe(1);
        }
        {
            const color = new Color(0.3, 0.4, 0.5);
            expect(color.r).toBe(0.3);
            expect(color.g).toBe(0.4);
            expect(color.b).toBe(0.5);
            expect(color.a).toBe(1);
        }
    });

    test('fromHexString', () => {
        {
            const color = Color.fromHexString('#abc');
            expect(color.r).toBe(0.6666666666666666);
            expect(color.g).toBe(0.7333333333333333);
            expect(color.b).toBe(0.8);
            expect(color.a).toBe(1);
        }
        {
            const color = Color.fromHexString('#aabbcc');
            expect(color.r).toBe(0.6666666666666666);
            expect(color.g).toBe(0.7333333333333333);
            expect(color.b).toBe(0.8);
            expect(color.a).toBe(1);
        }
        {
            const color = Color.fromHexString('#abcc');
            expect(color.r).toBe(0.6666666666666666);
            expect(color.g).toBe(0.7333333333333333);
            expect(color.b).toBe(0.8);
            expect(color.a).toBe(0.8);
        }
        {
            const color = Color.fromHexString('#aabbcccc');
            expect(color.r).toBe(0.6666666666666666);
            expect(color.g).toBe(0.7333333333333333);
            expect(color.b).toBe(0.8);
            expect(color.a).toBe(0.8);
        }

        expect(() => {
            Color.fromHexString('');
        }).toThrow();
        expect(() => {
            Color.fromHexString('#');
        }).toThrow();
        expect(() => {
            Color.fromHexString('#a');
        }).toThrow();
        expect(() => {
            Color.fromHexString('#ab');
        }).toThrow();
        expect(() => {
            Color.fromHexString('#abcde');
        }).toThrow();
        expect(() => {
            Color.fromHexString('#aabbccd');
        }).toThrow();
        expect(() => {
            Color.fromHexString('#aabbccddf');
        }).toThrow();
    });

    test('fromArray', () => {
        {
            const color = Color.fromArray([0.1, 0.2, 0.3, 0.4]);
            expect(color.r).toBe(0.1);
            expect(color.g).toBe(0.2);
            expect(color.b).toBe(0.3);
            expect(color.a).toBe(0.4);
        }
        {
            const color = Color.fromArray([0.1, 0.2, 0.3]);
            expect(color.r).toBe(0.1);
            expect(color.g).toBe(0.2);
            expect(color.b).toBe(0.3);
            expect(color.a).toBe(1);
        }
    });

    test('toHSB', () => {
        {
            const color = new Color(0.2, 0.4, 0.6);
            const hsb = color.toHSB();
            expect(hsb[0]).toBe(210);
            expect(hsb[1]).toBe(0.6666666666666666);
            expect(hsb[2]).toBe(0.6);
        }
        {
            const color = new Color(0.3, 0.8, 0.5);
            const hsb = color.toHSB();
            expect(hsb[0]).toBe(144);
            expect(hsb[1]).toBe(0.625);
            expect(hsb[2]).toBe(0.8);
        }
        {
            const color = new Color(0.5, 0.5, 0.5);
            const hsb = color.toHSB();
            expect(hsb[0]).toBe(0);
            expect(hsb[1]).toBe(0);
            expect(hsb[2]).toBe(0.5);
        }
    });

    test('HSBtoRGB', () => {
        {
            const rgb = Color.HSBtoRGB(0.3, 0.8, 0.6);
            expect(rgb[0]).toBe(0.6);
            expect(rgb[1]).toBe(0.1224000000000001);
            expect(rgb[2]).toBe(0.11999999999999997);
        }
        {
            const rgb = Color.HSBtoRGB(0, 0.8, 0.6);
            expect(rgb[0]).toBe(0.6);
            expect(rgb[1]).toBe(0.11999999999999997);
            expect(rgb[2]).toBe(0.11999999999999997);
        }
    });

    test('fromRgbaString', () => {
        {
            const color = Color.fromRgbaString('  rgb(120,240,100) ');
            expect(color.r).toBe(120 / 255);
            expect(color.g).toBe(240 / 255);
            expect(color.b).toBe(100 / 255);
            expect(color.a).toBe(1);
            expect(color.toRgbaString()).toBe('rgb(120, 240, 100)');
        }
        {
            const color = Color.fromRgbaString('  rgba(120,   240,  100,    0.4) ');
            expect(color.r).toBe(120 / 255);
            expect(color.g).toBe(240 / 255);
            expect(color.b).toBe(100 / 255);
            expect(color.a).toBe(0.4);
            expect(color.toRgbaString()).toBe('rgba(120, 240, 100, 0.4)');
        }
        {
            const color = Color.fromRgbaString('  rgba(120,   340,  500,    2.4) ');
            expect(color.r).toBe(120 / 255);
            expect(color.g).toBe(1);
            expect(color.b).toBe(1);
            expect(color.a).toBe(1);
            expect(color.toRgbaString()).toBe('rgb(120, 255, 255)');
        }
        {
            const color = Color.fromRgbaString('  rgb(50%, 25%,75%) ');
            expect(color.r).toBe(0.5);
            expect(color.g).toBe(0.25);
            expect(color.b).toBe(0.75);
            expect(color.a).toBe(1);
            expect(color.toRgbaString()).toBe('rgb(128, 64, 191)');
        }
        {
            const color = Color.fromRgbaString('  rgb(100, 25%, 200, 50%) ');
            expect(color.r).toBe(100 / 255);
            expect(color.g).toBe(0.25);
            expect(color.b).toBe(200 / 255);
            expect(color.a).toBe(0.5);
            expect(color.toRgbaString()).toBe('rgba(100, 64, 200, 0.5)');
        }
        {
            const color = Color.fromRgbaString('  rgb(-23, 255, 300) ');
            expect(color.r).toBe(0);
            expect(color.g).toBe(1);
            expect(color.b).toBe(1);
            expect(color.a).toBe(1);
            expect(color.toRgbaString()).toBe('rgb(0, 255, 255)');
        }
    });

    test('fromString', () => {
        {
            const color = Color.fromString('#abc');
            expect(color.r).toBe(0.6666666666666666);
            expect(color.g).toBe(0.7333333333333333);
            expect(color.b).toBe(0.8);
            expect(color.a).toBe(1);
        }
        {
            const color = Color.fromString('#ff00ff');
            expect(color.r).toBe(1);
            expect(color.g).toBe(0);
            expect(color.b).toBe(1);
            expect(color.a).toBe(1);
        }
        {
            const color = Color.fromString('rgb(120, 240, 100)');
            expect(color.r).toBe(120 / 255);
            expect(color.g).toBe(240 / 255);
            expect(color.b).toBe(100 / 255);
            expect(color.a).toBe(1);
            expect(color.toRgbaString()).toBe('rgb(120, 240, 100)');
        }
        {
            const color = Color.fromString('cyan');
            expect(color.r).toBe(0);
            expect(color.g).toBe(1);
            expect(color.b).toBe(1);
            expect(color.a).toBe(1);
            expect(color.toRgbaString()).toBe('rgb(0, 255, 255)');
        }
        {
            const color = Color.fromString('CyAn');
            expect(color.r).toBe(0);
            expect(color.g).toBe(1);
            expect(color.b).toBe(1);
            expect(color.a).toBe(1);
            expect(color.toRgbaString()).toBe('rgb(0, 255, 255)');
        }
        {
            const color = Color.fromString('magenta');
            expect(color.r).toBe(1);
            expect(color.g).toBe(0);
            expect(color.b).toBe(1);
            expect(color.a).toBe(1);
            expect(color.toRgbaString()).toBe('rgb(255, 0, 255)');
        }
        expect(() => {
            Color.fromRgbaString('#');
        }).toThrow();
        expect(() => {
            Color.fromRgbaString('rgba()');
        }).toThrow();
        expect(() => {
            Color.fromRgbaString('blah');
        }).toThrow();
    });

    test('fromHSLString', () => {
        // comma-separated
        {
            const color = Color.fromHSLString('hsl(210, 100%, 50%)');
            expect(color.toHexString()).toBe('#007fff');
            expect(color.a).toBe(1);
        }
        // space-separated
        {
            const color = Color.fromHSLString('hsl(210 100% 50%)');
            expect(color.toHexString()).toBe('#007fff');
        }
        // hsla with comma alpha
        {
            const color = Color.fromHSLString('hsla(210, 100%, 50%, 0.4)');
            expect(color.toHexString()).toBe('#007fff66');
            expect(color.a).toBe(0.4);
        }
        // `/ alpha` form, numeric alpha
        {
            const color = Color.fromHSLString('hsl(210 100% 50% / 0.4)');
            expect(color.a).toBe(0.4);
        }
        // `/ alpha` form, percentage alpha
        {
            const color = Color.fromHSLString('hsl(210 100% 50% / 40%)');
            expect(color.a).toBe(0.4);
        }
        // hue with `deg` suffix
        {
            const color = Color.fromHSLString('hsl(210deg, 100%, 50%)');
            expect(color.toHexString()).toBe('#007fff');
        }
        // hue in turn / rad / grad
        {
            expect(Color.fromHSLString('hsl(0.5turn, 100%, 50%)').toHexString()).toBe('#00ffff');
            expect(Color.fromHSLString('hsl(200grad, 100%, 50%)').toHexString()).toBe('#00ffff');
            expect(Color.fromHSLString(`hsl(${Math.PI}rad, 100%, 50%)`).toHexString()).toBe('#00ffff');
        }
        // achromatic (s = 0) is a shade of grey regardless of hue
        {
            const color = Color.fromHSLString('hsl(123, 0%, 50%)');
            expect(color.toHexString()).toBe('#808080');
        }
        // out-of-range saturation / lightness are clamped to [0, 1]
        {
            expect(Color.fromHSLString('hsl(120, 150%, 50%)').toHexString()).toBe('#00ff00');
            expect(Color.fromHSLString('hsl(120, 100%, 150%)').toHexString()).toBe('#ffffff');
        }
        // bare-number saturation / lightness share the percentage range
        {
            expect(Color.fromHSLString('hsl(120, 100, 50)').toHexString()).toBe('#00ff00');
        }

        expect(() => Color.fromHSLString('hsl()')).toThrow();
        expect(() => Color.fromHSLString('hsl(210, 100%)')).toThrow();
        expect(() => Color.fromHSLString('hsl(blah, 100%, 50%)')).toThrow();
    });

    test('fromString routes hsl/hsla', () => {
        {
            const color = Color.fromString('hsl(120, 100%, 50%)');
            expect(color.toHexString()).toBe('#00ff00');
        }
        {
            const color = Color.fromString('hsla(0, 100%, 50%, 0.5)');
            expect(color.toHexString()).toBe('#ff000080');
        }
    });

    test('hsl renders identically to equivalent rgb/hex', () => {
        const pairs: Array<[string, string]> = [
            ['hsl(0, 100%, 50%)', '#ff0000'],
            ['hsl(120, 100%, 50%)', '#00ff00'],
            ['hsl(240, 100%, 50%)', '#0000ff'],
            ['hsl(210, 100%, 50%)', '#007fff'],
            ['hsl(0, 0%, 0%)', '#000000'],
            ['hsl(0, 0%, 100%)', '#ffffff'],
        ];
        for (const [hsl, equivalent] of pairs) {
            expect(Color.fromString(hsl).toHexString()).toBe(Color.fromString(equivalent).toHexString());
        }
    });

    test('validColorString accepts hsl/hsla', () => {
        expect(Color.validColorString('hsl(210, 100%, 50%)')).toBe(true);
        expect(Color.validColorString('hsl(210 100% 50%)')).toBe(true);
        expect(Color.validColorString('hsla(210, 100%, 50%, 0.4)')).toBe(true);
        expect(Color.validColorString('hsl(210 100% 50% / 0.4)')).toBe(true);
        expect(Color.validColorString('hsl()')).toBe(false);
        expect(Color.validColorString('hsl(210, 100%)')).toBe(false);
        expect(Color.validColorString('hsl(blah, 100%, 50%)')).toBe(false);
    });

    test('toHexString', () => {
        {
            const color = new Color(0, 1, 1);
            expect(color.toHexString()).toBe('#00ffff');
        }
        {
            const color = new Color(0, 1, 0);
            expect(color.toHexString()).toBe('#00ff00');
        }
    });
});
