import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { RadialColumnSeriesBase } from './radialColumnSeriesBase';
import type { RadialColumnNodeDatum } from './radialColumnSeriesBase';
import { RadialColumnShape } from './radialColumnShape';
import { getRadialColumnWidth } from './radialColumnShape';
import { prepareRadialColumnAnimationFunctions, resetRadialColumnSelectionFn } from './radialColumnUtil';

const { ChartAxisDirection, OPT_NUMBER, PolarAxis, Validate } = _ModuleSupport;

export class RadialColumnSeries extends RadialColumnSeriesBase<RadialColumnShape> {
    static className = 'RadialColumnSeries';

    @Validate(OPT_NUMBER(0, 1))
    columnWidthRatio?: number;

    @Validate(OPT_NUMBER(0, 1))
    maxColumnWidthRatio?: number;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, {
            animationResetFns: {
                item: resetRadialColumnSelectionFn,
            },
        });
    }

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `radarColumn-stack-${groupIndex}-yValues`;
    }

    protected override nodeFactory(): RadialColumnShape {
        return new RadialColumnShape();
    }

    protected override getColumnTransitionFunctions() {
        const axisInnerRadius = this.getAxisInnerRadius();
        return prepareRadialColumnAnimationFunctions(axisInnerRadius);
    }

    protected isRadiusAxisCircle() {
        const radiusAxis = this.axes[ChartAxisDirection.Y];
        return radiusAxis instanceof PolarAxis ? radiusAxis.shape === 'circle' : false;
    }

    protected override updateItemPath(node: RadialColumnShape, _datum: RadialColumnNodeDatum) {
        const axisIsCircle = this.isRadiusAxisCircle();
        node.isBeveled = axisIsCircle;
    }

    protected override getColumnWidth(startAngle: number, endAngle: number) {
        const { radius, columnWidthRatio = 0.5, maxColumnWidthRatio = 0.5 } = this;
        return getRadialColumnWidth(startAngle, endAngle, radius, columnWidthRatio, maxColumnWidthRatio);
    }
}
