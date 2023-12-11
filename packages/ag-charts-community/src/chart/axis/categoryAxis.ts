import type { ModuleContext } from '../../module/moduleContext';
import { type BandMode, BandScale } from '../../scale/bandScale';
import { NUMBER, OPT_NUMBER, Validate } from '../../util/validation';
import { CartesianAxis } from './cartesianAxis';

export class CategoryAxis extends CartesianAxis<BandScale<string | object>> {
    static className = 'CategoryAxis';
    static type = 'category' as const;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new BandScale<string>());

        this.includeInvisibleDomains = true;
    }

    @Validate(NUMBER(0, 1))
    groupPaddingInner: number = 0.1;

    @Validate(OPT_NUMBER(0, 1))
    paddingInner?: number = undefined;

    @Validate(OPT_NUMBER(0, 1))
    paddingOuter?: number = undefined;

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
        let paddingInner = 1;
        let paddingOuter = 0;
        let bandMode: BandMode | undefined;
        for (const series of this.boundSeries) {
            const bandConfig = series.getBandScaleConfiguration?.();
            if (bandConfig == null) continue;

            paddingInner = Math.min(paddingInner, bandConfig.paddingInner);
            paddingOuter = Math.max(paddingOuter, bandConfig.paddingOuter);

            switch (bandConfig.bandMode) {
                case 'band':
                    bandMode = 'band';
                    break;
                case 'point':
                    bandMode ??= 'point';
                    break;
            }
        }

        this.scale.paddingInner = this.paddingInner ?? paddingInner;
        this.scale.paddingOuter = this.paddingOuter ?? paddingOuter;
        this.scale.bandMode = bandMode ?? 'band';

        return super.calculateDomain();
    }
}
