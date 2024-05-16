import { convertDomain } from '../util/domain.util';
import { ContinuousScale } from './continuousScale';

export class TimeScale extends ContinuousScale<Date | number, number> {
    constructor(domain: (Date | number)[], range: number[]) {
        super(domain.map(Number), range);
    }

    convert(value: Date | number, clamp?: boolean) {
        return convertDomain(Number(value), this.domain as number[], this.range, clamp);
    }

    invert(value: number, clamp?: boolean) {
        return new Date(convertDomain(value, this.range, this.domain as number[], clamp));
    }
}
