import { _Scene, _Util } from 'ag-charts-community';

const { Path, Path2D, ScenePathChangeDetection } = _Scene;
const { angleBetween, isNumberEqual, normalizeAngle360 } = _Util;

function rotatePoint(x: number, y: number, rotation: number) {
    const radius = Math.sqrt(x ** 2 + y ** 2);
    const angle = Math.atan2(y, x);
    const rotated = angle + rotation;
    return {
        x: Math.cos(rotated) * radius,
        y: Math.sin(rotated) * radius,
    };
}

export class RadialColumnShape extends Path {
    static override className = 'RadialColumnShape';

    readonly borderPath = new Path2D();

    @ScenePathChangeDetection()
    axisIsCircle: boolean = true;

    @ScenePathChangeDetection()
    columnWidth: number = 0;

    @ScenePathChangeDetection()
    startAngle: number = 0;

    @ScenePathChangeDetection()
    endAngle: number = 0;

    @ScenePathChangeDetection()
    outerRadius: number = 0;

    @ScenePathChangeDetection()
    innerRadius: number = 0;

    @ScenePathChangeDetection()
    axisInnerRadius: number = 0;

    @ScenePathChangeDetection()
    axisOuterRadius: number = 0;

    private getRotation() {
        const { startAngle, endAngle } = this;
        const midAngle = angleBetween(startAngle, endAngle);
        return normalizeAngle360(startAngle + midAngle / 2);
    }

    override updatePath() {
        const { axisIsCircle, path } = this;

        path.clear({ trackChanges: true });
        if (!axisIsCircle) {
            const { columnWidth, outerRadius, innerRadius } = this;

            const left = -columnWidth / 2;
            const right = columnWidth / 2;
            const top = -outerRadius;
            const bottom = -innerRadius;

            const rotation = this.getRotation();
            const points = [
                [left, bottom],
                [left, top],
                [right, top],
                [right, bottom],
                [left, bottom],
            ].map(([x, y]) => rotatePoint(x, y, rotation));

            path.moveTo(points[0].x, points[0].y);
            path.lineTo(points[1].x, points[1].y);
            path.lineTo(points[2].x, points[2].y);
            path.lineTo(points[3].x, points[3].y);
            path.lineTo(points[0].x, points[0].y);

            path.closePath();
        } else {
            this.updateCircularPath();
        }

        this.checkPathDirty();
    }

    private updateCircularPath() {
        const { axisIsCircle, columnWidth, path, outerRadius, innerRadius, axisInnerRadius, axisOuterRadius } = this;

        const isStackBottom = isNumberEqual(innerRadius, axisInnerRadius);
        const sideRotation = Math.asin(columnWidth / 2 / innerRadius);
        const pointRotation = this.getRotation();

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

        const startPt = rotatePoint(left, bottom, pointRotation);
        path.moveTo(startPt.x, startPt.y);

        const hasSideIntersection = axisOuterRadius < getTriangleHypotenuse(outerRadius, columnWidth / 2);
        if (hasSideIntersection) {
            // Crop top side overflowing outer radius
            const sideIntersectionY = -getTriangleLeg(axisOuterRadius, columnWidth / 2);
            const topIntersectionX = getTriangleLeg(axisOuterRadius, outerRadius);
            if (!hasBottomIntersection) {
                const topPt = rotatePoint(left, sideIntersectionY, pointRotation);
                path.lineTo(topPt.x, topPt.y);
            }
            path.arc(
                0,
                0,
                axisOuterRadius,
                Math.atan2(sideIntersectionY, left) + pointRotation,
                Math.atan2(top, -topIntersectionX) + pointRotation,
                false
            );
            if (!isNumberEqual(topIntersectionX, 0)) {
                const topPt = rotatePoint(topIntersectionX, top, pointRotation);
                path.lineTo(topPt.x, topPt.y);
            }
            path.arc(
                0,
                0,
                axisOuterRadius,
                Math.atan2(top, topIntersectionX) + pointRotation,
                Math.atan2(sideIntersectionY, right) + pointRotation,
                false
            );
        } else {
            const topLeftPt = rotatePoint(left, top, pointRotation);
            const topRightPt = rotatePoint(right, top, pointRotation);
            path.lineTo(topLeftPt.x, topLeftPt.y);
            path.lineTo(topRightPt.x, topRightPt.y);
        }

        const bottomPt = rotatePoint(right, bottom, pointRotation);
        path.lineTo(bottomPt.x, bottomPt.y);

        if (shouldConnectBottomCircle) {
            // Connect column with inner circle
            path.arc(
                0,
                0,
                innerRadius,
                normalizeAngle360(sideRotation - Math.PI / 2) + pointRotation,
                normalizeAngle360(-sideRotation - Math.PI / 2) + pointRotation,
                true
            );
        } else {
            const bottomPt = rotatePoint(left, bottom, pointRotation);
            path.lineTo(bottomPt.x, bottomPt.y);
        }

        path.closePath();
    }
}

export function getRadialColumnWidth(startAngle: number, endAngle: number, axisOuterRadius: number, columnWidthRatio: number, maxColumnWidthRatio: number) {
    const rotation = angleBetween(startAngle, endAngle);

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
