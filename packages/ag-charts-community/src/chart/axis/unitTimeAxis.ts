import type { ModuleContext } from '../../module/moduleContext';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import { Property } from '../../util/properties';
import type { TimeInterval } from '../../util/time';
import { CategoryAxis } from './categoryAxis';

export class UnitTimeAxis extends CategoryAxis<UnitTimeScale> {
    static override readonly className = 'UnitTimeAxis' as const;
    static override readonly type = 'unit-time' as const;

    @Property
    unit: TimeInterval | undefined;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new UnitTimeScale());
    }

    protected override updateScale(): void {
        super.updateScale();

        this.scale.interval = this.unit;
    }
}
