import type { ModuleContext } from '../../module/moduleContext';
import { BandScale } from '../../scale/bandScale';
import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { isFiniteNumber } from '../../util/type-guards';
import { RATIO, Validate } from '../../util/validation';
import { CartesianAxis } from './cartesianAxis';

export class CategoryAxis<
    S extends BandScale<string | object, number> | OrdinalTimeScale = BandScale<string | object, number>,
> extends CartesianAxis<S> {
    static override is(this: void, value: unknown): value is CategoryAxis<any> {
        return value instanceof CategoryAxis;
    }

    static readonly className: string = 'CategoryAxis';
    static readonly type: 'category' | 'grouped-category' | 'ordinal-time' = 'category';

    constructor(moduleCtx: ModuleContext, scale = new BandScale<string | object>() as S) {
        super(moduleCtx, scale);

        this.includeInvisibleDomains = true;
    }

    @Validate(RATIO)
    groupPaddingInner: number = 0.1;

    @Validate(RATIO, { optional: true })
    paddingInner?: number;

    @Validate(RATIO, { optional: true })
    paddingOuter?: number;

    private domainOrderedToNormalizedDomain(seriesDomain: any[], normalizedDomain: any[]) {
        let normalizedIndex = -1;
        for (const value of seriesDomain) {
            const normalizedNextIndex = normalizedDomain.indexOf(value);

            if (normalizedNextIndex === -1) {
                // All subsequent values must be extending (i.e. appending to) the normalized domain
                normalizedIndex = Infinity;
            } else if (normalizedNextIndex <= normalizedIndex) {
                return false;
            } else {
                normalizedIndex = normalizedNextIndex;
            }
        }

        return true;
    }

    private categoryAnimatable = true;
    protected override calculateDomain() {
        let normalizedDomain: any[] = [];

        let categoryAnimatable = true;
        for (const series of this.boundSeries) {
            if (!this.includeInvisibleDomains && !series.isEnabled()) continue;

            const seriesDomain = series.getDomain(this.direction);

            categoryAnimatable &&= this.domainOrderedToNormalizedDomain(seriesDomain, normalizedDomain);

            normalizedDomain = this.normaliseDataDomain([...normalizedDomain, ...seriesDomain]).domain;
        }

        this.setDomain(normalizedDomain);
        this.categoryAnimatable = categoryAnimatable;
    }

    override update() {
        super.update();

        if (!this.categoryAnimatable) {
            this.moduleCtx.animationManager.skip();
        }
    }

    override normaliseDataDomain(d: Array<string | object>) {
        const domain = [];
        const uniqueValues = new Set();
        for (const v of d) {
            const key = v instanceof Date ? v.getTime() : v;
            if (!uniqueValues.has(key)) {
                uniqueValues.add(key);
                // Only add unique values
                domain.push(v);
            }
        }
        return { domain, clipped: false };
    }

    override updateScale(domain?: any[]) {
        let { paddingInner, paddingOuter } = this;
        if (!isFiniteNumber(paddingInner) || !isFiniteNumber(paddingOuter)) {
            const padding = this.reduceBandScalePadding();
            paddingInner ??= padding.inner;
            paddingOuter ??= padding.outer;
        }
        this.scale.paddingInner = paddingInner ?? 0;
        this.scale.paddingOuter = paddingOuter ?? 0;

        super.updateScale(domain);
    }

    private reduceBandScalePadding() {
        return this.boundSeries.reduce(
            (result, series) => {
                const padding = series.getBandScalePadding?.();
                if (padding) {
                    if (result.inner > padding.inner) {
                        result.inner = padding.inner;
                    }
                    if (result.outer < padding.outer) {
                        result.outer = padding.outer;
                    }
                }
                return result;
            },
            { inner: Infinity, outer: -Infinity }
        );
    }
}
