import { _Scene, _Util } from 'ag-charts-community';

const { Path, Path2D, ScenePathChangeDetection } = _Scene;
const { isNumberEqual, normalizeAngle360 } = _Util;

export class RadialColumnShape extends Path {
    static override className = 'RadialColumnShape';

    readonly borderPath = new Path2D();

    @ScenePathChangeDetection()
    axisIsCircle: boolean = true;

    @ScenePathChangeDetection()
    columnWidth: number = 0;

    @ScenePathChangeDetection()
    outerRadius: number = 0;

    @ScenePathChangeDetection()
    innerRadius: number = 0;

    @ScenePathChangeDetection()
    axisInnerRadius: number = 0;

    @ScenePathChangeDetection()
    axisOuterRadius: number = 0;

    override updatePath() {
        const { axisIsCircle, path } = this;

        path.clear({ trackChanges: true });
        if (!axisIsCircle) {
            const { columnWidth, outerRadius, innerRadius } = this;

            const left = -columnWidth / 2;
            const right = columnWidth / 2;
            const top = -outerRadius;
            const bottom = -innerRadius;

            path.moveTo(left, bottom);
            path.lineTo(left, top);
            path.lineTo(right, top);
            path.lineTo(right, bottom);
            path.lineTo(left, bottom);
            path.closePath();
        } else {
            this.updateCircularPath();
        }

        this.checkPathDirty();
    }

    private updateCircularPath() {
        const { axisIsCircle, path, columnWidth, outerRadius, innerRadius, axisInnerRadius, axisOuterRadius } = this;

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
    }
}
