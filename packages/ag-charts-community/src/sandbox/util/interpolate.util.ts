import { clamp } from '../../util/number';
import type { OKLCH } from './colors.util';

export function interpolateNumber(a: number, b: number) {
    return (d: number) => Number(a) * (1 - d) + Number(b) * d;
}

export function interpolateColor(a: OKLCH, b: OKLCH) {
    return (d: number) => {
        d = clamp(0, d, 1);
        let c: number, h: number;
        const l = a.l * (1 - d) + b.l * d;
        if (Number.isNaN(a.h) && Number.isNaN(b.h)) {
            c = 0;
            h = 0;
        } else if (Number.isNaN(a.h)) {
            c = b.c;
            h = b.h;
        } else if (Number.isNaN(b.h)) {
            c = a.c;
            h = a.h;
        } else {
            let bH = b.h;
            const deltaH = b.h - a.h;
            if (deltaH > 180) {
                bH -= 360;
            } else if (deltaH < -180) {
                bH += 360;
            }
            c = a.c * (1 - d) + b.c * d;
            h = a.h * (1 - d) + bH * d;
        }

        return { l, c, h, a: a.a * (1 - d) + b.a * d };
    };
}
