import { convertDomain } from '../util/domain.util';
import { ContinuousScale } from './continuousScale';

export class LinearScale extends ContinuousScale<number, number> {
    convert(value: number, clamp?: boolean) {
        return convertDomain(value, this.domain, this.range, clamp);
    }

    invert(value: number, clamp?: boolean) {
        return convertDomain(value, this.range, this.domain, clamp);
    }
}
