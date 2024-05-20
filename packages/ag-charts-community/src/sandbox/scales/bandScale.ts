import { BaseScale } from './baseScale';

type DomainType = Date | number | string;

export interface BandScaleOptions {
    align?: number;
    paddingInner?: number;
    paddingOuter?: number;
    round?: boolean;
}

export class BandScale extends BaseScale<DomainType, number> {
    private readonly ordinalRange: number[];

    readonly align: number;
    readonly paddingInner: number;
    readonly paddingOuter: number;
    readonly round: boolean;

    constructor(domain: DomainType[], range: number[], options?: BandScaleOptions) {
        super(domain, range);

        this.align = options?.align ?? 0.5;
        this.paddingInner = options?.paddingInner ?? 0.1;
        this.paddingOuter = options?.paddingOuter ?? 0.1;
        this.round = options?.round ?? false;

        const [r0, r1] = range;
        const step = this.step();

        let start = Math.min(r0, r1) + (Math.abs(r1 - r0) - step * (domain.length - this.paddingInner)) * this.align;

        if (this.round) {
            start = Math.round(start);
        }

        this.ordinalRange = domain.map((_, i) => start + step * i);
    }

    convert(value: DomainType) {
        return this.ordinalRange[this.domain.indexOf(value)];
    }

    invert(value: number) {
        let matchIndex = -1;
        for (const [position, index] of this.ordinalRange.entries()) {
            if (position > value) break;
            matchIndex = index;
        }
        return this.domain[matchIndex];
    }

    bandwidth() {
        const bandwidth = this.step() * (1 - this.paddingInner);
        return this.round ? Math.round(bandwidth) : bandwidth;
    }

    step() {
        const [r0, r1] = this.range;
        const count = this.domain.length;
        const { paddingInner, paddingOuter } = this;
        const step = Math.abs(r1 - r0) / Math.max(1, count - paddingInner + paddingOuter * 2);
        return this.round ? Math.floor(step) : step;
    }

    override reverse() {
        super.reverse();
        this.ordinalRange.reverse();
    }
}
