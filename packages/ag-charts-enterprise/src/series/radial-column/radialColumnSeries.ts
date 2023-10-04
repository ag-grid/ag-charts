import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { RadialColumn } from '../../scene/shape/radialColumn';
import { RadialColumnSeriesBase } from './radialColumnSeriesBase';
import type { RadialColumnNodeDatum } from './radialColumnSeriesBase';

const { Selection } = _Scene;
const { Validate, OPT_NUMBER, ChartAxisDirection, PolarAxis } = _ModuleSupport;
const { normalizeAngle360, angleBetween } = _Util;

export class RadialColumnSeries extends RadialColumnSeriesBase<RadialColumn> {
    static className = 'RadialColumnSeries';

    @Validate(OPT_NUMBER(0, 1))
    columnWidthRatio: number | undefined = undefined;

    @Validate(OPT_NUMBER(0, 1))
    maxColumnWidthRatio: number | undefined = undefined;

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `radarColumn-stack-${groupIndex}-yValues`;
    }

    protected createPathSelection(parent: _Scene.Group): _Scene.Selection<RadialColumn, RadialColumnNodeDatum> {
        return Selection.select(parent, RadialColumn);
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

    protected updateItemPath(node: RadialColumn, datum: RadialColumnNodeDatum) {
        const midAngle = angleBetween(datum.startAngle, datum.endAngle);
        const angle = normalizeAngle360(datum.startAngle + midAngle / 2);
        const columnWidth = this.getColumnWidth(datum);
        const axisInnerRadius = this.getAxisInnerRadius();
        const axisIsCircle = this.isRadiusAxisCircle();

        node.centerX = this.centerX;
        node.centerY = this.centerY;
        node.innerRadius = datum.innerRadius;
        node.outerRadius = datum.outerRadius;
        node.axisInnerRadius = axisInnerRadius;
        node.axisOuterRadius = this.radius;
        node.columnWidth = columnWidth;
        node.isBeveled = axisIsCircle;

        node.rotation = angle + Math.PI / 2;
        node.rotationCenterX = 0;
        node.rotationCenterY = 0;
    }

    protected animateItemsShapes() {
        const { itemSelection } = this;
        const duration = this.ctx.animationManager.defaultDuration;

        const axisInnerRadius = this.getAxisInnerRadius();
        const isAxisCircle = this.isRadiusAxisCircle();

        itemSelection.each((node, datum) => {
            const columnWidth = this.getColumnWidth(datum);
            this.ctx.animationManager.animate({
                id: `${this.id}_empty-update-ready_${node.id}`,
                from: { innerRadius: axisInnerRadius, outerRadius: axisInnerRadius },
                to: { innerRadius: datum.innerRadius, outerRadius: datum.outerRadius },
                duration,
                onUpdate: ({ innerRadius, outerRadius }) => {
                    node.centerX = this.centerX;
                    node.centerY = this.centerY;
                    node.innerRadius = innerRadius;
                    node.outerRadius = outerRadius;
                    node.axisInnerRadius = axisInnerRadius;
                    node.axisOuterRadius = this.radius;
                    node.columnWidth = columnWidth;
                    node.isBeveled = isAxisCircle;
                },
            });
        });
    }
}
