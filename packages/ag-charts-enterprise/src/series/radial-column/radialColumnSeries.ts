import { _ModuleSupport } from 'ag-charts-community';

import type { RadialColumnNodeDatum } from './radialColumnSeriesBase';
import { RadialColumnSeriesBase } from './radialColumnSeriesBase';
import { RadialColumnSeriesProperties } from './radialColumnSeriesProperties';
import { RadialColumnShape, getRadialColumnWidth } from './radialColumnShape';
import { prepareRadialColumnAnimationFunctions, resetRadialColumnSelectionFn } from './radialColumnUtil';

const { ChartAxisDirection, PolarAxis } = _ModuleSupport;

export class RadialColumnSeries extends RadialColumnSeriesBase<RadialColumnShape> {
    static className = 'RadialColumnSeries';
    static type = 'radial-column' as const;

    override properties = new RadialColumnSeriesProperties();

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

    protected override updateItemPath(node: RadialColumnShape, datum: RadialColumnNodeDatum, highlight: boolean) {
        const axisIsCircle = this.isRadiusAxisCircle();
        node.isBeveled = axisIsCircle;

        if (highlight) {
            node.innerRadius = datum.innerRadius;
            node.outerRadius = datum.outerRadius;
            node.startAngle = datum.startAngle;
            node.endAngle = datum.endAngle;
            node.columnWidth = datum.columnWidth;
            node.axisInnerRadius = datum.axisInnerRadius;
            node.axisOuterRadius = datum.axisOuterRadius;
        }
    }

    protected override getColumnWidth(startAngle: number, endAngle: number) {
        const { columnWidthRatio = 0.5, maxColumnWidthRatio = 0.5 } = this.properties;
        return getRadialColumnWidth(startAngle, endAngle, this.radius, columnWidthRatio, maxColumnWidthRatio);
    }
}
