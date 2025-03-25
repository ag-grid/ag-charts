import { isFiniteNumber } from 'ag-charts-core';

import type { ModuleContext } from '../../module/moduleContext';
import { CategoryScale } from '../../scale/categoryScale';
import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { Property } from '../../util/properties';
import { CartesianAxis } from './cartesianAxis';

export class CategoryAxis<
    S extends CategoryScale<string | object> | OrdinalTimeScale = CategoryScale<string | object>,
> extends CartesianAxis<S> {
    static override is(this: void, value: unknown): value is CategoryAxis<any> {
        return value instanceof CategoryAxis;
    }

    static readonly className: string = 'CategoryAxis';
    static readonly type: 'category' | 'grouped-category' | 'ordinal-time' = 'category';

    constructor(moduleCtx: ModuleContext, scale = new CategoryScale<string | object>() as S) {
        super(moduleCtx, scale);

        this.includeInvisibleDomains = true;
        // Has no effect and can speed up tick generation
        this.nice = false;
    }

    @Property
    groupPaddingInner: number = 0.1;

    @Property
    paddingInner?: number;

    @Property
    paddingOuter?: number;

    override normaliseDataDomain(domain: Array<string | object>) {
        return { domain, clipped: false };
    }

    protected override updateScale() {
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
