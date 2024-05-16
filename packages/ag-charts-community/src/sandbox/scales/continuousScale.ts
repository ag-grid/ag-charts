import { niceDomain } from '../util/domain.util';
import { BaseScale } from './baseScale';

export abstract class ContinuousScale<D extends Date | number, R> extends BaseScale<D, R> {
    constructor(domain: D[], range: R[]) {
        super(domain.map(Number).sort((a, b) => a - b) as D[], range);
    }

    niceDomain() {
        return niceDomain(this.domain as number[], {
            ceil: (n) => this.niceCeil(n),
            floor: (n) => this.niceFloor(n),
        });
    }

    protected niceCeil(n: number): number {
        return Math.ceil(n);
    }

    protected niceFloor(n: number): number {
        return Math.floor(n);
    }
}
