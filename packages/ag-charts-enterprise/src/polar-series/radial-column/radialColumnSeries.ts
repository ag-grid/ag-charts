import { _Scene, _ModuleSupport, _Util } from 'ag-charts-community';
import { RadialColumnSeriesBase } from './radialColumnSeriesBase';
import type { RadialColumnNodeDatum } from './radialColumnSeriesBase';

const { Path, Selection } = _Scene;
const { Validate, OPT_NUMBER } = _ModuleSupport;
const { isNumberEqual, normalizeAngle360, angleBetween } = _Util;

export class RadialColumnSeries extends RadialColumnSeriesBase<_Scene.Path> {
    static className = 'RadialColumnSeries';

    @Validate(OPT_NUMBER(0))
    columnWidth: number | undefined = undefined;

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `radarColumn-stack-${groupIndex}-yValues`;
    }

    protected createPathSelection(parent: _Scene.Group): _Scene.Selection<_Scene.Path, RadialColumnNodeDatum> {
        return Selection.select(parent, Path);
    }

    private drawColumnShape(
        node: _Scene.Path,
        columnWidth: number,
        axisInnerRadius: number,
        innerRadius: number,
        outerRadius: number
    ) {
        const { path } = node;

        const isStackBottom = isNumberEqual(innerRadius, axisInnerRadius);
        const sideRotation = Math.asin(columnWidth / 2 / innerRadius);

        // Avoid the connecting lines to be too long
        const shouldConnectWithCircle = isStackBottom && !isNaN(sideRotation) && sideRotation < Math.PI / 6;

        const left = -columnWidth / 2;
        const right = columnWidth / 2;
        const top = -outerRadius;
        const bottom = -innerRadius * (shouldConnectWithCircle ? Math.cos(sideRotation) : 1);

        path.clear({ trackChanges: true });
        path.moveTo(left, bottom);
        path.lineTo(left, top);
        path.lineTo(right, top);
        path.lineTo(right, bottom);

        if (shouldConnectWithCircle) {
            // Connect column with inner circle
            path.arc(
                0,
                0,
                innerRadius,
                normalizeAngle360(sideRotation - Math.PI / 2),
                normalizeAngle360(-sideRotation - Math.PI / 2),
                true
            );
        } else {
            path.lineTo(left, bottom);
        }

        path.closePath();
        node.checkPathDirty();
    }

    private getColumnWidth(datum: RadialColumnNodeDatum) {
        if (this.columnWidth !== undefined) {
            return this.columnWidth;
        }
        const axisInnerRadius = this.getAxisInnerRadius();
        const midAngle = angleBetween(datum.startAngle, datum.endAngle);
        if (midAngle >= Math.PI) {
            return 2 * axisInnerRadius;
        }
        const startX = axisInnerRadius * Math.cos(datum.startAngle);
        const startY = axisInnerRadius * Math.sin(datum.startAngle);
        const endX = axisInnerRadius * Math.cos(datum.endAngle);
        const endY = axisInnerRadius * Math.sin(datum.endAngle);
        return Math.max(
            1,
            Math.min(axisInnerRadius * 2, Math.floor(Math.sqrt((startX - endX) ** 2 + (startY - endY) ** 2)))
        );
    }

    protected updateItemPath(node: _Scene.Rect, datum: RadialColumnNodeDatum) {
        const midAngle = angleBetween(datum.startAngle, datum.endAngle);
        const angle = normalizeAngle360(datum.startAngle + midAngle / 2);
        const columnWidth = this.getColumnWidth(datum);
        const axisInnerRadius = this.getAxisInnerRadius();

        this.drawColumnShape(node, columnWidth, axisInnerRadius, datum.innerRadius, datum.outerRadius);
        node.rotation = angle + Math.PI / 2;
        node.rotationCenterX = 0;
        node.rotationCenterY = 0;
    }

    protected animateItemsShapes() {
        const { itemSelection } = this;
        const duration = this.ctx.animationManager?.defaultOptions.duration ?? 1000;

        const axisInnerRadius = this.getAxisInnerRadius();

        itemSelection.each((node, datum) => {
            const columnWidth = this.getColumnWidth(datum);
            this.ctx.animationManager?.animateMany<number>(
                `${this.id}_empty-update-ready_${node.id}`,
                [
                    { from: axisInnerRadius, to: datum.innerRadius },
                    { from: axisInnerRadius, to: datum.outerRadius },
                ],
                {
                    duration,
                    onUpdate: ([innerRadius, outerRadius]) => {
                        this.drawColumnShape(node, columnWidth, axisInnerRadius, innerRadius, outerRadius);
                    },
                }
            );
        });
    }
}
