import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { RadialColumnSeriesBase } from '../radial-column/radialColumnSeriesBase';
import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { prepareRadialColumnAnimationFunctions, resetRadialColumnSelectionFn } from '../radial-column/radialColumnUtil';

const { seriesLabelFadeInAnimation } = _ModuleSupport;
const { Sector, motion } = _Scene;

export class NightingaleSeries extends RadialColumnSeriesBase<_Scene.Sector> {
    static className = 'NightingaleSeries';

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, { animationResetFns: { item: resetRadialColumnSelectionFn } });
    }

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `nightingale-stack-${groupIndex}-yValues`;
    }

    protected override nodeFactory(): _Scene.Sector {
        return new Sector();
    }

    protected updateItemPath(node: _Scene.Sector, datum: RadialColumnNodeDatum) {
        node.centerX = 0;
        node.centerY = 0;
        node.innerRadius = datum.innerRadius;
        node.outerRadius = datum.outerRadius;
        node.startAngle = datum.startAngle;
        node.endAngle = datum.endAngle;
    }

    protected override animateEmptyUpdateReady(): void {
        const { animationManager } = this.ctx;

        const { fromFn, toFn } = prepareRadialColumnAnimationFunctions(this.getAxisInnerRadius());
        motion.fromToMotion(`${this.id}_empty-update-ready`, animationManager, [this.itemSelection], fromFn, toFn);

        seriesLabelFadeInAnimation(this, animationManager, [this.labelSelection]);
    }
}
