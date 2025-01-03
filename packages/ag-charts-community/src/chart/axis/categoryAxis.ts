import type { ModuleContext } from '../../module/moduleContext';
import { CategoryScale } from '../../scale/categoryScale';
import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { isFiniteNumber } from '../../util/type-guards';
import { RATIO, Validate } from '../../util/validation';
import { CartesianAxis } from './cartesianAxis';

export class CategoryAxis<
    S extends CategoryScale<string | object, number> | OrdinalTimeScale = CategoryScale<string | object, number>,
> extends CartesianAxis<S> {
    static override is(this: void, value: unknown): value is CategoryAxis<any> {
        return value instanceof CategoryAxis;
    }

    static readonly className: string = 'CategoryAxis';
    static readonly type: 'category' | 'grouped-category' | 'ordinal-time' = 'category';

    constructor(moduleCtx: ModuleContext, scale = new CategoryScale<string | object>() as S) {
        super(moduleCtx, scale);

        this.includeInvisibleDomains = true;
    }

    @Validate(RATIO)
    groupPaddingInner: number = 0.1;

    @Validate(RATIO, { optional: true })
    paddingInner?: number;

    @Validate(RATIO, { optional: true })
    paddingOuter?: number;

    override normaliseDataDomain(domain: Array<string | object>) {
        return { domain, clipped: false };
    }

    override updateScale() {
        super.updateScale();

        let { paddingInner, paddingOuter } = this;
        if (!isFiniteNumber(paddingInner) || !isFiniteNumber(paddingOuter)) {
            const padding = this.reduceBandScalePadding();
            paddingInner ??= padding.inner;
            paddingOuter ??= padding.outer;
        }
        this.scale.paddingInner = paddingInner ?? 0;
        this.scale.paddingOuter = paddingOuter ?? 0;
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
