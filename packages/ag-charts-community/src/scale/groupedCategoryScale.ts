import type { DomainWithMetadata, NormalizedDomain } from 'ag-charts-core';

import { CategoryScale } from './categoryScale';

// Matches MAX_ANIMATABLE_NODES in processors.ts - domains larger than this won't animate anyway
const MAX_ANIMATABLE_NODES = 1000;

export class GroupedCategoryScale<D, I = number> extends CategoryScale<D, I> {
    static override is(value: unknown): value is GroupedCategoryScale<any, any> {
        return value instanceof GroupedCategoryScale;
    }

    private previousDomainJson: string | undefined = undefined;

    /** Whether the current domain update is animatable (initial load or no domain change). */
    animatable = true;

    override set domain(values: D[]) {
        // Track domain changes to determine if animations should be skipped.
        // For large domains, skip JSON.stringify overhead since series won't animate anyway.
        if (values.length <= MAX_ANIMATABLE_NODES) {
            const currentDomainJson = JSON.stringify(values);
            this.animatable = this.previousDomainJson === undefined || this.previousDomainJson === currentDomainJson;
            this.previousDomainJson = currentDomainJson;
        } else {
            this.animatable = this.previousDomainJson === undefined;
            this.previousDomainJson = '';
        }

        super.domain = values;
    }

    override get domain(): D[] {
        return super.domain;
    }

    override normalizeDomains(...domains: DomainWithMetadata<D>[]): NormalizedDomain<D> {
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
