import type { ModuleContext } from '../../module/moduleContext';
import { BandScale } from '../../scale/bandScale';
import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import { RATIO, Validate } from '../../util/validation';
import { CartesianAxis } from './cartesianAxis';

export class CategoryAxis<
    S extends BandScale<string | object, number> | OrdinalTimeScale = BandScale<string | object, number>,
> extends CartesianAxis<S> {
    static readonly className: string = 'CategoryAxis';
    static readonly type: 'category' | 'ordinal-time' = 'category';

    private _paddingOverrideEnabled = false;

    constructor(moduleCtx: ModuleContext, scale = new BandScale<string | object>() as S) {
        super(moduleCtx, scale);

        this.includeInvisibleDomains = true;
    }

    @Validate(RATIO)
    groupPaddingInner: number = 0.1;

    set paddingInner(value: number) {
        this._paddingOverrideEnabled = true;
        this.scale.paddingInner = value;
    }
    get paddingInner(): number {
        this._paddingOverrideEnabled = true;
        return this.scale.paddingInner;
    }

    set paddingOuter(value: number) {
        this.scale.paddingOuter = value;
    }
    get paddingOuter(): number {
        return this.scale.paddingOuter;
    }

    override normaliseDataDomain(d: (string | object)[]) {
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

    protected override calculateDomain() {
        if (!this._paddingOverrideEnabled) {
            let paddingInner = Infinity;
            let paddingOuter = -Infinity;
            for (const s of this.boundSeries) {
                const padding = s.getBandScalePadding?.();
                if (padding == null) continue;
                paddingInner = Math.min(paddingInner, padding.inner);
                paddingOuter = Math.max(paddingOuter, padding.outer);
            }
            this.scale.paddingInner = Number.isFinite(paddingInner) ? paddingInner : 0;
            this.scale.paddingOuter = Number.isFinite(paddingOuter) ? paddingOuter : 0;
        }

        return super.calculateDomain();
    }
}
