import { BBox } from '../bbox';
import type { Point } from '../point';
import { SectorBox } from '../sectorBox';
import {
    arcCircleIntersectionAngle,
    arcRadialLineIntersectionAngle,
    clockwiseAngle,
    clockwiseAngles,
    isPointInSector,
    radiiScalingFactor,
} from '../util/sector';
import { Path, ScenePathChangeDetection } from './path';

class Arc {
    constructor(
        public cx: number,
        public cy: number,
        public r: number,
        public a0: number,
        public a1: number
    ) {
        if (this.a0 >= this.a1) {
            this.a0 = NaN;
            this.a1 = NaN;
        }
    }

    isValid() {
        return Number.isFinite(this.a0) && Number.isFinite(this.a1);
    }

    pointAt(a: number): Point {
        return {
            x: this.cx + this.r * Math.cos(a),
            y: this.cy + this.r * Math.sin(a),
        };
    }

    clipStart(a: number | undefined) {
        if (a == null || !this.isValid() || a < this.a0) return;
        this.a0 = a;
        if (Number.isNaN(a) || this.a0 >= this.a1) {
            this.a0 = NaN;
            this.a1 = NaN;
        }
    }

    clipEnd(a: number | undefined) {
        if (a == null || !this.isValid() || a > this.a1) return;
        this.a1 = a;
        if (Number.isNaN(a) || this.a0 >= this.a1) {
            this.a0 = NaN;
            this.a1 = NaN;
        }
    }
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
    clipSector: SectorBox | undefined = undefined;

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

    private normalizedRadii() {
        const { concentricEdgeInset } = this;
        return {
            innerRadius: Math.max(Math.min(this.innerRadius, this.outerRadius) + concentricEdgeInset, 0),
            outerRadius: Math.max(Math.max(this.innerRadius, this.outerRadius) - concentricEdgeInset, 0),
        };
    }

    private normalizedClipSector() {
        const { clipSector } = this;
        if (clipSector == null) return;

        const { startAngle, endAngle } = clockwiseAngles(this.startAngle, this.endAngle);
        const { innerRadius, outerRadius } = this.normalizedRadii();
        const clipAngles = clockwiseAngles(clipSector.startAngle, clipSector.endAngle, startAngle);

        return new SectorBox(
            Math.max(startAngle, clipAngles.startAngle),
            Math.min(endAngle, clipAngles.endAngle),
            Math.max(innerRadius, clipSector.innerRadius),
            Math.min(outerRadius, clipSector.outerRadius)
        );
    }

    private getAngleOffset(radius: number) {
        return radius > 0 ? this.radialEdgeInset / radius : 0;
    }

