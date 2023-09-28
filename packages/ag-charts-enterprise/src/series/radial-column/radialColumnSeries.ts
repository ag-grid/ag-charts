import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import { RadialColumnSeriesBase } from './radialColumnSeriesBase';
import type { RadialColumnNodeDatum } from './radialColumnSeriesBase';

const { Path, Selection } = _Scene;
const { Validate, OPT_NUMBER, ChartAxisDirection, PolarAxis } = _ModuleSupport;
const { isNumberEqual, normalizeAngle360, angleBetween } = _Util;

export class RadialColumnSeries extends RadialColumnSeriesBase<_Scene.Path> {
    static className = 'RadialColumnSeries';

    @Validate(OPT_NUMBER(0, 1))
    columnWidthRatio: number | undefined = undefined;

    @Validate(OPT_NUMBER(0, 1))
    maxColumnWidthRatio: number | undefined = undefined;

    protected getStackId() {
        const groupIndex = this.seriesGrouping?.groupIndex ?? this.id;
        return `radarColumn-stack-${groupIndex}-yValues`;
    }

    protected createPathSelection(parent: _Scene.Group): _Scene.Selection<_Scene.Path, RadialColumnNodeDatum> {
        return Selection.select(parent, Path);
    }

    private drawBasicColumnRect(node: _Scene.Path, columnWidth: number, innerRadius: number, outerRadius: number) {
        const { path } = node;
        const left = -columnWidth / 2;
        const right = columnWidth / 2;
        const top = -outerRadius;
        const bottom = -innerRadius;
        path.clear({ trackChanges: true });
        path.moveTo(left, bottom);
        path.lineTo(left, top);
        path.lineTo(right, top);
        path.lineTo(right, bottom);
        path.lineTo(left, bottom);
        path.closePath();
        node.checkPathDirty();
    }

    private drawColumnShape(
        node: _Scene.Path,
        columnWidth: number,
        axisInnerRadius: number,
        axisOuterRadius: number,
        innerRadius: number,
        outerRadius: number,
        axisIsCircle: boolean
    ) {
        if (!axisIsCircle) {
            this.drawBasicColumnRect(node, columnWidth, innerRadius, outerRadius);
            return;
        }

        const { path } = node;

        const isStackBottom = isNumberEqual(innerRadius, axisInnerRadius);
        const sideRotation = Math.asin(columnWidth / 2 / innerRadius);

        const getTriangleHypotenuse = (leg: number, otherLeg: number) => Math.sqrt(leg ** 2 + otherLeg ** 2);
        const getTriangleLeg = (hypotenuse: number, otherLeg: number) => {
            if (otherLeg > hypotenuse) {
                return 0;
            }
            return Math.sqrt(hypotenuse ** 2 - otherLeg ** 2);
        };

        // Avoid the connecting lines to be too long
        const shouldConnectBottomCircle =
            isStackBottom && axisIsCircle && !isNaN(sideRotation) && sideRotation < Math.PI / 6;

        let left = -columnWidth / 2;
        let right = columnWidth / 2;
        const top = -outerRadius;
        const bottom = -innerRadius * (shouldConnectBottomCircle ? Math.cos(sideRotation) : 1);

        path.clear({ trackChanges: true });

        const hasBottomIntersection = axisOuterRadius < getTriangleHypotenuse(innerRadius, columnWidth / 2);
        if (hasBottomIntersection) {
            // Crop bottom side overflowing outer radius
            const bottomIntersectionX = getTriangleLeg(axisOuterRadius, innerRadius);
            left = -bottomIntersectionX;
            right = bottomIntersectionX;
        }

        path.moveTo(left, bottom);

        const hasSideIntersection = axisOuterRadius < getTriangleHypotenuse(outerRadius, columnWidth / 2);
        if (hasSideIntersection) {
            // Crop top side overflowing outer radius
            const sideIntersectionY = -getTriangleLeg(axisOuterRadius, columnWidth / 2);
            const topIntersectionX = getTriangleLeg(axisOuterRadius, outerRadius);
            if (!hasBottomIntersection) {
                path.lineTo(left, sideIntersectionY);
            }
            path.arc(
                0,
                0,
                axisOuterRadius,
                Math.atan2(sideIntersectionY, left),
                Math.atan2(top, -topIntersectionX),
                false
            );
            if (!isNumberEqual(topIntersectionX, 0)) {
                path.lineTo(topIntersectionX, top);
            }
            path.arc(
                0,
                0,
                axisOuterRadius,
                Math.atan2(top, topIntersectionX),
                Math.atan2(sideIntersectionY, right),
                false
            );
        } else {
            path.lineTo(left, top);
            path.lineTo(right, top);
        }

        path.lineTo(right, bottom);

        if (shouldConnectBottomCircle) {
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

    protected updateItemPath(node: _Scene.Rect, datum: RadialColumnNodeDatum) {
        const midAngle = angleBetween(datum.startAngle, datum.endAngle);
        const angle = normalizeAngle360(datum.startAngle + midAngle / 2);
        const columnWidth = this.getColumnWidth(datum);
        const axisInnerRadius = this.getAxisInnerRadius();
        const axisIsCircle = this.isRadiusAxisCircle();

        this.drawColumnShape(
            node,
            columnWidth,
            axisInnerRadius,
            this.radius,
            datum.innerRadius,
            datum.outerRadius,
            axisIsCircle
        );
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
                    this.drawColumnShape(
                        node,
                        columnWidth,
                        axisInnerRadius,
                        this.radius,
                        innerRadius,
                        outerRadius,
                        isAxisCircle
                    );
                },
            });
        });
    }
}
