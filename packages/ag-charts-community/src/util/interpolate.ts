import { Color } from './color';

export function interpolateNumber(a: number, b: number) {
    return (d: number) => Number(a) * (1 - d) + Number(b) * d;
}

export function interpolateColor(a: Color | string, b: Color | string) {
    if (typeof a === 'string') {
        try {
            a = Color.fromString(a);
        } catch (e) {
            a = Color.fromArray([0, 0, 0]);
        }
    }
    if (typeof b === 'string') {
        try {
            b = Color.fromString(b);
        } catch (e) {
            b = Color.fromArray([0, 0, 0]);
        }
    }

    return (d: number) => Color.mix(a, b, d).toRgbaString();
}
