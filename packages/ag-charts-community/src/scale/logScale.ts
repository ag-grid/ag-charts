import { identity } from '../util/function';
import { Logger } from '../util/logger';
import { findRangeExtent } from '../util/number';
import { numberFormat } from '../util/numberFormat';
import { createTicks, isDenseInterval, range } from '../util/ticks';
import { isString } from '../util/type-guards';
import { ContinuousScale } from './continuousScale';
import { Invalidating } from './invalidating';

export class LogScale extends ContinuousScale<number> {
    readonly type = 'log';

    public constructor() {
        super([1, 10], [0, 1]);

        // Handling <1 and crossing 0 cases is tricky, easiest solution is to default to clamping.
        this.defaultClampMode = 'clamped';
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
        this.baseLog = LogScale.getBaseLogMethod(this.base);
        this.basePow = LogScale.getBasePowerMethod(this.base);
        if (this.nice) {
            this.updateNiceDomain();
        }
    }

    private baseLog: (x: number) => number = identity;
    private basePow: (x: number) => number = identity;

    private readonly log = (x: number) => {
        const start = Math.min(...this.domain);
        return start >= 0 ? this.baseLog(x) : -this.baseLog(-x);
    };

    private readonly pow = (x: number) => {
        const start = Math.min(...this.domain);
        return start >= 0 ? this.basePow(x) : -this.basePow(-x);
    };

    protected updateNiceDomain() {
        const [d0, d1] = this.domain;

        const roundStart = d0 > d1 ? Math.ceil : Math.floor;
        const roundStop = d0 > d1 ? Math.floor : Math.ceil;

        const n0 = this.pow(roundStart(this.log(d0)));
        const n1 = this.pow(roundStop(this.log(d1)));
        this.niceDomain = [n0, n1];
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

        const isBaseInteger = base % 1 === 0;
        const isDiffLarge = p1 - p0 >= count;

        if (!isBaseInteger || isDiffLarge) {
            // Returns [10^1, 10^2, 10^3, 10^4, ...]
            // eslint-disable-next-line prefer-const
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

    tickFormat({
        count,
        ticks,
        specifier,
    }: {
        count?: any;
        ticks?: any[];
        specifier?: string | ((x: number) => string);
    }): (x: number) => string {
        if (count !== Infinity && ticks == null) {
            this.ticks();
        }

        specifier ??= this.base === 10 ? '.0e' : ',';
        return isString(specifier) ? numberFormat(specifier) : specifier;
    }

    static getBaseLogMethod(base: number) {
        switch (base) {
            case 10:
                return Math.log10;
            case Math.E:
                return Math.log;
            case 2:
                return Math.log2;
            default:
                const logBase = Math.log(base);
                return (x: number) => Math.log(x) / logBase;
        }
    }

    static getBasePowerMethod(base: number) {
        switch (base) {
            case 10:
                return (x: number) => (x >= 0 ? 10 ** x : 1 / 10 ** -x);
            case Math.E:
                return Math.exp;
            default:
                return (x: number) => base ** x;
        }
    }
}
