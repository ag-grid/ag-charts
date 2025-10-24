import type { NormalizedDomain } from 'ag-charts-core';

import { CategoryScale } from './categoryScale';

export class GroupedCategoryScale<D, I = number> extends CategoryScale<D, I> {
    static override is(value: unknown): value is GroupedCategoryScale<any, any> {
        return value instanceof GroupedCategoryScale;
    }

    override normalizeDomains(...domains: D[][]): NormalizedDomain<D> {
        const { domain } = super.normalizeDomains(...domains);
        return { domain, animatable: false };
    }

    override findIndex(value: D) {
        return super.findIndex(value) ?? this.getMatchIndex(value);
    }

    private getMatchIndex(value: D) {
        const key = JSON.stringify(value);
        const match = this._domain.find((d) => JSON.stringify(d) === key);
        if (match != null) {
            return super.findIndex(match);
        }
    }
}
