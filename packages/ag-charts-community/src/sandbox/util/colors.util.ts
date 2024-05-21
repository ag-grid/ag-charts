import { createElement, getDocument } from '../../util/dom';
import { clamp } from '../../util/number';

export type RGBA = { r: number; g: number; b: number; a: number };
export type OKLCH = { l: number; c: number; h: number; a: number };

export function stringToRgba(colorName: string, container = getDocument('body')): RGBA {
    const span = container.appendChild(createElement('span', { color: colorName }));
    const { color } = getComputedStyle(span);
    const [r, g, b, a = 1] = color
        .slice(color.indexOf('(') + 1, -1)
        .split(',')
        .map(Number);
    getDocument('body').removeChild(span);
    return { r, g, b, a };
}

export function rgbaToOklch(r: number, g: number, b: number, a: number = 1): OKLCH {
    // Step 1: Convert RGB to linear sRGB
    const linearR = gammaCorrect(r / 255);
    const linearG = gammaCorrect(g / 255);
    const linearB = gammaCorrect(b / 255);

    // Step 2: Convert linear sRGB to LMS using the matrix
    const lmsL = Math.cbrt(0.4122214708 * linearR + 0.5363325363 * linearG + 0.0514459929 * linearB);
    const lmsM = Math.cbrt(0.2119034982 * linearR + 0.6806995451 * linearG + 0.1073969566 * linearB);
    const lmsS = Math.cbrt(0.0883024619 * linearR + 0.2817188376 * linearG + 0.6299787005 * linearB);

    // Step 3: Convert LMS to OKLab
    const okLabL = 0.2104542553 * lmsL + 0.793617785 * lmsM - 0.0040720468 * lmsS;
    const okLabA = 1.9779984951 * lmsL - 2.428592205 * lmsM + 0.4505937099 * lmsS;
    const okLabB = 0.0259040371 * lmsL + 0.7827717662 * lmsM - 0.808675766 * lmsS;

    // Step 4: Convert OKLab to OKLCH
    const chroma = Math.hypot(okLabA, okLabB);
    const hue = (Math.atan2(okLabB, okLabA) * 180) / Math.PI;

    return { l: okLabL, c: chroma, h: hue >= 0 ? hue : hue + 360, a };
}

export function oklchToRgba(l: number, c: number, h: number, a: number = 1): RGBA {
    // Step 1: Convert OKLCH to OKLab
    const okLabA = c * Math.cos((h * Math.PI) / 180);
    const okLabB = c * Math.sin((h * Math.PI) / 180);

    // Step 2: Convert OKLab to LMS
    const lmsL = (l + 0.3963377774 * okLabA + 0.2158037573 * okLabB) ** 3;
    const lmsM = (l - 0.1055613458 * okLabA - 0.0638541728 * okLabB) ** 3;
    const lmsS = (l - 0.0894841775 * okLabA - 1.291485548 * okLabB) ** 3;

    // Step 3: Convert LMS to linear sRGB
    const linearR = 4.0767416621 * lmsL - 3.3077115913 * lmsM + 0.2309699292 * lmsS;
    const linearG = -1.2684380046 * lmsL + 2.6097574011 * lmsM - 0.3413193965 * lmsS;
    const linearB = -0.0041960863 * lmsL - 0.7034186147 * lmsM + 1.707614701 * lmsS;

    // Step 4: Convert linear sRGB to RGB
    return {
        r: Math.round(clamp(0, gammaCorrect(linearR, true), 1) * 255),
        g: Math.round(clamp(0, gammaCorrect(linearG, true), 1) * 255),
        b: Math.round(clamp(0, gammaCorrect(linearB, true), 1) * 255),
        a,
    };
}

// Helper function for gamma correction between sRGB and linear RGB
function gammaCorrect(channel: number, invert?: boolean): number {
    if (invert) {
        return channel <= 0.0031308 ? 12.92 * channel : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
    }
    return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}
