import { _Scene, _Util } from 'ag-charts-community';

const { ScenePathChangeDetection, Shape } = _Scene;
const { isNumberEqual, normalizeAngle360 } = _Util;

export class RadialColumn extends _Scene.Path {
    static override className = 'RadialColumn';

    protected static override defaultStyles = Object.assign({}, Shape.defaultStyles, {
        lineWidth: 1,
        fillStyle: null,
    });

    constructor() {
        super();
        this.restoreOwnStyles();
    }

    @ScenePathChangeDetection()
    centerX: number = 0;

    @ScenePathChangeDetection()
    centerY: number = 0;

    @ScenePathChangeDetection()
    innerRadius: number = 0;

    @ScenePathChangeDetection()
    outerRadius: number = 0;

    @ScenePathChangeDetection()
    axisInnerRadius: number = 0;

    @ScenePathChangeDetection()
    axisOuterRadius: number = 0;

    @ScenePathChangeDetection()
    columnWidth: number = 0;

    @ScenePathChangeDetection()
    isBeveled: boolean = false;

    override updatePath(): void {
        if (this.isBeveled) {
            this.updateBeveledPath();
        } else {
            this.updateRectPath();
        }
    }

    private updateRectPath() {
        const { columnWidth, innerRadius, outerRadius, path } = this;
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
    }

    private updateBeveledPath() {
        const { axisInnerRadius, axisOuterRadius, columnWidth, innerRadius, outerRadius, path } = this;

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
        const shouldConnectBottomCircle = isStackBottom && !isNaN(sideRotation) && sideRotation < Math.PI / 6;

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
