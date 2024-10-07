import type { ModuleContext } from '../../module/moduleContext';
import { BandScale } from '../../scale/bandScale';
import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { isFiniteNumber } from '../../util/type-guards';
import { RATIO, Validate } from '../../util/validation';
import { CartesianAxis } from './cartesianAxis';

export class CategoryAxis<
    S extends BandScale<string | object, number> | OrdinalTimeScale = BandScale<string | object, number>,
> extends CartesianAxis<S> {
    static override is(value: unknown): value is CategoryAxis<any> {
        return value instanceof CategoryAxis;
    }

    static readonly className: string = 'CategoryAxis';
    static readonly type: 'category' | 'ordinal-time' = 'category';

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
