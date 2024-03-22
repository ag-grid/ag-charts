import { BBox } from '../bbox';
import { isPointInSector } from '../util/sector';
import { Path, ScenePathChangeDetection } from './path';

// https://ag-grid.atlassian.net/wiki/spaces/AG/pages/3090087939/Sector+Corner+Radii
// We only care about values between 0 and 1
// An analytic solution may exist, but I can't find it
// Instead, use interval bisection between these two values
// Pass in negative values for outer radius, positive for inner
function findRadiiScalingFactor(r: number, sweep: number, a: number, b: number) {
    if (a === 0 && b === 0) return 0;

    const fs1 = Math.asin(Math.abs(1 * a) / (r + 1 * a)) + Math.asin(Math.abs(1 * b) / (r + 1 * b)) - sweep;
    if (fs1 < 0) return 1;

    let start = 0;
    let end = 1;
    for (let i = 0; i < 8; i += 1) {
        const s = (start + end) / 2;
        const fs = Math.asin(Math.abs(s * a) / (r + s * a)) + Math.asin(Math.abs(s * b) / (r + s * b)) - sweep;
        if (fs < 0) {
            start = s;
        } else {
            end = s;
        }
    }

    // Ensure we aren't returning scaling values that are too large
    return start;
}

export class Sector extends Path {
    static override readonly className = 'Sector';

    @ScenePathChangeDetection()
    centerX: number = 0;

    @ScenePathChangeDetection()
    centerY: number = 0;

    @ScenePathChangeDetection()
    innerRadius: number = 10;

    @ScenePathChangeDetection()
    outerRadius: number = 20;

    @ScenePathChangeDetection()
    startAngle: number = 0;

    @ScenePathChangeDetection()
    endAngle: number = Math.PI * 2;

    @ScenePathChangeDetection()
    angleOffset: number = 0;

    @ScenePathChangeDetection()
    concentricEdgeInset: number = 0;

    @ScenePathChangeDetection()
    radialEdgeInset: number = 0;

    @ScenePathChangeDetection()
    startOuterCornerRadius: number = 0;

    @ScenePathChangeDetection()
    endOuterCornerRadius: number = 0;

    @ScenePathChangeDetection()
    startInnerCornerRadius: number = 0;

    @ScenePathChangeDetection()
    endInnerCornerRadius: number = 0;

    set inset(value: number) {
        this.concentricEdgeInset = value;
        this.radialEdgeInset = value;
    }

    set cornerRadius(value: number) {
        this.startOuterCornerRadius = value;
        this.endOuterCornerRadius = value;
        this.startInnerCornerRadius = value;
        this.endInnerCornerRadius = value;
    }

    override computeBBox(): BBox {
        const radius = this.outerRadius;
        return new BBox(this.centerX - radius, this.centerY - radius, radius * 2, radius * 2);
    }

