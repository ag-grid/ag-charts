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
    isBeveled: boolean = true;

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
        return normalizeAngle360(startAngle + midAngle / 2 + Math.PI / 2);
    }

    override updatePath() {
        const { isBeveled } = this;

        if (isBeveled) {
            this.updateBeveledPath();
        } else {
            this.updateRectangularPath();
        }

        this.checkPathDirty();
    }

    private updateRectangularPath() {
        const { columnWidth, innerRadius, outerRadius, path } = this;

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

        path.clear({ trackChanges: true });

        path.moveTo(points[0].x, points[0].y);
        path.lineTo(points[1].x, points[1].y);
        path.lineTo(points[2].x, points[2].y);
        path.lineTo(points[3].x, points[3].y);
        path.lineTo(points[0].x, points[0].y);

        path.closePath();
    }

    private updateBeveledPath() {
        const { columnWidth, path, outerRadius, innerRadius, axisInnerRadius, axisOuterRadius } = this;

        const isStackBottom = isNumberEqual(innerRadius, axisInnerRadius);
        const sideRotation = Math.asin(columnWidth / 2 / innerRadius);
        const pointRotation = this.getRotation();
        const rotate = (x: number, y: number) => rotatePoint(x, y, pointRotation);

        const getTriangleHypotenuse = (leg: number, otherLeg: number) => Math.sqrt(leg ** 2 + otherLeg ** 2);
        const getTriangleLeg = (hypotenuse: number, otherLeg: number) => {
            if (otherLeg > hypotenuse) {
                return 0;
            }
            return Math.sqrt(hypotenuse ** 2 - otherLeg ** 2);
        };

        // Avoid the connecting lines to be too long
        const shouldConnectBottomCircle = isStackBottom && !isNaN(sideRotation) && sideRotation < Math.PI / 6;

        let left = -columnWidth / 2;
        let right = columnWidth / 2;
        const top = -outerRadius;
        const bottom = -innerRadius * (shouldConnectBottomCircle ? Math.cos(sideRotation) : 1);

        const hasBottomIntersection = axisOuterRadius < getTriangleHypotenuse(innerRadius, columnWidth / 2);
        if (hasBottomIntersection) {
            // Crop bottom side overflowing outer radius
            const bottomIntersectionX = getTriangleLeg(axisOuterRadius, innerRadius);
            left = -bottomIntersectionX;
            right = bottomIntersectionX;
        }

        path.clear({ trackChanges: true });

        // Bottom-left point
        const bottomLeftPt = rotate(left, bottom);
        path.moveTo(bottomLeftPt.x, bottomLeftPt.y);

        // Top
        const isEmpty = isNumberEqual(innerRadius, outerRadius);
        const hasSideIntersection = axisOuterRadius < getTriangleHypotenuse(outerRadius, columnWidth / 2);
        if (isEmpty && shouldConnectBottomCircle) {
            // A single line across the axis inner radius
            path.arc(
                0,
                0,
                innerRadius,
                normalizeAngle360(-sideRotation - Math.PI / 2) + pointRotation,
                normalizeAngle360(sideRotation - Math.PI / 2) + pointRotation,
                false
            );
        } else if (hasSideIntersection) {
            // Crop top side overflowing outer radius
            const sideIntersectionY = -getTriangleLeg(axisOuterRadius, columnWidth / 2);
            const topIntersectionX = getTriangleLeg(axisOuterRadius, outerRadius);
            if (!hasBottomIntersection) {
                const topLeftPt = rotate(left, sideIntersectionY);
                path.lineTo(topLeftPt.x, topLeftPt.y);
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
                // Connecting line between two top bevels
                const topRightBevelPt = rotate(topIntersectionX, top);
                path.lineTo(topRightBevelPt.x, topRightBevelPt.y);
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
            // Basic connecting line
            const topLeftPt = rotate(left, top);
            const topRightPt = rotate(right, top);
            path.lineTo(topLeftPt.x, topLeftPt.y);
            path.lineTo(topRightPt.x, topRightPt.y);
        }

        // Bottom
        const bottomRightPt = rotate(right, bottom);
        path.lineTo(bottomRightPt.x, bottomRightPt.y);
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
            const bottomLeftPt = rotate(left, bottom);
            path.lineTo(bottomLeftPt.x, bottomLeftPt.y);
        }

        path.closePath();
    }
}

export function getRadialColumnWidth(
    startAngle: number,
    endAngle: number,
    axisOuterRadius: number,
    columnWidthRatio: number,
    maxColumnWidthRatio: number
) {
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
