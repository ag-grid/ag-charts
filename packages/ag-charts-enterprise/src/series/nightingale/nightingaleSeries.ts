import type { _ModuleSupport } from 'ag-charts-community';
import { _Scene } from 'ag-charts-community';

import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
import { RadialColumnSeriesBase } from '../radial-column/radialColumnSeriesBase';
import { prepareNightingaleAnimationFunctions, resetNightingaleSelectionFn } from './nightingaleUtil';

const { Sector } = _Scene;

export class NightingaleSeries extends RadialColumnSeriesBase<_Scene.Sector> {
    static className = 'NightingaleSeries';
    static type = 'nightingale' as const;

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

    protected updateItemPath(node: _Scene.Sector, datum: RadialColumnNodeDatum, highlight: boolean) {
        node.centerX = 0;
        node.centerY = 0;
        if (highlight) {
            node.innerRadius = datum.innerRadius;
            node.outerRadius = datum.outerRadius;
            node.startAngle = datum.startAngle;
            node.endAngle = datum.endAngle;
        }
    }

    protected override getColumnTransitionFunctions() {
        const axisInnerRadius = this.getAxisInnerRadius();
        return prepareNightingaleAnimationFunctions(axisInnerRadius);
    }
}
