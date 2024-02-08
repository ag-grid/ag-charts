import type { IColor } from './color';
import { Color } from './color';

export function interpolateNumber(a: number, b: number) {
    return (d: number) => Number(a) * (1 - d) + Number(b) * d;
}

export function interpolateColor(a: IColor | string, b: IColor | string) {
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

    const red = interpolateNumber(a.r, b.r);
    const green = interpolateNumber(a.g, b.g);
    const blue = interpolateNumber(a.b, b.b);
    const alpha = interpolateNumber(a.a, b.a);

    return (d: number) => Color.fromArray([red(d), green(d), blue(d), alpha(d)]).toRgbaString();
}
