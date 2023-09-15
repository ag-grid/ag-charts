import { interpolateColor, interpolateNumber } from '../animte/interpolate';

export function interpolateValue(a: any, b: any): (t: number) => any {
    try {
        switch (typeof b) {
            case 'number':
                return interpolateNumber(a, b);
            case 'string':
                return interpolateColor(a, b);
        }
    } catch (e) {
        // Error-case handled below.
    }
    throw new Error('Unable to interpolate values');
}
