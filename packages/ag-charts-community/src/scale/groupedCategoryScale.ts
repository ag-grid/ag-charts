import { CategoryScale } from './categoryScale';
import type { NormalizedDomain } from './scale';

export class GroupedCategoryScale<D, I = number> extends CategoryScale<D, I> {
    override normalizeDomains(...domains: D[][]): NormalizedDomain<D> {
        const { domain } = super.normalizeDomains(...domains);
        return { domain, animatable: false };
    }

    protected override getIndex(value: D) {
        return super.getIndex(value) ?? this.getMatchIndex(value);
    }

    private getMatchIndex(value: D) {
        const key = JSON.stringify(value);
        const match = this._domain.find((d) => JSON.stringify(d) === key);
        if (match != null) {
            return super.getIndex(match);
        }
    }
}