    override updatePath(): void {
        const path = this.path;

        const { angleOffset, concentricEdgeInset, radialEdgeInset } = this;
        let { startOuterCornerRadius, endOuterCornerRadius, startInnerCornerRadius, endInnerCornerRadius } = this;
        const startAngle = this.startAngle + angleOffset;
        const endAngle = this.endAngle + angleOffset;
        const sweep = startAngle <= endAngle ? endAngle - startAngle : Math.PI * 2 - (startAngle - endAngle);
        const innerRadius = Math.max(Math.min(this.innerRadius, this.outerRadius) + concentricEdgeInset, 0);
        const outerRadius = Math.max(Math.max(this.innerRadius, this.outerRadius) - concentricEdgeInset, 0);
        const fullPie = sweep >= 2 * Math.PI;
        const centerX = this.centerX;
        const centerY = this.centerY;

        path.clear();

        if (fullPie) {
            path.arc(centerX, centerY, outerRadius, startAngle, endAngle);
            if (innerRadius > concentricEdgeInset) {
                path.moveTo(centerX + innerRadius * Math.cos(endAngle), centerY + innerRadius * Math.sin(endAngle));
                path.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            }
            path.closePath();

            return;
        }

        const innerAngleOffset = innerRadius > 0 ? radialEdgeInset / innerRadius : 0;
        const outerAngleOffset = outerRadius > 0 ? radialEdgeInset / outerRadius : 0;

        const outerAngleExceeded = sweep < 2 * outerAngleOffset;
        if (outerAngleExceeded) return;

        const innerAngleExceeded = innerRadius <= concentricEdgeInset || sweep < 2 * innerAngleOffset;

        let radiusScale = 1;

        const radialLength = outerRadius - innerRadius;
        const maxRadialRadiusLength = Math.max(
            startOuterCornerRadius + startInnerCornerRadius,
            endOuterCornerRadius + endInnerCornerRadius
        );
        const radialScalingFactor = radialLength / maxRadialRadiusLength;
        radiusScale = Math.min(radialScalingFactor, radiusScale);

        const outerScalingFactor = findRadiiScalingFactor(
            outerRadius,
            sweep - 2 * outerAngleOffset,
            -startOuterCornerRadius,
            -endOuterCornerRadius
        );
        radiusScale = Math.min(outerScalingFactor, radiusScale);

        if (innerAngleExceeded || innerRadius === 0) {
            startInnerCornerRadius = 0;
            endInnerCornerRadius = 0;
        } else {
            const innerScalingFactor = findRadiiScalingFactor(
                innerRadius,
                sweep - 2 * innerAngleOffset,
                startOuterCornerRadius,
                endOuterCornerRadius
            );
            radiusScale = Math.min(innerScalingFactor, radiusScale);
        }

        startOuterCornerRadius *= radiusScale;
        endOuterCornerRadius *= radiusScale;
        startInnerCornerRadius *= radiusScale;
        endInnerCornerRadius *= radiusScale;

        let startOuterCornerRadiusAngleSweep = 0;
        let endOuterCornerRadiusAngleSweep = 0;
        const delta = 1e-6;
        const startOuterCornerRadiusSweep = startOuterCornerRadius / (outerRadius - startOuterCornerRadius);
        const endOuterCornerRadiusSweep = endOuterCornerRadius / (outerRadius - endOuterCornerRadius);
        if (startOuterCornerRadiusSweep >= 0 && startOuterCornerRadiusSweep < 1 - delta) {
            startOuterCornerRadiusAngleSweep = Math.asin(startOuterCornerRadiusSweep);
        } else {
            startOuterCornerRadiusAngleSweep = sweep / 2;
            startOuterCornerRadius = outerRadius / (1 / Math.sin(startOuterCornerRadiusAngleSweep) + 1);
        }
        if (endOuterCornerRadiusSweep >= 0 && endOuterCornerRadiusSweep < 1 - delta) {
            endOuterCornerRadiusAngleSweep = Math.asin(endOuterCornerRadiusSweep);
        } else {
            endOuterCornerRadiusAngleSweep = sweep / 2;
            endOuterCornerRadius = outerRadius / (1 / Math.sin(endOuterCornerRadiusAngleSweep) + 1);
        }

        const startInnerCornerRadiusAngleSweep = Math.asin(
            startInnerCornerRadius / (innerRadius + startInnerCornerRadius)
        );
        const endInnerCornerRadiusAngleSweep = Math.asin(endInnerCornerRadius / (innerRadius + endInnerCornerRadius));

        if (innerAngleExceeded) {
            // Draw a wedge on a cartesian co-ordinate with radius `sweep`
            // Inset from bottom - i.e. y = innerRadius
            // Inset the top - i.e. y = (x - x0) * tan(sweep)
            // Form a right angle from the wedge with hypotenuse x0 and an opposite side of innerRadius
            // Gives x0 = inset * sin(sweep)
            // y = inset = (x - inset * sin(sweep)) * tan(sweep) - solve for x
            // This formula has limits (i.e. sweep being >= a quarter turn),
            // but the bounds for x should be [innerRadius, outerRadius)
            const x = sweep < Math.PI * 0.5 ? (radialEdgeInset * (1 + Math.cos(sweep))) / Math.sin(sweep) : NaN;
            // r = sqrt(x**2 + y**2)
            let r: number;
            if (x > 0 && x < outerRadius) {
                // Even within the formula limits, floating point precision isn't always enough,
                // so ensure we never go less than the inner radius
                r = Math.max(Math.hypot(radialEdgeInset, x), innerRadius);
            } else {
                // Formula limits exceeded - just use the inner radius
                r = innerRadius;
            }
            const midAngle = startAngle + sweep * 0.5;
            path.moveTo(centerX + r * Math.cos(midAngle), centerY + r * Math.sin(midAngle));
        } else {
            path.moveTo(
                centerX + (innerRadius + startInnerCornerRadius) * Math.cos(startAngle + innerAngleOffset),
                centerY + (innerRadius + startInnerCornerRadius) * Math.sin(startAngle + innerAngleOffset)
            );
        }

        if (startOuterCornerRadius > 0) {
            const cx =
                centerX +
                (outerRadius - startOuterCornerRadius) *
                    Math.cos(startAngle + outerAngleOffset + startOuterCornerRadiusAngleSweep);
            const cy =
                centerY +
                (outerRadius - startOuterCornerRadius) *
                    Math.sin(startAngle + outerAngleOffset + startOuterCornerRadiusAngleSweep);
            path.arc(
                cx,
                cy,
                startOuterCornerRadius,
                startAngle - Math.PI * 0.5,
                startAngle + startOuterCornerRadiusAngleSweep
            );
        }

        if (endOuterCornerRadiusAngleSweep + startOuterCornerRadiusAngleSweep < sweep - 2 * outerAngleOffset) {
            path.arc(
                centerX,
                centerY,
                outerRadius,
                startAngle + outerAngleOffset + startOuterCornerRadiusAngleSweep,
                endAngle - outerAngleOffset - endOuterCornerRadiusAngleSweep
            );
        }

        if (endOuterCornerRadius > 0) {
            const cx =
                centerX +
                (outerRadius - endOuterCornerRadius) *
                    Math.cos(endAngle - outerAngleOffset - endOuterCornerRadiusAngleSweep);
            const cy =
                centerY +
                (outerRadius - endOuterCornerRadius) *
                    Math.sin(endAngle - outerAngleOffset - endOuterCornerRadiusAngleSweep);
            path.arc(cx, cy, endOuterCornerRadius, endAngle - endOuterCornerRadiusAngleSweep, endAngle + Math.PI * 0.5);
        }

        if (innerAngleExceeded) {
            // Ignore - completed by closePath
        } else if (innerRadius > 0) {
            if (endInnerCornerRadius > 0) {
                const cx =
                    centerX +
                    (innerRadius + endInnerCornerRadius) *
                        Math.cos(endAngle - innerAngleOffset - endInnerCornerRadiusAngleSweep);
                const cy =
                    centerY +
                    (innerRadius + endInnerCornerRadius) *
                        Math.sin(endAngle - innerAngleOffset - endInnerCornerRadiusAngleSweep);
                path.arc(
                    cx,
                    cy,
                    endInnerCornerRadius,
                    endAngle + Math.PI * 0.5,
                    endAngle + Math.PI - endInnerCornerRadiusAngleSweep
                );
            }

            // Floating point errors can cause this arc to be flipped
            if (endInnerCornerRadiusAngleSweep + startInnerCornerRadiusAngleSweep < sweep - 2 * innerAngleOffset) {
                path.arc(
                    centerX,
                    centerY,
                    innerRadius,
                    endAngle - innerAngleOffset - endInnerCornerRadiusAngleSweep,
                    startAngle + innerAngleOffset + startInnerCornerRadiusAngleSweep,
                    true
                );
            }

            if (startInnerCornerRadius > 0) {
                const cx =
                    centerX +
                    (innerRadius + startInnerCornerRadius) *
                        Math.cos(startAngle + innerAngleOffset + startInnerCornerRadiusAngleSweep);
                const cy =
                    centerY +
                    (innerRadius + startInnerCornerRadius) *
                        Math.sin(startAngle + innerAngleOffset + startInnerCornerRadiusAngleSweep);
                path.arc(
                    cx,
                    cy,
                    startInnerCornerRadius,
                    startAngle + Math.PI + startInnerCornerRadiusAngleSweep,
                    startAngle - Math.PI * 0.5
                );
            }
        } else {
            path.lineTo(centerX, centerY);
        }

        path.closePath();
    }

    override isPointInPath(x: number, y: number): boolean {
        const { angleOffset } = this;
        const startAngle = this.startAngle + angleOffset;
        const endAngle = this.endAngle + angleOffset;
        const innerRadius = Math.min(this.innerRadius, this.outerRadius);
        const outerRadius = Math.max(this.innerRadius, this.outerRadius);

        const point = this.transformPoint(x, y);

        return isPointInSector(point.x, point.y, { startAngle, endAngle, innerRadius, outerRadius });
    }
}
