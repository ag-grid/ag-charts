import { Color } from '../util/color';
import { Logger } from '../util/logger';
import { clamp } from '../util/number';
import { Invalidating } from './invalidating';
import type { Scale } from './scale';

type OKLCHA = { l: number; c: number; h: number; a: number };

const convertColorStringToOklcha = (v: string): OKLCHA => {
    const color = Color.fromString(v);
    const [l, c, h] = Color.RGBtoOKLCH(color.r, color.g, color.b);
    return { l, c, h, a: color.a };
};

const delta = 1e-6;
const isAchromatic = (x: OKLCHA) => x.c < delta || x.l < delta || x.l > 1 - delta;
const interpolateOklch = (x: OKLCHA, y: OKLCHA, d: number): Color => {
    d = clamp(0, d, 1);

    let h: number;
    if (isAchromatic(x)) {
        h = y.h;
    } else if (isAchromatic(y)) {
        h = x.h;
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
    }

    const c = x.c * (1 - d) + y.c * d;
    const l = x.l * (1 - d) + y.l * d;
    const a = x.a * (1 - d) + y.a * d;

    return Color.fromOKLCH(l, c, h, a);
};

export class ColorScale implements Scale<number, string, number> {
    readonly type = 'color';
    protected invalid = true;

    @Invalidating
    domain = [0, 1];
    @Invalidating
    range = ['red', 'blue'];

    private parsedRange = this.range.map(convertColorStringToOklcha);

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
                domain.sort((a2, b2) => a2 - b2);
                break;
            }
        }

        if (range.length < domain.length) {
            for (let i = range.length; i < domain.length; i++) {
                range.push(range.length > 0 ? range[0] : 'black');
            }
        }

        this.parsedRange = this.range.map(convertColorStringToOklcha);
    }

    convert(x: number) {
        this.refresh();

        const { domain, range, parsedRange } = this;
        const d0 = domain[0];
        const d1 = domain.at(-1)!;
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
        return interpolateOklch(c0, c1, q).toRgbaString();
    }

    protected refresh() {
        if (!this.invalid) return;

        this.invalid = false;
        this.update();

        if (this.invalid) {
            Logger.warnOnce('Expected update to not invalidate scale');
        }
    }
}
