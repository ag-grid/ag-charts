import { _ModuleSupport } from 'ag-charts-community';
import { ChartAxisDirection, type DynamicContext, type NormalisedRadialColumnSeriesOwnOptions } from 'ag-charts-core';

import type { RadialColumnNodeDatum } from './radialColumnSeriesBase';
import { RadialColumnSeriesBase } from './radialColumnSeriesBase';
import { prepareRadialColumnAnimationFunctions, resetRadialColumnSelectionFn } from './radialColumnUtil';

const { PolarAxis, RadialColumnShape, getRadialColumnWidth } = _ModuleSupport;

export class RadialColumnSeries extends RadialColumnSeriesBase<
    _ModuleSupport.RadialColumnShape,
    NormalisedRadialColumnSeriesOwnOptions
> {
    static override readonly className = 'RadialColumnSeries';
    static readonly type = 'radial-column' as const;

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
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

    protected override nodeFactory(): _ModuleSupport.RadialColumnShape {
        return new RadialColumnShape();
    }

    protected override getColumnTransitionFunctions() {
        const axisZeroRadius = this.isRadiusAxisReversed() ? this.radius : this.getAxisInnerRadius();
        return prepareRadialColumnAnimationFunctions(axisZeroRadius);
    }

    protected isRadiusAxisCircle() {
        const radiusAxis = this.axes[ChartAxisDirection.Radius];
        return radiusAxis instanceof PolarAxis ? radiusAxis.shape === 'circle' : false;
    }

    protected override updateItemPath(
        node: _ModuleSupport.RadialColumnShape,
        datum: RadialColumnNodeDatum,
        highlight: boolean
    ) {
        node.isBeveled = this.isRadiusAxisCircle();

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
        const { columnWidthRatio, maxColumnWidthRatio } = this.options;
        return getRadialColumnWidth(startAngle, endAngle, this.radius, columnWidthRatio, maxColumnWidthRatio);
    }
}
