import { SceneChangeDetection, angleBetween, isNumberEqual, normalizeAngle360 } from 'ag-charts-core';

import { BBox } from '../bbox';
import { Path } from './path';

function rotatePoint(x: number, y: number, rotation: number) {
    const radius = Math.hypot(x, y);
    const angle = Math.atan2(y, x);
    const rotated = angle + rotation;
    return {
        x: Math.cos(rotated) * radius,
        y: Math.sin(rotated) * radius,
    };
}

interface CircleIntersection {
    y: number;
    angle: number;
}

interface BevelGeometry {
    left: number;
    right: number;
    top: number;
    bottom: number;
    rotation: number;
}

export class RadialColumnShape<D = any> extends Path<D> {
    static override readonly className = 'RadialColumnShape';

    @SceneChangeDetection()
    isBeveled: boolean = true;

    @SceneChangeDetection()
    columnWidth: number = 0;

    @SceneChangeDetection()
    startAngle: number = 0;

    @SceneChangeDetection()
    endAngle: number = 0;

    @SceneChangeDetection()
    outerRadius: number = 0;

    @SceneChangeDetection()
    innerRadius: number = 0;

    @SceneChangeDetection()
    axisInnerRadius: number = 0;

    @SceneChangeDetection()
    axisOuterRadius: number = 0;

    set cornerRadius(_value: number) {
        // TODO implement cornerRadius support
    }

    protected override computeBBox(): BBox {
        const { columnWidth } = this;
        const [innerRadius, outerRadius] = this.normalizeRadii(this.innerRadius, this.outerRadius);

        const rotation = this.getRotation();
        const left = -columnWidth / 2;
        const right = columnWidth / 2;
        const top = -outerRadius;
        const bottom = -innerRadius;

        let x0 = Infinity;
        let y0 = Infinity;
        let x1 = -Infinity;
        let y1 = -Infinity;

        for (let i = 0; i < 4; i += 1) {
            const { x, y } = rotatePoint(i % 2 === 0 ? left : right, i < 2 ? top : bottom, rotation);
            x0 = Math.min(x, x0);
            y0 = Math.min(y, y0);
            x1 = Math.max(x, x1);
            y1 = Math.max(y, y1);
        }

        return new BBox(x0, y0, x1 - x0, y1 - y0);
    }

    private getRotation() {
        const { startAngle, endAngle } = this;
        const midAngle = angleBetween(startAngle, endAngle);
        return normalizeAngle360(startAngle + midAngle / 2 + Math.PI / 2);
    }

    private normalizeRadii(innerRadius: number, outerRadius: number): [number, number] {
        if (innerRadius > outerRadius) {
            return [outerRadius, innerRadius];
        }
        return [innerRadius, outerRadius];
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
        const { columnWidth, path } = this;
        const [innerRadius, outerRadius] = this.normalizeRadii(this.innerRadius, this.outerRadius);

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
        ].map(([x, y]) => rotatePoint(x, y, rotation));

        path.clear(true);

        path.moveTo(points[0].x, points[0].y);
        path.lineTo(points[1].x, points[1].y);
        path.lineTo(points[2].x, points[2].y);
        path.lineTo(points[3].x, points[3].y);

