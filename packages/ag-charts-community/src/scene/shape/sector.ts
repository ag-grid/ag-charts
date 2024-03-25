import { normalizeAngle360 } from '../../util/angle';
import { BBox } from '../bbox';
import { isPointInSector } from '../util/sector';
import { Path, ScenePathChangeDetection } from './path';

// https://ag-grid.atlassian.net/wiki/spaces/AG/pages/3090087939/Sector+Corner+Radii
// We only care about values between 0 and 1
// An analytic solution may exist, but I can't find it
// Instead, use interval bisection between these two values
// Pass in negative values for outer radius, positive for inner
function radiiScalingFactor(r: number, sweep: number, a: number, b: number) {
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

function arcIntersectionPoint(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
    clipAngle: number
) {
    // y = x tan a
    // (x - cx)^2 + (y - cy)^2 - r^2 = 0
    // x^2 - 2 x cx + cx ^2 + y^2 - 2 y cy + cy ^2 - r^2 = 0
    // x^2 (1 + tan^2 a) + x * -2 (cx + cy tan a) + (cx^2 + cy^2 - r^2)
    // OR
    // y^2 (1 + cot^2 a) + y * -2 (cy + cx cot a) + (cy^2 + cx^2 - r^2)
    const sinA = Math.sin(clipAngle);
    const cosA = Math.cos(clipAngle);
    const c = cx ** 2 + cy ** 2 - r ** 2;

    let p0x = NaN;
    let p0y = NaN;
    let p1x = NaN;
    let p1y = NaN;
    if (cosA > 0.5) {
        const tanA = sinA / cosA;
        const a = 1 + tanA ** 2;
        const b = -2 * (cx + cy * tanA);
        const d = b ** 2 - 4 * a * c;
        if (d < 0) return;

        const x0 = (-b + Math.sqrt(d)) / (2 * a);
        const x1 = (-b - Math.sqrt(d)) / (2 * a);

        p0x = x0;
        p0y = x0 * tanA;
        p1x = x1;
        p1y = x1 * tanA;
    } else {
        const cotA = cosA / sinA;
        const a = 1 + cotA ** 2;
        const b = -2 * (cy + cx * cotA);
        const d = b ** 2 - 4 * a * c;
        if (d < 0) return;

        const y0 = (-b + Math.sqrt(d)) / (2 * a);
        const y1 = (-b - Math.sqrt(d)) / (2 * a);

        p0x = y0 * cotA;
        p0y = y0;
        p1x = y1 * cotA;
        p1y = y1;
    }

    const startAngleTurns = Math.floor(startAngle / (2 * Math.PI)) * 2 * Math.PI;
    const a0 = normalizeAngle360(Math.atan2(p0y - cy, p0x - cx)) + startAngleTurns;
    const a1 = normalizeAngle360(Math.atan2(p1y - cy, p1x - cx)) + startAngleTurns;

    if (a0 >= startAngle && a0 <= endAngle) {
        return a0;
    } else if (a1 >= startAngle && a1 <= endAngle) {
        return a1;
    }
}

type Arc = {
    cx: number;
    cy: number;
    r: number;
    a0: number;
    a1: number;
};

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
    clipStartAngle: number | undefined = undefined;

    @ScenePathChangeDetection()
    clipEndAngle: number | undefined = undefined;

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

    @ScenePathChangeDetection()
    scaleCornerRadiiIndependently: boolean = false;

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

    private getAngleOffset(radius: number) {
        return radius > 0 ? this.radialEdgeInset / radius : 0;
    }

    private arc(
        r: number,
        angleSweep: number,
        a0: number,
        a1: number,
        start: boolean,
        inner: boolean
    ): Arc | undefined {
        if (r <= 0) return;

        const { startAngle, endAngle, clipStartAngle, clipEndAngle, concentricEdgeInset } = this;
        const innerRadius = Math.max(Math.min(this.innerRadius, this.outerRadius) + concentricEdgeInset, 0);
        const outerRadius = Math.max(Math.max(this.innerRadius, this.outerRadius) - concentricEdgeInset, 0);

        const innerAngleOffset = this.getAngleOffset(innerRadius);
        const outerAngleOffset = this.getAngleOffset(outerRadius);

        const angleOffset = inner ? this.getAngleOffset(innerRadius + r) : this.getAngleOffset(outerRadius - r);
        const angle = start ? startAngle + angleOffset + angleSweep : endAngle - angleOffset - angleSweep;

        if (start && clipStartAngle != null && !(angle >= clipStartAngle && angle <= endAngle)) return;
        if (!start && clipEndAngle != null && !(angle >= startAngle && angle <= clipEndAngle)) return;

        let cx: number;
        let cy: number;
        let clipStart: number | undefined;
        let clipEnd: number | undefined;
        if (inner) {
            if (innerRadius <= 0) return;

            cx = (innerRadius + r) * Math.cos(angle);
            cy = (innerRadius + r) * Math.sin(angle);

            clipStart =
                clipEndAngle != null
                    ? arcIntersectionPoint(cx, cy, r, a0, a1, clipEndAngle - innerAngleOffset)
                    : undefined;
            clipEnd =
                clipStartAngle != null
                    ? arcIntersectionPoint(cx, cy, r, a0, a1, clipStartAngle + innerAngleOffset)
                    : undefined;
        } else {
            cx = (outerRadius - r) * Math.cos(angle);
            cy = (outerRadius - r) * Math.sin(angle);

            clipStart =
                clipStartAngle != null
                    ? arcIntersectionPoint(cx, cy, r, a0, a1, clipStartAngle + outerAngleOffset)
                    : undefined;
            clipEnd =
                clipEndAngle != null
                    ? arcIntersectionPoint(cx, cy, r, a0, a1, clipEndAngle - outerAngleOffset)
                    : undefined;
        }

        return { cx, cy, r, a0: clipStart ?? a0, a1: clipEnd ?? a1 };
    }

    override updatePath(): void {
        const {
            path,
            startAngle,
            endAngle,
            clipStartAngle,
            clipEndAngle,
            concentricEdgeInset,
            radialEdgeInset,
            scaleCornerRadiiIndependently,
        } = this;
        let { startOuterCornerRadius, endOuterCornerRadius, startInnerCornerRadius, endInnerCornerRadius } = this;
        const sweep = startAngle <= endAngle ? endAngle - startAngle : Math.PI * 2 - (startAngle - endAngle);
        const innerRadius = Math.max(Math.min(this.innerRadius, this.outerRadius) + concentricEdgeInset, 0);
        const outerRadius = Math.max(Math.max(this.innerRadius, this.outerRadius) - concentricEdgeInset, 0);
        const fullPie = sweep >= 2 * Math.PI;
        const centerX = this.centerX;
        const centerY = this.centerY;

        path.clear();

        if ((clipStartAngle ?? startAngle) === (clipEndAngle ?? endAngle)) {
            return;
        } else if (
            fullPie &&
            clipStartAngle == null &&
            clipEndAngle == null &&
            startOuterCornerRadius === 0 &&
            endOuterCornerRadius === 0 &&
            startInnerCornerRadius === 0 &&
            endInnerCornerRadius === 0
        ) {
            path.moveTo(centerX + outerRadius * Math.cos(startAngle), centerY + outerRadius * Math.sin(startAngle));
            path.arc(centerX, centerY, outerRadius, startAngle, endAngle);
            if (innerRadius > concentricEdgeInset) {
                path.moveTo(centerX + innerRadius * Math.cos(endAngle), centerY + innerRadius * Math.sin(endAngle));
                path.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            }
            path.closePath();
            return;
        }

        const innerAngleOffset = this.getAngleOffset(innerRadius);
        const outerAngleOffset = this.getAngleOffset(outerRadius);

        const outerAngleExceeded = sweep < 2 * outerAngleOffset;
        if (outerAngleExceeded) return;

        const innerAngleExceeded = innerRadius <= concentricEdgeInset || sweep < 2 * innerAngleOffset;

        const outerScalingFactor = radiiScalingFactor(
            outerRadius,
            sweep - 2 * outerAngleOffset,
            -startOuterCornerRadius,
            -endOuterCornerRadius
        );

        let innerScalingFactor = 1;
        if (!innerAngleExceeded && innerRadius > 0) {
            innerScalingFactor = radiiScalingFactor(
                innerRadius,
                sweep - 2 * innerAngleOffset,
                startInnerCornerRadius,
                endInnerCornerRadius
            );
        } else {
            startInnerCornerRadius = 0;
            endInnerCornerRadius = 0;
        }

        if (scaleCornerRadiiIndependently) {
            startOuterCornerRadius *= outerScalingFactor;
            endOuterCornerRadius *= outerScalingFactor;
            startInnerCornerRadius *= innerScalingFactor;
            endInnerCornerRadius *= innerScalingFactor;
        }

        const radialLength = outerRadius - innerRadius;
        const maxRadialRadiusLength = Math.max(
            startOuterCornerRadius + startInnerCornerRadius,
            endOuterCornerRadius + endInnerCornerRadius
        );
        const edgesScalingFactor = Math.min(radialLength / maxRadialRadiusLength, 1);

        const scalingFactor = scaleCornerRadiiIndependently
            ? edgesScalingFactor
            : Math.min(outerScalingFactor, innerScalingFactor, edgesScalingFactor);

        startOuterCornerRadius *= scalingFactor;
        endOuterCornerRadius *= scalingFactor;
        startInnerCornerRadius *= scalingFactor;
        endInnerCornerRadius *= scalingFactor;

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

        const startOuterArc = this.arc(
            startOuterCornerRadius,
            startOuterCornerRadiusAngleSweep,
            startAngle - Math.PI * 0.5,
            startAngle + startOuterCornerRadiusAngleSweep,
            true,
            false
        );
        const endOuterArc = this.arc(
            endOuterCornerRadius,
            endOuterCornerRadiusAngleSweep,
            endAngle - endOuterCornerRadiusAngleSweep,
            endAngle + Math.PI * 0.5,
            false,
            false
        );
        const endInnerArc = this.arc(
            endInnerCornerRadius,
            endInnerCornerRadiusAngleSweep,
            endAngle + Math.PI * 0.5,
            endAngle + Math.PI - endInnerCornerRadiusAngleSweep,
            false,
            true
        );
        const startInnerArc = this.arc(
            startInnerCornerRadius,
            startInnerCornerRadiusAngleSweep,
            startAngle + Math.PI + startInnerCornerRadiusAngleSweep,
            startAngle - Math.PI * 0.5,
            true,
            true
        );

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
        } else if (startInnerArc == null) {
            const a0 = Math.max(startAngle + innerAngleOffset, clipStartAngle ?? -Infinity);
            path.moveTo(centerX + innerRadius * Math.cos(a0), centerY + innerRadius * Math.sin(a0));
        } else {
            const { cx, cy, r, a1 } = startInnerArc;
            path.moveTo(centerX + cx + r * Math.cos(a1), centerY + cy + r * Math.sin(a1));
        }

        if (startOuterArc != null) {
            const { cx, cy, r, a0, a1 } = startOuterArc;
            path.arc(centerX + cx, centerY + cy, r, a0, a1);
        }

        const outerA0 = Math.max(
            startAngle + outerAngleOffset + startOuterCornerRadiusAngleSweep,
            clipStartAngle ?? -Infinity
        );
        const outerA1 = Math.min(
            endAngle - outerAngleOffset - endOuterCornerRadiusAngleSweep,
            clipEndAngle ?? Infinity
        );
        if (Math.sign(outerA1 - outerA0) === Math.sign(endAngle - startAngle)) {
            path.arc(centerX, centerY, outerRadius, outerA0, outerA1);
        }

        if (endOuterArc != null) {
            const { cx, cy, r, a0, a1 } = endOuterArc;
            path.arc(centerX + cx, centerY + cy, r, a0, a1);
        }

        if (innerAngleExceeded) {
            // Ignore - completed by closePath
        } else if (innerRadius > 0) {
            if (endInnerArc != null) {
                const { cx, cy, r, a0, a1 } = endInnerArc;
                path.arc(centerX + cx, centerY + cy, r, a0, a1);
            }

            const innerA0 = Math.max(
                startAngle + innerAngleOffset + startInnerCornerRadiusAngleSweep,
                clipStartAngle ?? -Infinity
            );
            const innerA1 = Math.min(
                endAngle - innerAngleOffset - endInnerCornerRadiusAngleSweep,
                clipEndAngle ?? Infinity
            );
            if (Math.sign(innerA1 - innerA0) === Math.sign(endAngle - startAngle)) {
                path.arc(centerX, centerY, innerRadius, innerA1, innerA0, true);
            }

            if (startInnerArc != null) {
                const { cx, cy, r, a0, a1 } = startInnerArc;
                path.arc(centerX + cx, centerY + cy, r, a0, a1);
            }
        } else {
            path.lineTo(centerX, centerY);
        }

        path.closePath();
    }

    override isPointInPath(x: number, y: number): boolean {
        const point = this.transformPoint(x, y);

        return isPointInSector(point.x, point.y, {
            startAngle: this.clipStartAngle ?? this.startAngle,
            endAngle: this.clipEndAngle ?? this.endAngle,
            innerRadius: Math.min(this.innerRadius, this.outerRadius),
            outerRadius: Math.max(this.innerRadius, this.outerRadius),
        });
    }
}
