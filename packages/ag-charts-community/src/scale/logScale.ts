import { Logger } from '../util/logger';
import { findRangeExtent, isInteger } from '../util/number';
import { numberFormat } from '../util/numberFormat';
import { createTicks, isDenseInterval, range } from '../util/ticks';
import { isString } from '../util/type-guards';
import { ContinuousScale } from './continuousScale';
import { Invalidating } from './invalidating';

const logFunctions: Record<number, (base: number, value: number) => number> = {
    2: (_base, value) => Math.log2(value),
    [Math.E]: (_base, value) => Math.log(value),
    10: (_base, value) => Math.log10(value),
};

const DEFAULT_LOG = (base: number, x: number) => Math.log(x) / Math.log(base);

function log(base: number, domain: number[], x: number) {
    const start = Math.min(...domain);
    const fn = logFunctions[base] ?? DEFAULT_LOG;
    return start >= 0 ? fn(base, x) : -fn(base, -x);
}

const powFunctions: Record<number, (base: number, value: number) => number> = {
    [Math.E]: (_base, value) => Math.exp(value),
};

const DEFAULT_POW = (base: number, x: number) => base ** x;

function pow(base: number, domain: number[], x: number) {
    const start = Math.min(...domain);
    const fn = powFunctions[base] ?? DEFAULT_POW;
    return start >= 0 ? fn(base, x) : -fn(base, -x);
}

export class LogScale extends ContinuousScale<number> {
    readonly type = 'log';

    public constructor() {
        super([1, 10], [0, 1]);

        // Handling <1 and crossing 0 cases is tricky, easiest solution is to default to clamping.
        this.defaultClamp = true;
    }

    toDomain(d: number): number {
        return d;
    }

    @Invalidating
    base = 10;

    protected override transform(x: any) {
        const start = Math.min(...this.domain);
        return start >= 0 ? Math.log(x) : -Math.log(-x);
    }

    protected override transformInvert(x: any) {
        const start = Math.min(...this.domain);
        return start >= 0 ? Math.exp(x) : -Math.exp(-x);
    }

    protected override refresh(): void {
        if (this.base <= 0) {
            this.base = 0;
            Logger.warnOnce('expecting a finite Number greater than to 0');
        }

        super.refresh();
    }

    update() {
        if (!this.domain || this.domain.length < 2) {
            return;
        }
        if (this.nice) {
            this.updateNiceDomain();
        }
    }

    private readonly log = (x: number) => log(this.base, this.domain, x);
    private readonly pow = (x: number) => pow(this.base, this.domain, x);

    protected updateNiceDomain() {
        this._niceDomain = this.niceDomain(this.domain);
    }

    niceDomain(domain: number[]): number[] {
        const { base } = this;
        const [d0, d1] = domain;

        const roundStart = d0 > d1 ? Math.ceil : Math.floor;
        const roundStop = d0 > d1 ? Math.floor : Math.ceil;

        const n0 = pow(base, domain, roundStart(log(base, domain, d0)));
        const n1 = pow(base, domain, roundStop(log(base, domain, d1)));

        return [n0, n1];
    }

    ticks(): number[] {
        const count = this.tickCount ?? 10;
        if (!this.domain || this.domain.length < 2 || count < 1) {
            return [];
        }
        this.refresh();
        const base = this.base;
        const [d0, d1] = this.getDomain();

        const start = Math.min(d0, d1);
        const stop = Math.max(d0, d1);

        let p0 = this.log(start);
        let p1 = this.log(stop);

        if (this.interval) {
            const inBounds = (tick: number) => tick >= start && tick <= stop;
            const step = Math.min(Math.abs(this.interval), Math.abs(p1 - p0));
            const ticks = range(p0, p1, step).map(this.pow).filter(inBounds);

            if (!isDenseInterval(ticks.length, this.getPixelRange())) {
                return ticks;
            }
        }

        // If base is a float or the difference between p1 and p0 is large,
        // returns ticks in the format [10^1, 10^2, 10^3, 10^4, ...].
        if (!isInteger(base) || p1 - p0 >= count) {
            return createTicks(p0, p1, Math.min(p1 - p0, count)).map(this.pow);
        }

        const ticks: number[] = [];
        const isPositive = start > 0;
        p0 = Math.floor(p0) - 1;
        p1 = Math.round(p1) + 1;

        const availableSpacing = findRangeExtent(this.range) / count;
        let lastTickPosition = Infinity;
        for (let p = p0; p <= p1; p++) {
            const nextMagnitudeTickPosition = this.convert(this.pow(p + 1));
            for (let k = 1; k < base; k++) {
                const q = isPositive ? k : base - k + 1;
                const t = this.pow(p) * q;
                const tickPosition = this.convert(t);
                const prevSpacing = Math.abs(lastTickPosition - tickPosition);
                const nextSpacing = Math.abs(tickPosition - nextMagnitudeTickPosition);
                const fits = prevSpacing >= availableSpacing && nextSpacing >= availableSpacing;
                if (t >= start && t <= stop && (k === 1 || fits || ticks.length === 0)) {
                    ticks.push(t);
                    lastTickPosition = tickPosition;
                }
            }
        }
        return ticks;
    }

    tickFormat({ specifier }: { specifier?: string | ((x: number) => string) }): (x: number) => string {
        specifier ??= this.base === 10 ? '.0e' : ',';
        return isString(specifier) ? numberFormat(specifier) : specifier;
    }
}
