import { convertDomain } from '../util/domain.util';
import { LinearScale } from './linearScale';

export class LogScale extends LinearScale {
    readonly log: (n: number) => number;
    readonly pow: (n: number) => number;

    constructor(
        domain: number[],
        range: number[],
        public readonly base: number = 10
    ) {
        super(domain, range);

        const log = LogScale.logMethodByBase(base);
        const pow = LogScale.powMethodByBase(base);

        this.log = (n: number) => (this.domain[0] >= 0 ? log(n) : -log(-n));
        this.pow = (n: number) => (this.domain[0] >= 0 ? pow(n) : -pow(-n));
    }

    override convert(value: number, clamp?: boolean): number {
        return convertDomain(this.log(value), this.domain.map(this.log), this.range, clamp);
    }

    override invert(value: number, clamp?: boolean): number {
        return convertDomain(value, this.range, this.domain, clamp);
    }

    private static logMethodByBase(base: number) {
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
