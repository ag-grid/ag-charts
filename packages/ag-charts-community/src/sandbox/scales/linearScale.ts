import { convertDomain } from '../util/domain.util';
import { BaseScale } from './baseScale';

export class LinearScale extends BaseScale<number, number> {
    nice = false;

    convert(value: number, clamp?: boolean) {
        return convertDomain(value, this.domain, this.range, clamp);
    }

    invert(value: number, clamp?: boolean) {
        return convertDomain(value, this.range, this.domain, clamp);
    }
}
