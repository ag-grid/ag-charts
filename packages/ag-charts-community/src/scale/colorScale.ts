import { Color } from '../util/color';
import { Logger } from '../util/logger';
import type { Scale } from './scale';

type HSLA = { h: number; s: number; l: number; a: number };

const convertColorStringToHsla = (v: string): HSLA => {
    const color = Color.fromString(v);
    const [h, s, l] = Color.RGBtoHSL(color.r, color.g, color.b);
    return { h, s, l, a: color.a };
};

const interpolateHsla = (x: HSLA, y: HSLA, d: number): Color => {
    d = Math.min(Math.max(d, 0), 1);
    let h: number;
    let s: number;
    if (Number.isNaN(x.h) && Number.isNaN(y.h)) {
        h = 0;
        s = 0;
    } else if (Number.isNaN(x.h)) {
        h = y.h;
        s = y.s;
    } else if (Number.isNaN(y.h)) {
        h = x.h;
        s = x.s;
    } else {
        const xH = x.h;
        let yH = y.h;
        const deltaH = y.h - x.h;
        if (deltaH > 180) {
            yH -= 360;
        } else if (deltaH < -180) {
            yH += 360;
        }
        h = xH * (1 - d) + yH * d;
        s = x.s * (1 - d) + y.s * d;
    }

    const l = x.l * (1 - d) + y.l * d;
    const a = x.a * (1 - d) + y.a * d;

    return Color.fromHSL(h, s, l, a);
};

export class ColorScale implements Scale<number, string, number> {
    domain = [0, 1];
    range = ['red', 'blue'];

    private parsedRange = this.range.map(convertColorStringToHsla);

    update() {
        const { domain, range } = this;

        if (domain.length < 2) {
            Logger.warnOnce('`colorDomain` should have at least 2 values.');
            if (domain.length === 0) {
                domain.push(0, 1);
            } else if (domain.length === 1) {
                domain.push(domain[0] + 1);
            }
        }

        for (let i = 1; i < domain.length; i++) {
            const a = domain[i - 1];
            const b = domain[i];
            if (a >= b) {
                Logger.warnOnce('`colorDomain` values should be supplied in ascending order.');
                domain.sort((a, b) => a - b);
                break;
            }
        }

        if (range.length < domain.length) {
            for (let i = range.length; i < domain.length; i++) {
                range.push(range.length > 0 ? range[0] : 'black');
            }
        }

        this.parsedRange = this.range.map(convertColorStringToHsla);
    }

    convert(x: number) {
        const { domain, range, parsedRange } = this;
        const d0 = domain[0];
        const d1 = domain[domain.length - 1];
        const r0 = range[0];
        const r1 = range[range.length - 1];

        if (x <= d0) {
            return r0;
        }

        if (x >= d1) {
            return r1;
        }

        let index: number;
        let q: number;

        if (domain.length === 2) {
            const t = (x - d0) / (d1 - d0);
            const step = 1 / (range.length - 1);
            index = range.length <= 2 ? 0 : Math.min(Math.floor(t * (range.length - 1)), range.length - 2);
            q = (t - index * step) / step;
        } else {
            for (index = 0; index < domain.length - 2; index++) {
                if (x < domain[index + 1]) {
                    break;
                }
            }
            const a = domain[index];
            const b = domain[index + 1];
            q = (x - a) / (b - a);
        }

        const c0 = parsedRange[index];
        const c1 = parsedRange[index + 1];
        return interpolateHsla(c0, c1, q).toRgbaString();
    }
}
