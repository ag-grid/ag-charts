import type { ModuleContext } from '../../module/moduleContext';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import { Property } from '../../util/properties';
import type { TimeInterval } from '../../util/time';
import type { AxisLabel } from './axisLabel';
import { CategoryAxis } from './categoryAxis';
import { TimeAxisDivision, normaliseTimeDataDomain } from './timeAxis';

export class UnitTimeAxis extends CategoryAxis<UnitTimeScale> {
    static override readonly className = 'UnitTimeAxis' as const;
    static override readonly type = 'unit-time' as const;

    @Property
    readonly division = new TimeAxisDivision();

    @Property
    min?: Date | number = undefined;

    @Property
    max?: Date | number = undefined;

    @Property
    unit: TimeInterval | undefined;

    override get primaryLabel(): AxisLabel | undefined {
        return this.division.enabled ? this.division.label : undefined;
    }

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new UnitTimeScale());
    }

    protected override updateScale(): void {
        super.updateScale();

        this.scale.interval = this.unit;
    }

    override normaliseDataDomain(domain: Date[]) {
        return normaliseTimeDataDomain(domain, this.min, this.max);
    }
}
