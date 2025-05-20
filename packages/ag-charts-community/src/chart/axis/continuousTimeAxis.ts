import type { ModuleContext } from '../../module/moduleContext';
import { ContinuousTimeScale } from '../../scale/continuousTimeScale';
import { Property } from '../../util/properties';
import { AxisLabel } from './axisLabel';
import { AxisTick } from './axisTick';
import { CartesianAxis } from './cartesianAxis';
import { TimeAxisParentLevel, normaliseTimeDataDomain } from './timeAxis';

export class ContinuousTimeAxis extends CartesianAxis<ContinuousTimeScale, number | Date> {
    static readonly className = 'ContinuousTimeAxis';
    static readonly type = 'continuous-time' as const;

    @Property
    readonly parentLevel = new TimeAxisParentLevel();

    @Property
    min?: Date | number = undefined;

    @Property
    max?: Date | number = undefined;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new ContinuousTimeScale());
    }

    override get primaryLabel(): AxisLabel | undefined {
        return this.parentLevel.enabled ? this.parentLevel.label : undefined;
    }

    override get primaryTick(): AxisTick | undefined {
        return this.parentLevel.enabled ? this.parentLevel.tick : undefined;
    }

    override normaliseDataDomain(d: Date[]) {
        return normaliseTimeDataDomain(d, this.min, this.max);
    }
}