        path.closePath();
    }

    private calculateCircleIntersection(x: number, radiusSquared: number): CircleIntersection | null {
        const xSquared = x * x;
        if (radiusSquared < xSquared) {
            return null;
        }
        const y = -Math.sqrt(radiusSquared - xSquared);
        const angle = Math.atan2(y, x);
        return { y, angle };
    }

    private calculateBothIntersections(left: number, right: number, radius: number) {
        const radiusSquared = radius * radius;
        const leftInt = this.calculateCircleIntersection(left, radiusSquared);
        const rightInt = this.calculateCircleIntersection(right, radiusSquared);

        if (!leftInt || !rightInt) {
            return null;
        }

        return { left: leftInt, right: rightInt };
    }

    private calculateAxisOuterIntersections(left: number, right: number, axisOuterRadius: number) {
        const axisOuterRadiusSquared = axisOuterRadius * axisOuterRadius;
        const axisOuterLeft = this.calculateCircleIntersection(left, axisOuterRadiusSquared);
        const axisOuterRight = this.calculateCircleIntersection(right, axisOuterRadiusSquared);

        if (!axisOuterLeft || !axisOuterRight) {
            return null;
        }

        return {
            left: axisOuterLeft,
            right: axisOuterRight,
            radiusSquared: axisOuterRadiusSquared,
        };
    }

    private moveToRotated(x: number, y: number, rotation: number) {
        const point = rotatePoint(x, y, rotation);
        this.path.moveTo(point.x, point.y);
    }

    private lineToRotated(x: number, y: number, rotation: number) {
        const point = rotatePoint(x, y, rotation);
        this.path.lineTo(point.x, point.y);
    }

    private renderTopWithCornerClipping(
        axisOuterRadius: number,
        axisOuter: { left: CircleIntersection; right: CircleIntersection; radiusSquared: number },
        geometry: BevelGeometry
    ) {
        const { path } = this;
        const { right, top, rotation } = geometry;
        const topSquared = top * top;
        const topIntersectionSquared = axisOuter.radiusSquared - topSquared;

        if (topIntersectionSquared <= 0) {
            // Top edge is entirely outside the axis outer radius - use continuous arc
            this.lineToRotated(right, axisOuter.right.y, rotation);
            path.arc(0, 0, axisOuterRadius, rotation + axisOuter.right.angle, rotation + axisOuter.left.angle, true);
        } else {
            // Top edge intersects the circle - straight section with clipped corners
            const topIntersectionX = Math.sqrt(topIntersectionSquared);
            const topRightAngle = Math.atan2(top, topIntersectionX);
            const topLeftAngle = Math.atan2(top, -topIntersectionX);

            this.lineToRotated(right, axisOuter.right.y, rotation);
            path.arc(0, 0, axisOuterRadius, rotation + axisOuter.right.angle, rotation + topRightAngle, true);

            this.lineToRotated(-topIntersectionX, top, rotation);
            path.arc(0, 0, axisOuterRadius, rotation + topLeftAngle, rotation + axisOuter.left.angle, true);
        }
    }

    private updateBeveledPath() {
        // Create a path similar to updateRectangularPath().
        // However we want to improve the visual quality of the bevelled path:
        // - If the bar is growing outwards and starting from the inner radius, the bottom edge should curve around the inner radius.
        // - If the bar is growing inwards and starting from the outer radius, the top edge should curve around the outer radius.
        // - If the bar spans the entire radius range, both edges should be curved.
        // - If the corners breach a radius, those corners should follow the arc while maintaining straight perpendicular sections.

        const { columnWidth, path, axisInnerRadius, axisOuterRadius } = this;
        const [innerRadius, outerRadius] = this.normalizeRadii(this.innerRadius, this.outerRadius);

        const left = -columnWidth / 2;
        const right = columnWidth / 2;
        const top = -outerRadius;
        const bottom = -innerRadius;
        const rotation = this.getRotation();

        const isTouchingInner = isNumberEqual(innerRadius, axisInnerRadius);
        const isTouchingOuter = isNumberEqual(outerRadius, axisOuterRadius);
        const topCornersBreach = Math.hypot(left, top) > axisOuterRadius || Math.hypot(right, top) > axisOuterRadius;

        // Early exit if no bevelling needed
        if (!isTouchingInner && !isTouchingOuter && !topCornersBreach) {
            this.updateRectangularPath();
            return;
        }

        // Calculate only the intersections we need
        const inner = isTouchingInner ? this.calculateBothIntersections(left, right, innerRadius) : null;
        const outer = isTouchingOuter ? this.calculateBothIntersections(left, right, outerRadius) : null;
        const axisOuter = topCornersBreach ? this.calculateAxisOuterIntersections(left, right, axisOuterRadius) : null;

        // Single validation point: if expected intersections are missing, fall back
        if ((isTouchingInner && !inner) || (isTouchingOuter && !outer) || (topCornersBreach && !axisOuter)) {
            this.updateRectangularPath();
            return;
        }

        path.clear(true);
        const geometry: BevelGeometry = { left, right, top, bottom, rotation };

        // Walk clockwise around the shape starting from bottom-left
        // 1. Start at bottom-left corner
        if (inner) {
            this.moveToRotated(left, inner.left.y, rotation);
        } else {
            this.moveToRotated(left, bottom, rotation);
        }

        // 2. Bottom edge (horizontal)
        if (inner) {
            path.arc(0, 0, innerRadius, rotation + inner.left.angle, rotation + inner.right.angle, false);
        } else {
            this.lineToRotated(right, bottom, rotation);
        }

        // 3. Right edge (vertical) + Top edge (horizontal with potential clipping)
        if (outer) {
            // Simple outer arc case
            this.lineToRotated(right, outer.right.y, rotation);
            path.arc(0, 0, outerRadius, rotation + outer.right.angle, rotation + outer.left.angle, true);
        } else if (axisOuter) {
            // Corner clipping case
            this.renderTopWithCornerClipping(axisOuterRadius, axisOuter, geometry);
        } else {
            // Straight top case
            this.lineToRotated(right, top, rotation);
            this.lineToRotated(left, top, rotation);
        }

        // 4. Left edge (implicit via closePath)
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

    if (rotation < 1e-3) {
        return 2 * axisOuterRadius * maxColumnWidthRatio;
    }

    if (rotation >= 2 * Math.PI) {
        const midAngle = startAngle + rotation / 2;
        startAngle = midAngle - Math.PI;
        endAngle = midAngle + Math.PI;
    }

    const startX = axisOuterRadius * Math.cos(startAngle);
    const startY = axisOuterRadius * Math.sin(startAngle);
    const endX = axisOuterRadius * Math.cos(endAngle);
    const endY = axisOuterRadius * Math.sin(endAngle);

    const colWidth = Math.floor(Math.hypot(startX - endX, startY - endY));
    const maxWidth = 2 * axisOuterRadius * maxColumnWidthRatio;

    return Math.max(1, Math.min(maxWidth, colWidth));
}
