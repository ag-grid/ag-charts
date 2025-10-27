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

    @SceneChangeDetection()
    isRadiusAxisReversed?: boolean = false;

    set cornerRadius(_value: number) {
        // TODO implement cornerRadius support
    }

    protected override computeBBox(): BBox {
        const { columnWidth } = this;
        let { innerRadius, outerRadius } = this;
        if (innerRadius > outerRadius) {
            [innerRadius, outerRadius] = [outerRadius, innerRadius];
        }

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
        let { innerRadius, outerRadius } = this;
        const { columnWidth, path } = this;
        if (innerRadius > outerRadius) {
            [innerRadius, outerRadius] = [outerRadius, innerRadius];
        }

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

    private calculateCircleIntersection(x: number, radiusSquared: number) {
        const xSquared = x * x;
        if (radiusSquared <= xSquared) {
            return null;
        }
        const y = -Math.sqrt(radiusSquared - xSquared);
        const angle = Math.atan2(y, x);
        return { y, angle };
    }

    private updateBeveledPath() {
        // Create a path similar to updateRectangularPath().
        // However we want to improve the visual quality of the beveled path:
        // - If the bar is growing outwards and starting from the inner radius, the bottom edge should curve around the inner radius.
        // - If the bar is growing inwards and starting from the outer radius, the top edge should curve around the outer radius.
        // - If the bar spans the entire radius range, both edges should be curved.
        // - If the corners breach a radius, those corners should follow the arc while maintaining straight perpendicular sections.

        let { innerRadius, outerRadius } = this;
        const { columnWidth, path, axisInnerRadius, axisOuterRadius } = this;
        if (innerRadius > outerRadius) {
            [innerRadius, outerRadius] = [outerRadius, innerRadius];
        }

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

        const innerRadiusSquared = innerRadius * innerRadius;
        const outerRadiusSquared = outerRadius * outerRadius;

        // Calculate intersections for circles
        const innerLeft = this.calculateCircleIntersection(left, innerRadiusSquared);
        const innerRight = this.calculateCircleIntersection(right, innerRadiusSquared);
        const outerLeft = this.calculateCircleIntersection(left, outerRadiusSquared);
        const outerRight = this.calculateCircleIntersection(right, outerRadiusSquared);

        if (isTouchingInner && isTouchingOuter) {
            // Double bevel: both bottom and top edges are curved
            if (!innerLeft || !innerRight || !outerLeft || !outerRight) {
                this.updateRectangularPath();
                return;
            }

            // Start at bottom-left where left edge meets inner circle
            const startPoint = rotatePoint(left, innerLeft.y, rotation);
            path.moveTo(startPoint.x, startPoint.y);

            // Arc along bottom edge (inner circle) from left to right
            path.arc(0, 0, innerRadius, rotation + innerLeft.angle, rotation + innerRight.angle, false);

            // Line up right edge from inner to outer circle intersection
            const topRightPoint = rotatePoint(right, outerRight.y, rotation);
            path.lineTo(topRightPoint.x, topRightPoint.y);

            // Arc along top edge (outer circle) from right to left (counterclockwise)
            path.arc(0, 0, outerRadius, rotation + outerRight.angle, rotation + outerLeft.angle, true);

            // Close path (implicit line down left edge)
            path.closePath();
        } else if (isTouchingInner) {
            // Single bevel: only bottom edge is curved
            if (!innerLeft || !innerRight) {
                this.updateRectangularPath();
                return;
            }

            if (topCornersBreach) {
                // Corners breach the axis outer radius - need to clip them with arcs
                // The top edge should remain straight, but corners are replaced with arcs
                const axisOuterRadiusSquared = axisOuterRadius * axisOuterRadius;

                // Find where the vertical sides intersect the axis outer radius
                const axisOuterLeft = this.calculateCircleIntersection(left, axisOuterRadiusSquared);
                const axisOuterRight = this.calculateCircleIntersection(right, axisOuterRadiusSquared);

                if (!axisOuterLeft || !axisOuterRight) {
                    // Column is too wide for the axis outer radius - fall back to rectangular
                    this.updateRectangularPath();
                    return;
                }

                // Find where the horizontal top edge (at y = top) intersects the axis outer radius
                const topSquared = top * top;
                const topIntersectionSquared = axisOuterRadiusSquared - topSquared;

                if (topIntersectionSquared <= 0) {
                    // Top edge is entirely outside the axis outer radius
                    // Use a continuous arc (no straight section possible)
                    const startPoint = rotatePoint(left, innerLeft.y, rotation);
                    path.moveTo(startPoint.x, startPoint.y);

                    path.arc(0, 0, innerRadius, rotation + innerLeft.angle, rotation + innerRight.angle, false);

                    const axisOuterRightPoint = rotatePoint(right, axisOuterRight.y, rotation);
                    path.lineTo(axisOuterRightPoint.x, axisOuterRightPoint.y);

                    path.arc(
                        0,
                        0,
                        axisOuterRadius,
                        rotation + axisOuterRight.angle,
                        rotation + axisOuterLeft.angle,
                        true
                    );

                    path.closePath();
                } else {
                    // Top edge intersects the circle - we can have a straight section with clipped corners
                    const topIntersectionX = Math.sqrt(topIntersectionSquared);
                    const topRightAngle = Math.atan2(top, topIntersectionX);
                    const topLeftAngle = Math.atan2(top, -topIntersectionX);

                    // Start at bottom-left where vertical edge meets the inner arc
                    const startPoint = rotatePoint(left, innerLeft.y, rotation);
                    path.moveTo(startPoint.x, startPoint.y);

                    // Arc along the bottom edge from left to right
                    path.arc(0, 0, innerRadius, rotation + innerLeft.angle, rotation + innerRight.angle, false);

                    // Line up the right edge to where it meets the axis outer radius
                    const axisOuterRightPoint = rotatePoint(right, axisOuterRight.y, rotation);
                    path.lineTo(axisOuterRightPoint.x, axisOuterRightPoint.y);

                    // Arc along the axis outer radius from right side up to top-right intersection
                    // Going from a more negative angle (axisOuterRight) to a less negative angle (topRight)
                    // This should be counterclockwise (anticlockwise=true)
                    path.arc(0, 0, axisOuterRadius, rotation + axisOuterRight.angle, rotation + topRightAngle, true);

                    // Straight line across the top from (topIntersectionX, top) to (-topIntersectionX, top)
                    // This is the straight top edge of the bar
                    const topLeftPoint = rotatePoint(-topIntersectionX, top, rotation);
                    path.lineTo(topLeftPoint.x, topLeftPoint.y);

                    // Arc along the axis outer radius from top-left intersection down to left side
                    // Going from a less negative angle (topLeft) to a more negative angle (axisOuterLeft)
                    // This should be counterclockwise (anticlockwise=true)
                    path.arc(0, 0, axisOuterRadius, rotation + topLeftAngle, rotation + axisOuterLeft.angle, true);

                    // Close path back to start (down the left edge)
                    path.closePath();
                }
            } else {
                // Normal case: corners don't breach the axis outer radius
                // Start at bottom-left where vertical edge meets the inner arc
                const startPoint = rotatePoint(left, innerLeft.y, rotation);
                path.moveTo(startPoint.x, startPoint.y);

                // Arc along the bottom edge from left to right
                path.arc(0, 0, innerRadius, rotation + innerLeft.angle, rotation + innerRight.angle, false);

                // Line up the right edge to top-right
                const topRight = rotatePoint(right, top, rotation);
                path.lineTo(topRight.x, topRight.y);

                // Line across the top to top-left
                const topLeft = rotatePoint(left, top, rotation);
                path.lineTo(topLeft.x, topLeft.y);

                // Close path back to start (down the left edge)
                path.closePath();
            }
        } else if (topCornersBreach) {
            // Corners breach axis outer radius, but not touching inner or outer
            // This happens with stacked bars - need to clip the corners
            const axisOuterRadiusSquared = axisOuterRadius * axisOuterRadius;

            // Find where the vertical sides intersect the axis outer radius
            const axisOuterLeft = this.calculateCircleIntersection(left, axisOuterRadiusSquared);
            const axisOuterRight = this.calculateCircleIntersection(right, axisOuterRadiusSquared);

            if (!axisOuterLeft || !axisOuterRight) {
                // Column is too wide for the axis outer radius - fall back to rectangular
                this.updateRectangularPath();
                return;
            }

            // Find where the horizontal top edge (at y = top) intersects the axis outer radius
            const topSquared = top * top;
            const topIntersectionSquared = axisOuterRadiusSquared - topSquared;

            if (topIntersectionSquared <= 0) {
                // Top edge is entirely outside the axis outer radius
                // Use a continuous arc at the top (no straight section possible)
                const bottomLeft = rotatePoint(left, bottom, rotation);
                path.moveTo(bottomLeft.x, bottomLeft.y);

                const bottomRight = rotatePoint(right, bottom, rotation);
                path.lineTo(bottomRight.x, bottomRight.y);

                const axisOuterRightPoint = rotatePoint(right, axisOuterRight.y, rotation);
                path.lineTo(axisOuterRightPoint.x, axisOuterRightPoint.y);

                path.arc(
                    0,
                    0,
                    axisOuterRadius,
                    rotation + axisOuterRight.angle,
                    rotation + axisOuterLeft.angle,
                    true
                );

                path.closePath();
            } else {
                // Top edge intersects the circle - we can have a straight section with clipped corners
                const topIntersectionX = Math.sqrt(topIntersectionSquared);
                const topRightAngle = Math.atan2(top, topIntersectionX);
                const topLeftAngle = Math.atan2(top, -topIntersectionX);

                // Start at bottom-left
                const bottomLeft = rotatePoint(left, bottom, rotation);
                path.moveTo(bottomLeft.x, bottomLeft.y);

                // Line across bottom to bottom-right
                const bottomRight = rotatePoint(right, bottom, rotation);
                path.lineTo(bottomRight.x, bottomRight.y);

                // Line up the right edge to where it meets the axis outer radius
                const axisOuterRightPoint = rotatePoint(right, axisOuterRight.y, rotation);
                path.lineTo(axisOuterRightPoint.x, axisOuterRightPoint.y);

                // Arc along the axis outer radius from right side up to top-right intersection
                path.arc(0, 0, axisOuterRadius, rotation + axisOuterRight.angle, rotation + topRightAngle, true);

                // Straight line across the top from (topIntersectionX, top) to (-topIntersectionX, top)
                const topLeftPoint = rotatePoint(-topIntersectionX, top, rotation);
                path.lineTo(topLeftPoint.x, topLeftPoint.y);

                // Arc along the axis outer radius from top-left intersection down to left side
                path.arc(0, 0, axisOuterRadius, rotation + topLeftAngle, rotation + axisOuterLeft.angle, true);

                // Close path back to start (down the left edge)
                path.closePath();
            }
        } else {
            // Single bevel: only top edge is curved (touching outer)
            if (!outerLeft || !outerRight) {
                this.updateRectangularPath();
                return;
            }

            // Start at bottom-left
            const bottomLeft = rotatePoint(left, bottom, rotation);
            path.moveTo(bottomLeft.x, bottomLeft.y);

            // Line across bottom to bottom-right
            const bottomRight = rotatePoint(right, bottom, rotation);
            path.lineTo(bottomRight.x, bottomRight.y);

            // Line up the right edge to top-right where it meets the arc
            const topRightPoint = rotatePoint(right, outerRight.y, rotation);
            path.lineTo(topRightPoint.x, topRightPoint.y);

            // Arc along the top edge from right to left
            path.arc(0, 0, outerRadius, rotation + outerRight.angle, rotation + outerLeft.angle, true);

            // Close path back to start (down the left edge)
            path.closePath();
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
