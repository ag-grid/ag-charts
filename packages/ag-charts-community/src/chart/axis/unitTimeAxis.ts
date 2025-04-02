import type { ModuleContext } from '../../module/moduleContext';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import { CategoryAxis } from './categoryAxis';

export class UnitTimeAxis extends CategoryAxis<UnitTimeScale> {
    static override readonly className = 'UnitTimeAxis' as const;
    static override readonly type = 'unit-time' as const;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new UnitTimeScale());
    }

    protected override updateScale(): void {
        super.updateScale();

        const {
            scale,
            interval: { step },
        } = this;
        if (scale.interval?.valueOf() !== step) {
            scale.interval = step as any;
        }
    }
}
