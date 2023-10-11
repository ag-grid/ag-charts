import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { RadialColumnSeriesBase } from '../radial-column/radialColumnSeriesBase';
import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { prepareNightingaleAnimationFunctions, resetNightingaleSelectionFn } from './nightingaleUtil';

const { Sector } = _Scene;

export class NightingaleSeries extends RadialColumnSeriesBase<_Scene.Sector> {
    static className = 'NightingaleSeries';

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, { animationResetFns: { item: resetNightingaleSelectionFn } });
    }

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `nightingale-stack-${groupIndex}-yValues`;
    }

    protected override nodeFactory(): _Scene.Sector {
        return new Sector();
    }

    protected updateItemPath(node: _Scene.Sector, _datum: RadialColumnNodeDatum) {
        node.centerX = 0;
        node.centerY = 0;
    }

    protected override getColumnTransitionFunctions() {
        const axisInnerRadius = this.getAxisInnerRadius();
        return prepareNightingaleAnimationFunctions(axisInnerRadius);
    }
}