    private arc(
        r: number,
        angleSweep: number,
        a0: number,
        a1: number,
        outerArc: Arc,
        innerArc: Arc | undefined,
        start: boolean,
        inner: boolean
    ): Arc | undefined {
        if (r <= 0) return;

        const { startAngle, endAngle } = clockwiseAngles(this.startAngle, this.endAngle);
        const { innerRadius, outerRadius } = this.normalizedRadii();
        const clipSector = this.normalizedClipSector();

        if (inner && innerRadius <= 0) return;

        const innerAngleOffset = this.getAngleOffset(innerRadius);
        const outerAngleOffset = this.getAngleOffset(outerRadius);

        const angleOffset = inner ? this.getAngleOffset(innerRadius + r) : this.getAngleOffset(outerRadius - r);
        const angle = start ? startAngle + angleOffset + angleSweep : endAngle - angleOffset - angleSweep;

        const radius = inner ? innerRadius + r : outerRadius - r;
        const cx = radius * Math.cos(angle);
        const cy = radius * Math.sin(angle);

        if (clipSector != null) {
            const delta = 1e-6;
            if (!start && !(angle >= startAngle - delta && angle <= clipSector.endAngle - delta)) return;
            if (start && !(angle >= clipSector.startAngle + delta && angle <= endAngle - delta)) return;
            if (inner && !(radius >= clipSector.innerRadius - delta)) return;
            if (!inner && !(radius <= clipSector.outerRadius + delta)) return;
        }

        const arc = new Arc(cx, cy, r, a0, a1);

        if (clipSector != null) {
            if (inner) {
                arc.clipStart(
                    arcRadialLineIntersectionAngle(cx, cy, r, a0, a1, clipSector.endAngle - innerAngleOffset)
                );
                arc.clipEnd(
                    arcRadialLineIntersectionAngle(cx, cy, r, a0, a1, clipSector.startAngle + innerAngleOffset)
                );
            } else {
                arc.clipStart(
                    arcRadialLineIntersectionAngle(cx, cy, r, a0, a1, clipSector.startAngle + outerAngleOffset)
                );
                arc.clipEnd(arcRadialLineIntersectionAngle(cx, cy, r, a0, a1, clipSector.endAngle - outerAngleOffset));
            }

            let circleClipStart: number | undefined;
            let circleClipEnd: number | undefined;
            if (start) {
                circleClipStart = arcCircleIntersectionAngle(cx, cy, r, a0, a1, clipSector.innerRadius);
                circleClipEnd = arcCircleIntersectionAngle(cx, cy, r, a0, a1, clipSector.outerRadius);
            } else {
                circleClipStart = arcCircleIntersectionAngle(cx, cy, r, a0, a1, clipSector.outerRadius);
                circleClipEnd = arcCircleIntersectionAngle(cx, cy, r, a0, a1, clipSector.innerRadius);
            }

            arc.clipStart(circleClipStart);
            arc.clipEnd(circleClipEnd);

            // Clip inner and outer arcs for circle intersections
            if (circleClipStart != null) {
                const { x, y } = arc.pointAt(circleClipStart);
                const theta = clockwiseAngle(Math.atan2(y, x), startAngle);

                if (start) {
                    innerArc?.clipStart(theta);
                } else {
                    outerArc.clipEnd(theta);
                }
            }
            if (circleClipEnd != null) {
                const { x, y } = arc.pointAt(circleClipEnd);
                const theta = clockwiseAngle(Math.atan2(y, x), startAngle);

                if (start) {
                    outerArc.clipStart(theta);
                } else {
                    innerArc?.clipEnd(theta);
                }
            }
        }

        if (clipSector != null) {
            // Inner arcs especially can have their radius inside the clip sector
            // but never actually clip
            // an example of this config is:-
            // cornerRadius = 100
            // startAngle = clipSector.startAngle = Math.PI * 1.75
            // endAngle = clipSector.endAngle = Math.PI * 1.75
            // outerRadius = clipSector.outerRadius = 200
            // innerRadius = 100
            // clipSector.innerRadius = 150
            const { x, y } = arc.pointAt((arc.a0 + arc.a1) / 2);
            if (!isPointInSector(x, y, clipSector)) return;
        }

        // Clip inner/outer arc to fit within arc
        const { x, y } = arc.pointAt(start === inner ? arc.a0 : arc.a1);
        const theta = clockwiseAngle(Math.atan2(y, x), startAngle);
        const radialArc = inner ? innerArc : outerArc;
        if (start) {
            radialArc?.clipStart(theta);
        } else {
            radialArc?.clipEnd(theta);
        }

        return arc;
    }

