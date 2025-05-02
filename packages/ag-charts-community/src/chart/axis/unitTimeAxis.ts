import type { ModuleContext } from '../../module/moduleContext';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import { Property } from '../../util/properties';
import type { TimeInterval } from '../../util/time';
import type { AxisLabel } from './axisLabel';
import type { AxisTick } from './axisTick';
import { CategoryAxis } from './categoryAxis';
import { TimeAxisParentLevel, normaliseTimeDataDomain } from './timeAxis';

export class UnitTimeAxis extends CategoryAxis<UnitTimeScale> {
    static override readonly className = 'UnitTimeAxis' as const;
    static override readonly type = 'unit-time' as const;

    @Property
    readonly parentLevel = new TimeAxisParentLevel();

    @Property
    min?: Date | number = undefined;

    @Property
    max?: Date | number = undefined;

    @Property
    unit: TimeInterval | undefined;

    override get primaryLabel(): AxisLabel | undefined {
        return this.parentLevel.enabled ? this.parentLevel.label : undefined;
    }

    override get primaryTick(): AxisTick | undefined {
        return this.parentLevel.enabled ? this.parentLevel.tick : undefined;
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
