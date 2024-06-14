import { clamp } from './number';

export interface IColor {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;
}

const lerp = (x: number, y: number, t: number) => x * (1 - t) + y * t;

const srgbToLinear = (value: number) => {
    const sign = value < 0 ? -1 : 1;
    const abs = Math.abs(value);

    if (abs <= 0.04045) return value / 12.92;

    return sign * ((abs + 0.055) / 1.055) ** 2.4;
};

const srgbFromLinear = (value: number) => {
    const sign = value < 0 ? -1 : 1;
    const abs = Math.abs(value);

    if (abs > 0.0031308) {
        return sign * (1.055 * abs ** (1 / 2.4) - 0.055);
    }

    return 12.92 * value;
};

export class Color implements IColor {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;

    /**
     * Every color component should be in the [0, 1] range.
     * Some easing functions (such as elastic easing) can overshoot the target value by some amount.
     * So, when animating colors, if the source or target color components are already near
     * or at the edge of the allowed [0, 1] range, it is possible for the intermediate color
     * component value to end up outside of that range mid-animation. For this reason the constructor
     * performs range checking/constraining.
     * @param r Red component.
     * @param g Green component.
     * @param b Blue component.
     * @param a Alpha (opacity) component.
     */
    constructor(r: number, g: number, b: number, a: number = 1) {
        // NaN is treated as 0
        this.r = clamp(0, r || 0, 1);
        this.g = clamp(0, g || 0, 1);
        this.b = clamp(0, b || 0, 1);
        this.a = clamp(0, a || 0, 1);
    }

    /**
     * A color string can be in one of the following formats to be valid:
     * - #rgb
     * - #rrggbb
     * - rgb(r, g, b)
     * - rgba(r, g, b, a)
     * - CSS color name such as 'white', 'orange', 'cyan', etc.
     */
    static validColorString(str: string): boolean {
        if (str.indexOf('#') >= 0) {
            return !!Color.parseHex(str);
        }

        if (str.indexOf('rgb') >= 0) {
            return !!Color.stringToRgba(str);
        }

        return !!Color.nameToHex[str.toLowerCase()];
    }

    /**
     * The given string can be in one of the following formats:
     * - #rgb
     * - #rrggbb
     * - rgb(r, g, b)
     * - rgba(r, g, b, a)
     * - CSS color name such as 'white', 'orange', 'cyan', etc.
     * @param str
     */
    static fromString(str: string): Color {
        // hexadecimal notation
        if (str.indexOf('#') >= 0) {
            // there can be some leading whitespace
            return Color.fromHexString(str);
        }

        // color name
        const hex = Color.nameToHex[str.toLowerCase()];
        if (hex) {
            return Color.fromHexString(hex);
        }

        // rgb(a) notation
        if (str.indexOf('rgb') >= 0) {
            return Color.fromRgbaString(str);
        }

        throw new Error(`Invalid color string: '${str}'`);
    }

    // See https://drafts.csswg.org/css-color/#hex-notation
    static parseHex(input: string): [number, number, number, number] | undefined {
        input = input.replace(/ /g, '').slice(1);
        let parts: any;

        switch (input.length) {
            case 6:
            case 8:
                parts = [];
                for (let i = 0; i < input.length; i += 2) {
                    parts.push(parseInt(`${input[i]}${input[i + 1]}`, 16));
                }
                break;
            case 3:
            case 4:
                parts = input
                    .split('')
                    .map((p) => parseInt(p, 16))
                    .map((p) => p + p * 16);
                break;
        }

        if (parts?.length >= 3 && parts.every((p: number) => p >= 0)) {
            if (parts.length === 3) {
                parts.push(255);
            }
            return parts;
        }
    }

    static fromHexString(str: string): Color {
        const values = Color.parseHex(str);
        if (values) {
            const [r, g, b, a] = values;
            return new Color(r / 255, g / 255, b / 255, a / 255);
        }

        throw new Error(`Malformed hexadecimal color string: '${str}'`);
    }