    override updatePath(): void {
        const delta = 1e-6;
        const { path, centerX, centerY, concentricEdgeInset, radialEdgeInset } = this;
        let { startOuterCornerRadius, endOuterCornerRadius, startInnerCornerRadius, endInnerCornerRadius } = this;
        const { startAngle, endAngle } = clockwiseAngles(this.startAngle, this.endAngle);
        const { innerRadius, outerRadius } = this.normalizedRadii();
        const clipSector = this.normalizedClipSector();
        const sweepAngle = endAngle - startAngle;
        const fullPie = sweepAngle >= 2 * Math.PI - delta;

        path.clear();

        if ((clipSector?.startAngle ?? startAngle) === (clipSector?.endAngle ?? endAngle)) {
            return;
        } else if (
            fullPie &&
            this.clipSector == null &&
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

        const outerAngleExceeded = sweepAngle < 2 * outerAngleOffset;
        if (outerAngleExceeded) return;

        const hasInnerSweep = (clipSector?.innerRadius ?? innerRadius) > concentricEdgeInset;
        const innerAngleExceeded = innerRadius < concentricEdgeInset || sweepAngle < 2 * innerAngleOffset;

        // radiiScalingFactor doesn't find outer radii factors when the corners are larger than the sector radius
        // First, scale everything down so every corner radius individually fits within the sector's radial range
        const radialLength = outerRadius - innerRadius;
        const maxRadialLength = Math.max(
            startOuterCornerRadius,
            startInnerCornerRadius,
            endOuterCornerRadius,
            endInnerCornerRadius
        );
        const initialScalingFactor = maxRadialLength > 0 ? Math.min(radialLength / maxRadialLength, 1) : 1;
        startOuterCornerRadius *= initialScalingFactor;
        endOuterCornerRadius *= initialScalingFactor;
        startInnerCornerRadius *= initialScalingFactor;
        endInnerCornerRadius *= initialScalingFactor;

        // Then scale the both outer corner radii so they both fit within the sector's sweep when placed together
        const outerScalingFactor = radiiScalingFactor(
            outerRadius,
            sweepAngle - 2 * outerAngleOffset,
            -startOuterCornerRadius,
            -endOuterCornerRadius
        );
        startOuterCornerRadius *= outerScalingFactor;
        endOuterCornerRadius *= outerScalingFactor;

        if (!innerAngleExceeded && hasInnerSweep) {
            // ... then the inner corner radii
            const innerScalingFactor = radiiScalingFactor(
                innerRadius,
                sweepAngle - 2 * innerAngleOffset,
                startInnerCornerRadius,
                endInnerCornerRadius
            );
            startInnerCornerRadius *= innerScalingFactor;
            endInnerCornerRadius *= innerScalingFactor;
        } else {
            startInnerCornerRadius = 0;
            endInnerCornerRadius = 0;
        }

        // Finally, scale the corner radii so they fit with in the sector's radial range when placed together
        const maxCombinedRadialLength = Math.max(
            startOuterCornerRadius + startInnerCornerRadius,
            endOuterCornerRadius + endInnerCornerRadius
        );
        const edgesScalingFactor =
            maxCombinedRadialLength > 0 ? Math.min(radialLength / maxCombinedRadialLength, 1) : 1;

        startOuterCornerRadius *= edgesScalingFactor;
        endOuterCornerRadius *= edgesScalingFactor;
        startInnerCornerRadius *= edgesScalingFactor;
        endInnerCornerRadius *= edgesScalingFactor;

        let startOuterCornerRadiusAngleSweep = 0;
        let endOuterCornerRadiusAngleSweep = 0;
        const startOuterCornerRadiusSweep = startOuterCornerRadius / (outerRadius - startOuterCornerRadius);
        const endOuterCornerRadiusSweep = endOuterCornerRadius / (outerRadius - endOuterCornerRadius);
        if (startOuterCornerRadiusSweep >= 0 && startOuterCornerRadiusSweep < 1 - delta) {
            startOuterCornerRadiusAngleSweep = Math.asin(startOuterCornerRadiusSweep);
        } else {
            startOuterCornerRadiusAngleSweep = sweepAngle / 2;
            const maxStartOuterCornerRadius = outerRadius / (1 / Math.sin(startOuterCornerRadiusAngleSweep) + 1);
            startOuterCornerRadius = Math.min(maxStartOuterCornerRadius, startOuterCornerRadius);
        }
        if (endOuterCornerRadiusSweep >= 0 && endOuterCornerRadiusSweep < 1 - delta) {
            endOuterCornerRadiusAngleSweep = Math.asin(endOuterCornerRadiusSweep);
        } else {
            endOuterCornerRadiusAngleSweep = sweepAngle / 2;
            const maxEndOuterCornerRadius = outerRadius / (1 / Math.sin(endOuterCornerRadiusAngleSweep) + 1);
            endOuterCornerRadius = Math.min(maxEndOuterCornerRadius, endOuterCornerRadius);
        }

        const startInnerCornerRadiusAngleSweep = Math.asin(
            startInnerCornerRadius / (innerRadius + startInnerCornerRadius)
        );
        const endInnerCornerRadiusAngleSweep = Math.asin(endInnerCornerRadius / (innerRadius + endInnerCornerRadius));

        const outerArcRadius = clipSector?.outerRadius ?? outerRadius;
        const outerArcRadiusOffset = this.getAngleOffset(outerArcRadius);
        const outerArc = new Arc(
            0,
            0,
            outerArcRadius,
            startAngle + outerArcRadiusOffset,
            endAngle - outerArcRadiusOffset
        );
        const innerArcRadius = clipSector?.innerRadius ?? innerRadius;
        const innerArcRadiusOffset = this.getAngleOffset(innerArcRadius);
        const innerArc = hasInnerSweep
            ? new Arc(0, 0, innerArcRadius, startAngle + innerArcRadiusOffset, endAngle - innerArcRadiusOffset)
            : undefined;

        if (clipSector != null) {
            outerArc.clipStart(clipSector.startAngle);
            outerArc.clipEnd(clipSector.endAngle);
            innerArc?.clipStart(clipSector.startAngle);
            innerArc?.clipEnd(clipSector.endAngle);
        }

        const startOuterArc = this.arc(
            startOuterCornerRadius,
            startOuterCornerRadiusAngleSweep,
            startAngle - Math.PI * 0.5,
            startAngle + startOuterCornerRadiusAngleSweep,
            outerArc,
            innerArc,
            true,
            false
        );
        const endOuterArc = this.arc(
            endOuterCornerRadius,
            endOuterCornerRadiusAngleSweep,
            endAngle - endOuterCornerRadiusAngleSweep,
            endAngle + Math.PI * 0.5,
            outerArc,
            innerArc,
            false,
            false
        );
        const endInnerArc = this.arc(
            endInnerCornerRadius,
            endInnerCornerRadiusAngleSweep,
            endAngle + Math.PI * 0.5,
            endAngle + Math.PI - endInnerCornerRadiusAngleSweep,
            outerArc,
            innerArc,
            false,
            true
        );
        const startInnerArc = this.arc(
            startInnerCornerRadius,
            startInnerCornerRadiusAngleSweep,
            startAngle + Math.PI + startInnerCornerRadiusAngleSweep,
            startAngle + Math.PI * 1.5,
            outerArc,
            innerArc,
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
            const x =
                sweepAngle < Math.PI * 0.5
                    ? (radialEdgeInset * (1 + Math.cos(sweepAngle))) / Math.sin(sweepAngle)
                    : NaN;
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
            const midAngle = startAngle + sweepAngle * 0.5;
            path.moveTo(centerX + r * Math.cos(midAngle), centerY + r * Math.sin(midAngle));
        } else if (startInnerArc?.isValid() === true) {
            const { x, y } = startInnerArc.pointAt(startInnerArc.a1);
            path.moveTo(centerX + x, centerY + y);
        } else if (innerArc?.isValid() === true) {
            const { x, y } = innerArc.pointAt(innerArc.a0);
            path.moveTo(centerX + x, centerY + y);
        } else {
            const midAngle = startAngle + sweepAngle / 2;
            const cx = innerRadius * Math.cos(midAngle);
            const cy = innerRadius * Math.sin(midAngle);
            path.moveTo(centerX + cx, centerY + cy);
        }

        if (startOuterArc?.isValid() === true) {
            const { cx, cy, r, a0, a1 } = startOuterArc;
            path.arc(centerX + cx, centerY + cy, r, a0, a1);
        }

        if (outerArc.isValid()) {
            const { r, a0, a1 } = outerArc;
            path.arc(centerX, centerY, r, a0, a1);
        }

        if (endOuterArc?.isValid() === true) {
            const { cx, cy, r, a0, a1 } = endOuterArc;
            path.arc(centerX + cx, centerY + cy, r, a0, a1);
        }

        if (!innerAngleExceeded) {
            if (endInnerArc?.isValid() === true) {
                const { cx, cy, r, a0, a1 } = endInnerArc;
                path.arc(centerX + cx, centerY + cy, r, a0, a1);
            }

            if (innerArc?.isValid() === true) {
                const { r, a0, a1 } = innerArc;
                path.arc(centerX, centerY, r, a1, a0, true);
            }

            if (startInnerArc?.isValid() === true) {
                const { cx, cy, r, a0, a1 } = startInnerArc;
                path.arc(centerX + cx, centerY + cy, r, a0, a1);
            }
        }

        path.closePath();
    }

    override isPointInPath(x: number, y: number): boolean {
        const point = this.transformPoint(x, y);

        const { startAngle, endAngle, innerRadius, outerRadius } = this.clipSector ?? this;

        return isPointInSector(point.x - this.centerX, point.y - this.centerY, {
            startAngle,
            endAngle,
            innerRadius: Math.min(innerRadius, outerRadius),
            outerRadius: Math.max(innerRadius, outerRadius),
        });
    }
}
