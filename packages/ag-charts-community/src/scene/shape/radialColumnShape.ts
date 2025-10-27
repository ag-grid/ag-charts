import { isNumberEqual } from 'ag-charts-core';

import { angleBetween, normalizeAngle360 } from '../../util/angle';
import { BBox } from '../bbox';
import { SceneChangeDetection } from '../changeDetectable';
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
        if (radiusSquared <= xSquared) {
            return null;
        }
        const y = -Math.sqrt(radiusSquared - xSquared);
        const angle = Math.atan2(y, x);
        return { y, angle };
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

    private renderCornerClippingArcs(
        axisOuterRadius: number,
        geometry: BevelGeometry,
        axisOuter: { left: CircleIntersection; right: CircleIntersection; radiusSquared: number },
        renderBottomEdge: () => void
    ) {
        const { path } = this;
        const { right, top, rotation } = geometry;
        const topSquared = top * top;
        const topIntersectionSquared = axisOuter.radiusSquared - topSquared;

        renderBottomEdge();

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

        path.closePath();
    }

    private renderDoubleBevel(
        innerRadius: number,
        outerRadius: number,
        geometry: BevelGeometry,
        inner: { left: CircleIntersection; right: CircleIntersection },
        outer: { left: CircleIntersection; right: CircleIntersection }
    ) {
        const { path } = this;
        const { left, right, rotation } = geometry;

        // Start at bottom-left where left edge meets inner circle
        this.moveToRotated(left, inner.left.y, rotation);

        // Arc along bottom edge (inner circle) from left to right
        path.arc(0, 0, innerRadius, rotation + inner.left.angle, rotation + inner.right.angle, false);

        // Line up right edge from inner to outer circle intersection
        this.lineToRotated(right, outer.right.y, rotation);

        // Arc along top edge (outer circle) from right to left (counterclockwise)
        path.arc(0, 0, outerRadius, rotation + outer.right.angle, rotation + outer.left.angle, true);

        // Close path (implicit line down left edge)
        path.closePath();
    }

    private renderInnerBevelWithCornerClipping(
        innerRadius: number,
        axisOuterRadius: number,
        geometry: BevelGeometry,
        inner: { left: CircleIntersection; right: CircleIntersection },
        axisOuter: { left: CircleIntersection; right: CircleIntersection; radiusSquared: number }
    ) {
        const { path } = this;
        const { left, rotation } = geometry;

        this.renderCornerClippingArcs(axisOuterRadius, geometry, axisOuter, () => {
            this.moveToRotated(left, inner.left.y, rotation);
            path.arc(0, 0, innerRadius, rotation + inner.left.angle, rotation + inner.right.angle, false);
        });
    }

    private renderInnerBevel(
        innerRadius: number,
        geometry: BevelGeometry,
        inner: { left: CircleIntersection; right: CircleIntersection }
    ) {
        const { path } = this;
        const { left, right, top, rotation } = geometry;

        // Start at bottom-left where vertical edge meets the inner arc
        this.moveToRotated(left, inner.left.y, rotation);

        // Arc along the bottom edge from left to right
        path.arc(0, 0, innerRadius, rotation + inner.left.angle, rotation + inner.right.angle, false);

        // Line up the right edge to top-right
        this.lineToRotated(right, top, rotation);

        // Line across the top to top-left
        this.lineToRotated(left, top, rotation);

        // Close path back to start (down the left edge)
        path.closePath();
    }

    private renderCornerBreach(
        axisOuterRadius: number,
        geometry: BevelGeometry,
        axisOuter: { left: CircleIntersection; right: CircleIntersection; radiusSquared: number }
    ) {
        const { left, right, bottom, rotation } = geometry;

        this.renderCornerClippingArcs(axisOuterRadius, geometry, axisOuter, () => {
            this.moveToRotated(left, bottom, rotation);
            this.lineToRotated(right, bottom, rotation);
        });
    }

    private renderOuterBevel(
        outerRadius: number,
        geometry: BevelGeometry,
        outer: { left: CircleIntersection; right: CircleIntersection }
    ) {
        const { path } = this;
        const { left, right, bottom, rotation } = geometry;

        // Start at bottom-left
        this.moveToRotated(left, bottom, rotation);

        // Line across bottom to bottom-right
        this.lineToRotated(right, bottom, rotation);

        // Line up the right edge to top-right where it meets the arc
        this.lineToRotated(right, outer.right.y, rotation);

        // Arc along the top edge from right to left
        path.arc(0, 0, outerRadius, rotation + outer.right.angle, rotation + outer.left.angle, true);

        // Close path back to start (down the left edge)
        path.closePath();
    }

    private updateBeveledPath() {
        // Create a path similar to updateRectangularPath().
        // However we want to improve the visual quality of the beveled path:
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

        // Determine which edges should be beveled based on which axis boundaries the bar touches
        const isTouchingInner = isNumberEqual(innerRadius, axisInnerRadius);
        const isTouchingOuter = isNumberEqual(outerRadius, axisOuterRadius);

        // Check if top corners breach the axis outer radius (independent of touching checks)
        const topLeftRadius = Math.hypot(left, top);
        const topRightRadius = Math.hypot(right, top);
        const topCornersBreach = topLeftRadius > axisOuterRadius || topRightRadius > axisOuterRadius;

        if (!isTouchingInner && !isTouchingOuter && !topCornersBreach) {
            this.updateRectangularPath();
            return;
        }

        path.clear(true);

        // Calculate circle intersections
        const innerRadiusSquared = innerRadius * innerRadius;
        const outerRadiusSquared = outerRadius * outerRadius;
        const innerLeft = this.calculateCircleIntersection(left, innerRadiusSquared);
        const innerRight = this.calculateCircleIntersection(right, innerRadiusSquared);
        const outerLeft = this.calculateCircleIntersection(left, outerRadiusSquared);
        const outerRight = this.calculateCircleIntersection(right, outerRadiusSquared);

        const geometry: BevelGeometry = { left, right, top, bottom, rotation };

        if (isTouchingInner && isTouchingOuter) {
            // Double bevel: both bottom and top edges are curved
            if (!innerLeft || !innerRight || !outerLeft || !outerRight) {
                this.updateRectangularPath();
                return;
            }
            this.renderDoubleBevel(
                innerRadius,
                outerRadius,
                geometry,
                { left: innerLeft, right: innerRight },
                { left: outerLeft, right: outerRight }
            );
        } else if (isTouchingInner) {
            // Single bevel: only bottom edge is curved
            if (!innerLeft || !innerRight) {
                this.updateRectangularPath();
                return;
            }

            if (topCornersBreach) {
                const intersections = this.calculateAxisOuterIntersections(left, right, axisOuterRadius);
                if (!intersections) {
                    this.updateRectangularPath();
                    return;
                }
                this.renderInnerBevelWithCornerClipping(
                    innerRadius,
                    axisOuterRadius,
                    geometry,
                    { left: innerLeft, right: innerRight },
                    intersections
                );
            } else {
                this.renderInnerBevel(innerRadius, geometry, { left: innerLeft, right: innerRight });
            }
        } else if (topCornersBreach) {
            // Corners breach axis outer radius, but not touching inner or outer
            const intersections = this.calculateAxisOuterIntersections(left, right, axisOuterRadius);
            if (!intersections) {
                this.updateRectangularPath();
                return;
            }
            this.renderCornerBreach(axisOuterRadius, geometry, intersections);
        } else {
            // Single bevel: only top edge is curved (touching outer)
            if (!outerLeft || !outerRight) {
                this.updateRectangularPath();
                return;
            }
            this.renderOuterBevel(outerRadius, geometry, { left: outerLeft, right: outerRight });
        }
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
