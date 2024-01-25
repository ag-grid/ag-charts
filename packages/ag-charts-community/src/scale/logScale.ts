import { Logger } from '../util/logger';
import { findRangeExtent } from '../util/number';
import { format } from '../util/numberFormat';
import generateTicks, { createNumericTicks, range } from '../util/ticks';
import { ContinuousScale } from './continuousScale';
import { Invalidating } from './invalidating';

const identity = (x: any) => x;

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
        const start = Math.min(this.domain[0], this.domain[1]);
        return start >= 0 ? Math.log(x) : -Math.log(-x);
    }
    protected override transformInvert(x: any) {
        const start = Math.min(this.domain[0], this.domain[1]);
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
        this.updateLogFn();
        this.updatePowFn();
        if (this.nice) {
            this.updateNiceDomain();
        }
    }

    private baseLog: (x: number) => number = identity;
    private basePow: (x: number) => number = identity;

    private log = (x: number) => {
        const start = Math.min(this.domain[0], this.domain[1]);

        return start >= 0 ? this.baseLog(x) : -this.baseLog(-x);
    };

    private pow = (x: number) => {
        const start = Math.min(this.domain[0], this.domain[1]);
        return start >= 0 ? this.basePow(x) : -this.basePow(-x);
    };

    private updateLogFn() {
        const { base } = this;
        let log: (x: number) => number;
        if (base === 10) {
            log = Math.log10;
        } else if (base === Math.E) {
            log = Math.log;
        } else if (base === 2) {
            log = Math.log2;
        } else {
            const logBase = Math.log(base);
            log = (x) => Math.log(x) / logBase;
        }
        this.baseLog = log;
    }

    private updatePowFn() {
        const { base } = this;
        let pow: (x: number) => number;
        if (base === 10) {
            pow = LogScale.pow10;
        } else if (base === Math.E) {
            pow = Math.exp;
        } else {
            pow = (x) => Math.pow(base, x);
        }
        this.basePow = pow;
    }

    protected updateNiceDomain() {
        const [d0, d1] = this.domain;

        const roundStart = d0 > d1 ? Math.ceil : Math.floor;
        const roundStop = d1 < d0 ? Math.floor : Math.ceil;

        const n0 = this.pow(roundStart(this.log(d0)));
        const n1 = this.pow(roundStop(this.log(d1)));
        this.niceDomain = [n0, n1];
    }

    static pow10(x: number): number {
        return x >= 0 ? Math.pow(10, x) : 1 / Math.pow(10, -x);
    }

    ticks() {
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
            const step = Math.abs(this.interval);
            const absDiff = Math.abs(p1 - p0);
            let ticks = range(p0, p1, Math.min(absDiff, step));
            ticks = createNumericTicks(
                ticks.fractionDigits,
                ticks.map((x) => this.pow(x)).filter((t) => t >= start && t <= stop)
            );

            if (!this.isDenseInterval({ start, stop, interval: step, count: ticks.length })) {
                return ticks;
            }
        }

        const isBaseInteger = base % 1 === 0;
        const isDiffLarge = p1 - p0 >= count;

        if (!isBaseInteger || isDiffLarge) {
            // Returns [10^1, 10^2, 10^3, 10^4, ...]
            let ticks = generateTicks(p0, p1, Math.min(p1 - p0, count));
            ticks = createNumericTicks(
                ticks.fractionDigits,
                ticks.map((x) => this.pow(x))
            );
            return ticks;
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
                if (t >= start && t <= stop && (k === 1 || fits)) {
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
        const { base } = this;

        if (specifier == null) {
            specifier = base === 10 ? '.0e' : ',';
        }

        if (typeof specifier === 'string') {
            specifier = format(specifier);
        }

        if (count === Infinity) {
            return specifier;
        }

        if (ticks == null) {
            this.ticks();
        }

        return (d) => {
            return (specifier as (x: number) => string)(d);
        };
    }
}
