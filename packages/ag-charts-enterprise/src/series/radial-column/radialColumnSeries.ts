import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { RadialColumnSeriesBase } from './radialColumnSeriesBase';
import type { RadialColumnNodeDatum } from './radialColumnSeriesBase';
import { RadialColumnShape } from './radialColumnShape';
import { prepareRadialColumnAnimationFunctions, resetRadialColumnSelectionFn } from './radialColumnUtil';

const { motion } = _Scene;
const { Validate, OPT_NUMBER, ChartAxisDirection, PolarAxis, seriesLabelFadeInAnimation } = _ModuleSupport;
const { normalizeAngle360, angleBetween } = _Util;

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

    protected override animateEmptyUpdateReady(): void {
        const { animationManager } = this.ctx;

        const fns = prepareRadialColumnAnimationFunctions(this.getAxisInnerRadius());
        motion.fromToMotion(`${this.id}_empty-update-ready`, animationManager, [this.itemSelection], fns);

        seriesLabelFadeInAnimation(this, animationManager, [this.labelSelection]);
    }

    private getColumnWidth(datum: RadialColumnNodeDatum) {
        const { columnWidthRatio = 0.5, maxColumnWidthRatio = 0.5 } = this;
        const axisOuterRadius = this.radius;

        const rotation = angleBetween(datum.startAngle, datum.endAngle);
        let { startAngle, endAngle } = datum;

        const pad = (rotation * (1 - columnWidthRatio)) / 2;
        startAngle += pad;
        endAngle -= pad;

        if (rotation >= 2 * Math.PI) {
            const midAngle = startAngle + rotation / 2;
            startAngle = midAngle - Math.PI;
            endAngle = midAngle + Math.PI;
        }

        const startX = axisOuterRadius * Math.cos(startAngle);
        const startY = axisOuterRadius * Math.sin(startAngle);
        const endX = axisOuterRadius * Math.cos(endAngle);
        const endY = axisOuterRadius * Math.sin(endAngle);

        const colWidth = Math.floor(Math.sqrt((startX - endX) ** 2 + (startY - endY) ** 2));
        const maxWidth = 2 * axisOuterRadius * maxColumnWidthRatio;

        return Math.max(1, Math.min(maxWidth, colWidth));
    }

    protected isRadiusAxisCircle() {
        const radiusAxis = this.axes[ChartAxisDirection.Y];
        return radiusAxis instanceof PolarAxis ? radiusAxis.shape === 'circle' : false;
    }

    protected override updateItemPath(node: RadialColumnShape, datum: RadialColumnNodeDatum) {
        const midAngle = angleBetween(datum.startAngle, datum.endAngle);
        const angle = normalizeAngle360(datum.startAngle + midAngle / 2);
        const columnWidth = this.getColumnWidth(datum);
        const axisInnerRadius = this.getAxisInnerRadius();
        const axisIsCircle = this.isRadiusAxisCircle();

        node.columnWidth = columnWidth;
        node.axisInnerRadius = axisInnerRadius;
        node.axisOuterRadius = this.radius;
        node.axisIsCircle = axisIsCircle;
        node.innerRadius = datum.innerRadius;
        node.outerRadius = datum.outerRadius;

        node.rotation = angle + Math.PI / 2;
        node.rotationCenterX = 0;
        node.rotationCenterY = 0;
    }
}