    private static stringToRgba(str: string): number[] | undefined {
        // Find positions of opening and closing parentheses.
        let po = -1;
        let pc = -1;
        for (let i = 0; i < str.length; i++) {
            const c = str[i];
            if (po === -1 && c === '(') {
                po = i;
            } else if (c === ')') {
                pc = i;
                break;
            }
        }

        if (po === -1 || pc === -1) return;

        const contents = str.substring(po + 1, pc);
        const parts = contents.split(',');
        const rgba: number[] = [];

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            let value = parseFloat(part);
            if (!Number.isFinite(value)) {
                return;
            }
            if (part.indexOf('%') >= 0) {
                // percentage r, g, or b value
                value = clamp(0, value, 100);
                value /= 100;
            } else if (i === 3) {
                // alpha component
                value = clamp(0, value, 1);
            } else {
                // absolute r, g, or b value
                value = clamp(0, value, 255);
                value /= 255;
            }
            rgba.push(value);
        }

        return rgba;
    }

    static fromRgbaString(str: string): Color {
        const rgba = Color.stringToRgba(str);

        if (rgba) {
            if (rgba.length === 3) {
                return new Color(rgba[0], rgba[1], rgba[2]);
            } else if (rgba.length === 4) {
                return new Color(rgba[0], rgba[1], rgba[2], rgba[3]);
            }
        }

        throw new Error(`Malformed rgb/rgba color string: '${str}'`);
    }

    static fromArray(arr: [number, number, number] | [number, number, number, number]): Color {
        if (arr.length === 4) {
            return new Color(arr[0], arr[1], arr[2], arr[3]);
        }
        if (arr.length === 3) {
            return new Color(arr[0], arr[1], arr[2]);
        }
        throw new Error('The given array should contain 3 or 4 color components (numbers).');
    }

    static fromHSB(h: number, s: number, b: number, alpha = 1): Color {
        const rgb = Color.HSBtoRGB(h, s, b);
        return new Color(rgb[0], rgb[1], rgb[2], alpha);
    }

    static fromHSL(h: number, s: number, l: number, alpha = 1): Color {
        const rgb = Color.HSLtoRGB(h, s, l);
        return new Color(rgb[0], rgb[1], rgb[2], alpha);
    }

    static fromOKLCH(l: number, c: number, h: number, alpha = 1): Color {
        const rgb = Color.OKLCHtoRGB(l, c, h);
        return new Color(rgb[0], rgb[1], rgb[2], alpha);
    }

    private static padHex(str: string): string {
        // Can't use `padStart(2, '0')` here because of IE.
        return str.length === 1 ? '0' + str : str;
    }

    toHexString(): string {
        let hex =
            '#' +
            Color.padHex(Math.round(this.r * 255).toString(16)) +
            Color.padHex(Math.round(this.g * 255).toString(16)) +
            Color.padHex(Math.round(this.b * 255).toString(16));

        if (this.a < 1) {
            hex += Color.padHex(Math.round(this.a * 255).toString(16));
        }

        return hex;
    }

    toRgbaString(fractionDigits = 3): string {
        const components: number[] = [Math.round(this.r * 255), Math.round(this.g * 255), Math.round(this.b * 255)];

        const k = Math.pow(10, fractionDigits);

        if (this.a !== 1) {
            components.push(Math.round(this.a * k) / k);
            return `rgba(${components.join(', ')})`;
        }

        return `rgb(${components.join(', ')})`;
    }

    toString(): string {
        if (this.a === 1) {
            return this.toHexString();
        }
        return this.toRgbaString();
    }

    toHSB(): [number, number, number] {
        return Color.RGBtoHSB(this.r, this.g, this.b);
    }

    static RGBtoOKLCH(r: number, g: number, b: number): [number, number, number] {
        const LSRGB0 = srgbToLinear(r);
        const LSRGB1 = srgbToLinear(g);
        const LSRGB2 = srgbToLinear(b);

        const LMS0 = Math.cbrt(0.4122214708 * LSRGB0 + 0.5363325363 * LSRGB1 + 0.0514459929 * LSRGB2);
        const LMS1 = Math.cbrt(0.2119034982 * LSRGB0 + 0.6806995451 * LSRGB1 + 0.1073969566 * LSRGB2);
        const LMS2 = Math.cbrt(0.0883024619 * LSRGB0 + 0.2817188376 * LSRGB1 + 0.6299787005 * LSRGB2);

        const OKLAB0 = 0.2104542553 * LMS0 + 0.793617785 * LMS1 - 0.0040720468 * LMS2;
        const OKLAB1 = 1.9779984951 * LMS0 - 2.428592205 * LMS1 + 0.4505937099 * LMS2;
        const OKLAB2 = 0.0259040371 * LMS0 + 0.7827717662 * LMS1 - 0.808675766 * LMS2;

        const hue = (Math.atan2(OKLAB2, OKLAB1) * 180) / Math.PI;
        const OKLCH0 = OKLAB0;
        const OKLCH1 = Math.hypot(OKLAB1, OKLAB2);
        const OKLCH2 = hue >= 0 ? hue : hue + 360;

        return [OKLCH0, OKLCH1, OKLCH2];
    }

    static OKLCHtoRGB(l: number, c: number, h: number): [number, number, number] {
        const OKLAB0 = l;
        const OKLAB1 = c * Math.cos((h * Math.PI) / 180);
        const OKLAB2 = c * Math.sin((h * Math.PI) / 180);

        const LMS0 = (OKLAB0 + 0.3963377774 * OKLAB1 + 0.2158037573 * OKLAB2) ** 3;
        const LMS1 = (OKLAB0 - 0.1055613458 * OKLAB1 - 0.0638541728 * OKLAB2) ** 3;
        const LMS2 = (OKLAB0 - 0.0894841775 * OKLAB1 - 1.291485548 * OKLAB2) ** 3;

        const LSRGB0 = 4.0767416621 * LMS0 - 3.3077115913 * LMS1 + 0.2309699292 * LMS2;
        const LSRGB1 = -1.2684380046 * LMS0 + 2.6097574011 * LMS1 - 0.3413193965 * LMS2;
        const LSRGB2 = -0.0041960863 * LMS0 - 0.7034186147 * LMS1 + 1.707614701 * LMS2;

        const SRGB0 = srgbFromLinear(LSRGB0);
        const SRGB1 = srgbFromLinear(LSRGB1);
        const SRGB2 = srgbFromLinear(LSRGB2);

        return [SRGB0, SRGB1, SRGB2];
    }

    static RGBtoHSL(r: number, g: number, b: number): [number, number, number] {
        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);

        const l = (max + min) / 2;

        let h: number;
        let s: number;
        if (max === min) {
            // Achromatic
            h = 0;
            s = 0;
        } else {
            const delta = max - min;

            s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

            if (max === r) {
                h = (g - b) / delta + (g < b ? 6 : 0);
            } else if (max === g) {
                h = (b - r) / delta + 2;
            } else {
                h = (r - g) / delta + 4;
            }
            h *= 360 / 6;
        }

        return [h, s, l];
    }

    static HSLtoRGB(h: number, s: number, l: number): [number, number, number] {
        h = ((h % 360) + 360) % 360; // normalize hue to [0, 360] interval

        if (s === 0) {
            // Achromatic
            return [l, l, l];
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        function hueToRgb(t: number) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        const r = hueToRgb(h / 360 + 1 / 3);
        const g = hueToRgb(h / 360);
        const b = hueToRgb(h / 360 - 1 / 3);

        return [r, g, b];
    }

    /**
     * Converts the given RGB triple to an array of HSB (HSV) components.
     */
    static RGBtoHSB(r: number, g: number, b: number): [number, number, number] {
        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);

        const S = max === 0 ? 0 : (max - min) / max;
        let H = 0;

        // min == max, means all components are the same
        // and the color is a shade of gray with no hue
        if (min !== max) {
            const delta = max - min;
            const rc = (max - r) / delta;
            const gc = (max - g) / delta;
            const bc = (max - b) / delta;
            if (r === max) {
                H = bc - gc;
            } else if (g === max) {
                H = 2.0 + rc - bc;
            } else {
                H = 4.0 + gc - rc;
            }
            H /= 6.0;
            if (H < 0) {
                H = H + 1.0;
            }
        }

        return [H * 360, S, max];
    }

    /**
     * Converts the given HSB (HSV) triple to an array of RGB components.
     */
    static HSBtoRGB(H: number, S: number, B: number): [number, number, number] {
        H = (((H % 360) + 360) % 360) / 360; // normalize hue to [0, 360] interval, then scale to [0, 1]

        let r = 0;
        let g = 0;
        let b = 0;

        if (S === 0) {
            r = g = b = B;
        } else {
            const h = (H - Math.floor(H)) * 6;
            const f = h - Math.floor(h);
            const p = B * (1 - S);
            const q = B * (1 - S * f);
            const t = B * (1 - S * (1 - f));
            switch (
                h >> 0 // discard the floating point part of the number
            ) {
                case 0:
                    r = B;
                    g = t;
                    b = p;
                    break;
                case 1:
                    r = q;
                    g = B;
                    b = p;
                    break;
                case 2:
                    r = p;
                    g = B;
                    b = t;
                    break;
                case 3:
                    r = p;
                    g = q;
                    b = B;
                    break;
                case 4:
                    r = t;
                    g = p;
                    b = B;
                    break;
                case 5:
                    r = B;
                    g = p;
                    b = q;
                    break;
            }
        }
        return [r, g, b];
    }

    static mix(c0: Color, c1: Color, t: number) {
        return new Color(lerp(c0.r, c1.r, t), lerp(c0.g, c1.g, t), lerp(c0.b, c1.b, t), lerp(c0.a, c1.a, t));
    }

    /**
     * CSS Color Module Level 4:
     * https://drafts.csswg.org/css-color/#named-colors
     */
    private static readonly nameToHex: Record<string, string> = {
        // @ts-expect-error
        __proto__: null,
        aliceblue: '#F0F8FF',
        antiquewhite: '#FAEBD7',
        aqua: '#00FFFF',
        aquamarine: '#7FFFD4',
        azure: '#F0FFFF',
        beige: '#F5F5DC',
        bisque: '#FFE4C4',
        black: '#000000',
        blanchedalmond: '#FFEBCD',
        blue: '#0000FF',
        blueviolet: '#8A2BE2',
        brown: '#A52A2A',
        burlywood: '#DEB887',
        cadetblue: '#5F9EA0',
        chartreuse: '#7FFF00',
        chocolate: '#D2691E',
        coral: '#FF7F50',
        cornflowerblue: '#6495ED',
        cornsilk: '#FFF8DC',
        crimson: '#DC143C',
        cyan: '#00FFFF',
        darkblue: '#00008B',
        darkcyan: '#008B8B',
        darkgoldenrod: '#B8860B',
        darkgray: '#A9A9A9',
        darkgreen: '#006400',
        darkgrey: '#A9A9A9',
        darkkhaki: '#BDB76B',
        darkmagenta: '#8B008B',
        darkolivegreen: '#556B2F',
        darkorange: '#FF8C00',
        darkorchid: '#9932CC',
        darkred: '#8B0000',
        darksalmon: '#E9967A',
        darkseagreen: '#8FBC8F',
        darkslateblue: '#483D8B',
        darkslategray: '#2F4F4F',
        darkslategrey: '#2F4F4F',
        darkturquoise: '#00CED1',
        darkviolet: '#9400D3',
        deeppink: '#FF1493',
        deepskyblue: '#00BFFF',
        dimgray: '#696969',
        dimgrey: '#696969',
        dodgerblue: '#1E90FF',
        firebrick: '#B22222',
        floralwhite: '#FFFAF0',
        forestgreen: '#228B22',
        fuchsia: '#FF00FF',
        gainsboro: '#DCDCDC',
        ghostwhite: '#F8F8FF',
        gold: '#FFD700',
        goldenrod: '#DAA520',
        gray: '#808080',
        green: '#008000',
        greenyellow: '#ADFF2F',
        grey: '#808080',
        honeydew: '#F0FFF0',
        hotpink: '#FF69B4',
        indianred: '#CD5C5C',
        indigo: '#4B0082',
        ivory: '#FFFFF0',
        khaki: '#F0E68C',
        lavender: '#E6E6FA',
        lavenderblush: '#FFF0F5',
        lawngreen: '#7CFC00',
        lemonchiffon: '#FFFACD',
        lightblue: '#ADD8E6',
        lightcoral: '#F08080',
        lightcyan: '#E0FFFF',
        lightgoldenrodyellow: '#FAFAD2',
        lightgray: '#D3D3D3',
        lightgreen: '#90EE90',
        lightgrey: '#D3D3D3',
        lightpink: '#FFB6C1',
        lightsalmon: '#FFA07A',
        lightseagreen: '#20B2AA',
        lightskyblue: '#87CEFA',
        lightslategray: '#778899',
        lightslategrey: '#778899',
        lightsteelblue: '#B0C4DE',
        lightyellow: '#FFFFE0',
        lime: '#00FF00',
        limegreen: '#32CD32',
        linen: '#FAF0E6',
        magenta: '#FF00FF',
        maroon: '#800000',
        mediumaquamarine: '#66CDAA',
        mediumblue: '#0000CD',
        mediumorchid: '#BA55D3',
        mediumpurple: '#9370DB',
        mediumseagreen: '#3CB371',
        mediumslateblue: '#7B68EE',
        mediumspringgreen: '#00FA9A',
        mediumturquoise: '#48D1CC',
        mediumvioletred: '#C71585',
        midnightblue: '#191970',
        mintcream: '#F5FFFA',
        mistyrose: '#FFE4E1',
        moccasin: '#FFE4B5',
        navajowhite: '#FFDEAD',
        navy: '#000080',
        oldlace: '#FDF5E6',
        olive: '#808000',
        olivedrab: '#6B8E23',
        orange: '#FFA500',
        orangered: '#FF4500',
        orchid: '#DA70D6',
        palegoldenrod: '#EEE8AA',
        palegreen: '#98FB98',
        paleturquoise: '#AFEEEE',
        palevioletred: '#DB7093',
        papayawhip: '#FFEFD5',
        peachpuff: '#FFDAB9',
        peru: '#CD853F',
        pink: '#FFC0CB',
        plum: '#DDA0DD',
        powderblue: '#B0E0E6',
        purple: '#800080',
        rebeccapurple: '#663399',
        red: '#FF0000',
        rosybrown: '#BC8F8F',
        royalblue: '#4169E1',
        saddlebrown: '#8B4513',
        salmon: '#FA8072',
        sandybrown: '#F4A460',
        seagreen: '#2E8B57',
        seashell: '#FFF5EE',
        sienna: '#A0522D',
        silver: '#C0C0C0',
        skyblue: '#87CEEB',
        slateblue: '#6A5ACD',
        slategray: '#708090',
        slategrey: '#708090',
        snow: '#FFFAFA',
        springgreen: '#00FF7F',
        steelblue: '#4682B4',
        tan: '#D2B48C',
        teal: '#008080',
        thistle: '#D8BFD8',
        tomato: '#FF6347',
        transparent: '#00000000',
        turquoise: '#40E0D0',
        violet: '#EE82EE',
        wheat: '#F5DEB3',
        white: '#FFFFFF',
        whitesmoke: '#F5F5F5',
        yellow: '#FFFF00',
        yellowgreen: '#9ACD32',
    };
}
