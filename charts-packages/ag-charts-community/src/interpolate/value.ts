import number from './number';
import color from './color';
import { Color } from '../util/color';

export default function (a: any, b: any): (t: number) => any {
    const t = typeof b;
    let c: Color;

    if (t === 'number') {
        return number(a, b);
    }

    if (t === 'string') {
        try {
            c = Color.fromString(b);
            b = c;
            return color(a, b);
        } catch (e) {}
    }

    throw new Error('Unable to interpolate values');
}
