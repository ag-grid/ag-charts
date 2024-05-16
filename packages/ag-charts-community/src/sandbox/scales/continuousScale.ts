import { niceDomain } from '../util/domain.util';
import { BaseScale } from './baseScale';

export abstract class ContinuousScale<D extends Date | number, R> extends BaseScale<D, R> {
    min = -Infinity;
    max = Infinity;
    nice = false;

    niceDomain() {
        return niceDomain(this.domain.map(Number), { ceil: this.niceCeil, floor: this.niceFloor });
    }

    protected niceCeil(n: number): number {
        return Math.ceil(n);
    }

    protected niceFloor(n: number): number {
        return Math.floor(n);
    }
}
