import { convertDomain } from '../util/domain.util';
import { ContinuousScale } from './continuousScale';

export class LogScale extends ContinuousScale<number, number> {
    private readonly log: (n: number) => number;
    private readonly pow: (n: number) => number;

    constructor(
        domain: number[],
        range: number[],
        public readonly base: number = 10
    ) {
        if (domain[0] <= 0 && domain[1] >= 0) {
            throw new Error('Log scale domain must be strictly-positive or strictly-negative.');
        }

        super(domain, range);

        const isPositive = this.domain[0] >= 0;
        const log = LogScale.logMethodByBase(base);
        const pow = LogScale.powMethodByBase(base);

        this.log = isPositive ? log : (n: number) => -log(-n);
        this.pow = isPositive ? pow : (n: number) => -pow(-n);
    }

    override niceCeil(n: number): number {
        return this.pow(super.niceCeil(this.log(n)));
    }

    override niceFloor(n: number): number {
        return this.pow(super.niceFloor(this.log(n)));
    }

    override convert(value: number, clamp?: boolean): number {
        return convertDomain(this.log(value), this.domain.map(this.log), this.range, clamp);
    }

    override invert(value: number, clamp?: boolean): number {
        return this.pow(convertDomain(value, this.range, this.domain.map(this.log), clamp));
    }

    private static logMethodByBase(base: number) {
        switch (base) {
            case 10:
                return Math.log10;
            case 2:
                return Math.log2;
            case Math.E:
                return Math.log;
            default:
                const logBase = Math.log(base);
                return (x: number) => Math.log(x) / logBase;
        }
    }

    private static powMethodByBase(base: number) {
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
