import { ContinuousScale } from './continuousScale';
import generateTicks, { range } from '../util/ticks';
import { format } from '../util/numberFormat';
import { NUMBER, Validate } from '../util/validation';

const identity = (x: any) => x;

export class LogScale extends ContinuousScale<number> {
    readonly type = 'log';

    public constructor() {
        super([1, 10], [0, 1]);
    }

    toDomain(d: number): number {
        return d;
    }

    @Validate(NUMBER(0))
    base = 10;

    protected transform(x: any) {
        return this.domain[0] >= 0 ? Math.log(x) : -Math.log(-x);
    }
    protected transformInvert(x: any) {
        return this.domain[0] >= 0 ? Math.exp(x) : -Math.exp(-x);
    }

    protected cacheProps: Array<keyof this> = ['domain', 'range', 'nice', 'tickCount', 'base'];

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
        return this.domain[0] >= 0 ? this.baseLog(x) : -this.baseLog(-x);
    };

    private pow = (x: number) => {
        return this.domain[0] >= 0 ? this.basePow(x) : -this.basePow(-x);
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

        const n0 = this.pow(Math.floor(this.log(d0)));
        const n1 = this.pow(Math.ceil(this.log(d1)));
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

        let p0 = this.log(d0);
        let p1 = this.log(d1);

        if (this.interval) {
            const step = Math.abs(this.interval);
            const absDiff = Math.abs(p1 - p0);
            const ticks = range(p0, p1, Math.min(absDiff, step))
                .map((x) => this.pow(x))
                .filter((t) => t >= d0 && t <= d1);

            if (!this.isDenseInterval({ start: d0, stop: d1, interval: step, count: ticks.length })) {
                return ticks;
            }
        }

        const isBaseInteger = base % 1 === 0;
        const isDiffLarge = p1 - p0 >= count;

        if (!isBaseInteger || isDiffLarge) {
            // Returns [10^1, 10^2, 10^3, 10^4, ...]
            return generateTicks(p0, p1, Math.min(p1 - p0, count)).map((x) => this.pow(x));
        }

        const ticks: number[] = [];
        const isPositive = d0 > 0;
        p0 = Math.floor(p0) - 1;
        p1 = Math.round(p1) + 1;

        const min = Math.min(...this.range);
        const max = Math.max(...this.range);

        const availableSpacing = (max - min) / count;
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
                if (t >= d0 && t <= d1 && (k === 1 || fits)) {
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
            specifier = (base === 10 ? '.0e' : ',') as any;
        }

        if (typeof specifier !== 'function') {
            specifier = format(specifier as string);
        }

        if (count === Infinity) {
            return specifier;
        }

        if (count == null) {
            count = 10;
        }

        ticks = ticks ?? this.ticks();

        return (d) => {
            return (specifier as (x: number) => string)(d);
        };
    }
}
