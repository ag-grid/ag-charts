import { SceneChangeDetection, SceneObjectChangeDetection } from '../../rendering/changeDetectable';
import type { Point, SerializedNodeState, SerializedSectorProps } from '../../types/scene';
import type { BBox } from '../bbox';
import { SectorBox } from '../sectorBox';
import {
    arcCircleIntersectionAngle,
    arcRadialLineIntersectionAngle,
    clockwiseAngle,
    clockwiseAngles,
    clockwiseSweep,
    isPointInSector,
    radiiScalingFactor,
    sectorBox,
} from '../util/sector';
import { Path } from './path';
import type { CanvasContext } from './shape';

class Arc {
    constructor(
        public cx: number,
        public cy: number,
        public r: number,
        public a0: number,
        public a1: number
    ) {
        if (this.a0 >= this.a1) {
            this.a0 = Number.NaN;
            this.a1 = Number.NaN;
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
            this.a0 = Number.NaN;
            this.a1 = Number.NaN;
        }
    }

    clipEnd(a: number | undefined) {
        if (a == null || !this.isValid() || a > this.a1) return;
        this.a1 = a;
        if (Number.isNaN(a) || this.a0 >= this.a1) {
            this.a0 = Number.NaN;
            this.a1 = Number.NaN;
        }
    }
}

export class Sector<D = unknown> extends Path<D> {
    static override readonly className = 'Sector';

    @SceneChangeDetection()
    centerX: number = 0;

    @SceneChangeDetection()
    centerY: number = 0;

    @SceneChangeDetection()
    innerRadius: number = 10;

    @SceneChangeDetection()
    outerRadius: number = 20;

    @SceneChangeDetection()
    startAngle: number = 0;

    @SceneChangeDetection()
    endAngle: number = Math.PI * 2;

    @SceneObjectChangeDetection({ equals: (lhs: SectorBox, rhs: SectorBox) => lhs.equals(rhs) })
    clipSector: SectorBox | undefined = undefined;

    @SceneChangeDetection()
    innerEdgeInset: number = 0;

    @SceneChangeDetection()
    outerEdgeInset: number = 0;

    @SceneChangeDetection()
    radialEdgeInset: number = 0;

    @SceneChangeDetection()
    startOuterCornerRadius: number = 0;

    @SceneChangeDetection()
    endOuterCornerRadius: number = 0;

    @SceneChangeDetection()
    startInnerCornerRadius: number = 0;

    @SceneChangeDetection()
    endInnerCornerRadius: number = 0;

    /** Where a sector beside this one glows too: the angle between them, and its angle and radii. A `span` of `0` is none. */
    @SceneChangeDetection()
    glowStartGap: number = 0;

    @SceneChangeDetection()
    glowStartSpan: number = 0;

    @SceneChangeDetection()
    glowStartInner: number = 0;

    @SceneChangeDetection()
    glowStartOuter: number = 0;

    @SceneChangeDetection()
    glowEndGap: number = 0;

    @SceneChangeDetection()
    glowEndSpan: number = 0;

    @SceneChangeDetection()
    glowEndInner: number = 0;

    @SceneChangeDetection()
    glowEndOuter: number = 0;

    override serialize(): SerializedNodeState {
        return { type: 'sector', props: this.serializeProps(), svgPath: this.serializeSvgPath() };
    }

    protected override serializeProps(): SerializedSectorProps {
        return {
            ...super.serializeProps(),
            startAngle: this.startAngle,
            endAngle: this.endAngle,
            innerRadius: this.innerRadius,
            outerRadius: this.outerRadius,
        };
    }

    set inset(value: number) {
        this.concentricEdgeInset = value;
        this.radialEdgeInset = value;
    }

    set concentricEdgeInset(value: number) {
        this.innerEdgeInset = value;
        this.outerEdgeInset = value;
    }

    set cornerRadius(value: number) {
        this.startOuterCornerRadius = value;
        this.endOuterCornerRadius = value;
        this.startInnerCornerRadius = value;
        this.endInnerCornerRadius = value;
    }

    protected override computeBBox(): BBox {
        return sectorBox(this).translate(this.centerX, this.centerY);
    }

    protected override clipGlowEnds(ctx: CanvasContext, reach: number): boolean {
        const { glowStartGap, glowStartSpan, glowEndGap, glowEndSpan } = this;
        if (glowStartSpan <= 0 && glowEndSpan <= 0) return false;

        const startAngle = clockwiseAngle(this.startAngle, 0);
        const endAngle = startAngle + clockwiseSweep(this.startAngle, this.endAngle);
        const far = this.outerRadius + 2 * (reach + this.strokeWidth) + 2;
        ctx.save();
        // Clips intersect, so cutting away each neighbour's side of its line in turn leaves both cut.
        if (glowStartSpan > 0) {
            const line = startAngle - glowStartGap / 2;
            this.clipOutBeside(
                ctx,
                reach,
                far,
                line - glowStartSpan - glowStartGap / 2,
                line,
                this.glowStartInner,
                this.glowStartOuter
            );
        }
        if (glowEndSpan > 0) {
            const line = endAngle + glowEndGap / 2;
            this.clipOutBeside(
                ctx,
                reach,
                far,
                line,
                line + glowEndSpan + glowEndGap / 2,
                this.glowEndInner,
                this.glowEndOuter
            );
        }
        return true;
    }

    private clipOutBeside(
        ctx: CanvasContext,
        reach: number,
        far: number,
        from: number,
        to: number,
        neighbourInner: number,
        neighbourOuter: number
    ) {
        // Past this band a glow has no neighbour's glow to end against, so it wraps round the edge as a free one does.
        const margin = reach + this.strokeWidth;
        const inner = Math.max(this.innerRadius, neighbourInner) - margin;
        // The mitred corner of a dilated sector stands a little further out than its arc does.
        const outer = Math.hypot(Math.min(this.outerRadius, neighbourOuter) + margin, margin);
        const { centerX, centerY } = this;
        ctx.beginPath();
        ctx.rect(centerX - far, centerY - far, far * 2, far * 2);
        ctx.moveTo(centerX + outer * Math.cos(from), centerY + outer * Math.sin(from));
        ctx.arc(centerX, centerY, outer, from, to);
        if (inner > 0) {
            ctx.arc(centerX, centerY, inner, to, from, true);
        } else {
            ctx.lineTo(centerX, centerY);
        }
        ctx.closePath();
        ctx.clip('evenodd');
    }

    private normalizedRadii() {
        const { innerEdgeInset, outerEdgeInset } = this;
        let { innerRadius, outerRadius } = this;
        innerRadius = innerRadius > 0 ? innerRadius + innerEdgeInset : 0;
        outerRadius = Math.max(outerRadius - outerEdgeInset, 0);
        return { innerRadius, outerRadius };
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

        const angleOffset = inner ? this.getAngleOffset(innerRadius + r) : this.getAngleOffset(outerRadius - r);
        const angle = start ? startAngle + angleOffset + angleSweep : endAngle - angleOffset - angleSweep;

        const radius = inner ? innerRadius + r : outerRadius - r;
        const cx = radius * Math.cos(angle);
        const cy = radius * Math.sin(angle);

        if (clipSector != null) {
            const delta = 1e-6;
            if (!start && !(angle >= startAngle - delta && angle <= clipSector.endAngle - delta)) return;
            if (start && !(angle >= clipSector.startAngle + delta && angle <= endAngle - delta)) return;
            if (inner && radius < clipSector.innerRadius - delta) return;
            if (!inner && radius > clipSector.outerRadius + delta) return;
        }

        const arc = new Arc(cx, cy, r, a0, a1);

        if (clipSector != null) {
            if (inner) {
                arc.clipStart(arcRadialLineIntersectionAngle(cx, cy, r, a0, a1, clipSector.endAngle));
                arc.clipEnd(arcRadialLineIntersectionAngle(cx, cy, r, a0, a1, clipSector.startAngle));
            } else {
                arc.clipStart(arcRadialLineIntersectionAngle(cx, cy, r, a0, a1, clipSector.startAngle));
                arc.clipEnd(arcRadialLineIntersectionAngle(cx, cy, r, a0, a1, clipSector.endAngle));
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
        const { path, centerX, centerY, innerEdgeInset, radialEdgeInset } = this;
        let { startOuterCornerRadius, endOuterCornerRadius, startInnerCornerRadius, endInnerCornerRadius } = this;
        const { startAngle, endAngle } = clockwiseAngles(this.startAngle, this.endAngle);
        const { innerRadius, outerRadius } = this.normalizedRadii();
        const clipSector = this.normalizedClipSector();
        const sweepAngle = endAngle - startAngle;
        const fullPie = sweepAngle >= 2 * Math.PI - delta;

        path.clear();

        const innerAngleOffset = this.getAngleOffset(innerRadius);
        const adjustedSweep = sweepAngle - 2 * innerAngleOffset;
        const radialLength = outerRadius - innerRadius;
        const innerCornerDistance =
            innerRadius > 0 && adjustedSweep > 0 ? 2 * innerRadius * Math.sin(adjustedSweep / 2) : 0;
        const outerCornerDistance =
            outerRadius > 0 && adjustedSweep > 0 ? 2 * outerRadius * Math.sin(adjustedSweep / 2) : 0;

        // Ensure the corner radii don't exceed the radial length or inner/outer edge distance.
        startOuterCornerRadius = Math.floor(
            Math.max(0, Math.min(startOuterCornerRadius, outerCornerDistance / 2, radialLength / 2))
        );
        endOuterCornerRadius = Math.floor(
            Math.max(0, Math.min(endOuterCornerRadius, outerCornerDistance / 2, radialLength / 2))
        );
        startInnerCornerRadius = Math.floor(
            Math.max(0, Math.min(startInnerCornerRadius, innerCornerDistance / 2, radialLength / 2))
        );
        endInnerCornerRadius = Math.floor(
            Math.max(0, Math.min(endInnerCornerRadius, innerCornerDistance / 2, radialLength / 2))
        );

        const isInvalid =
            (innerRadius === 0 && outerRadius === 0) ||
            innerRadius > outerRadius ||
            innerCornerDistance < 0 ||
            outerCornerDistance <= 0;
        if (isInvalid) {
            return;
        } else if ((clipSector?.startAngle ?? startAngle) === (clipSector?.endAngle ?? endAngle)) {
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
            if (innerRadius > innerEdgeInset) {
                path.moveTo(centerX + innerRadius * Math.cos(endAngle), centerY + innerRadius * Math.sin(endAngle));
                path.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
            }
            path.closePath();
            return;
        } else if (this.clipSector == null && Math.abs(innerRadius - outerRadius) < 1e-6) {
            path.arc(centerX, centerY, outerRadius, startAngle, endAngle, false);
            path.arc(centerX, centerY, outerRadius, endAngle, startAngle, true);
            path.closePath();
            return;
        }

        const outerAngleOffset = this.getAngleOffset(outerRadius);

        const outerAngleExceeded = sweepAngle < 2 * outerAngleOffset;
        if (outerAngleExceeded) return;

        const hasInnerSweep = (clipSector?.innerRadius ?? innerRadius) > innerEdgeInset;
        // A wedge's inset straight edges meet at an apex short of the centre.
        const innerAngleExceeded =
            innerRadius < innerEdgeInset ||
            (innerRadius === 0 && radialEdgeInset > 0) ||
            sweepAngle < 2 * innerAngleOffset;

        // radiiScalingFactor doesn't find outer radii factors when the corners are larger than the sector radius
        // First, scale everything down so every corner radius individually fits within the sector's radial range
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

        if (innerAngleExceeded && hasInnerSweep) {
            // No explicit start point: closePath() then draws a minimal outer-edge line rather than a
            // spike to the inner radius.
        } else if (innerAngleExceeded) {
            // Draw a wedge for pie charts (no inner radius) on a cartesian co-ordinate with radius `sweep`
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
                    : Number.NaN;
            // r = sqrt(x**2 + y**2)
            let r: number;
            if (x > 0 && x < outerRadius) {
                // Even within the formula limits, floating point precision isn't always enough,
                // so ensure we never go less than the inner radius
                r = Math.max(Math.hypot(radialEdgeInset, x), innerRadius);
            } else {
                // Formula limits exceeded - just use the inner radius
                r = radialEdgeInset;
            }
            r = Math.max(r, innerRadius);
            const midAngle = startAngle + sweepAngle * 0.5;
            path.moveTo(centerX + r * Math.cos(midAngle), centerY + r * Math.sin(midAngle));
        } else if (startInnerArc?.isValid() === true || innerArc?.isValid() === true) {
            // The first point of the path will be the first point on an arc
            // We don't need to call moveTo here - it's implicit
            // Not having a moveTo also fixes some issues Chrome has about mitering
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
        const { startAngle, endAngle, innerRadius, outerRadius } = this.clipSector ?? this;

        return isPointInSector(x - this.centerX, y - this.centerY, {
            startAngle,
            endAngle,
            innerRadius: Math.min(innerRadius, outerRadius),
            outerRadius: Math.max(innerRadius, outerRadius),
        });
    }
}

interface SectorGlowEntry {
    sector: Sector;
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
    centerX: number;
    centerY: number;
    /** The glow ends worked out for the sector, which are assigned to it once, so an unchanged ring marks nothing dirty. */
    startGap: number;
    startSpan: number;
    startInner: number;
    startOuter: number;
    endGap: number;
    endSpan: number;
    endInner: number;
    endOuter: number;
}

const byStartAngle = (a: SectorGlowEntry, b: SectorGlowEntry) => a.startAngle - b.startAngle;
const glows = ({ sector: { fillGlow } }: SectorGlowEntry) => fillGlow?.enabled === true && fillGlow.cutOnly !== true;

/** What {@link SectorGlowRing.endGlows} reads the sectors of a ring from, such as a series' selection. */
interface SectorSource<TDatum> {
    each(iterate: (sector: Sector<TDatum>, datum: TDatum) => void): void;
}

/**
 * The sectors drawn in one ring, with the angles and radii they are laid out at, never the node's, which may be animating.
 * A series keeps one and refills it on each update, so no object is made per sector.
 */
export class SectorGlowRing {
    private readonly pool: SectorGlowEntry[] = [];
    readonly entries: SectorGlowEntry[] = [];
    /** The entries with a sweep, sorted by start angle, reused by {@link setSectorGlowEnds}. */
    readonly ordered: SectorGlowEntry[] = [];

    clear() {
        this.entries.length = 0;
    }

    /** Lets go of the pooled entries past those in use, so a ring that shrinks keeps no sector that was removed. */
    trim() {
        this.pool.length = this.entries.length;
    }

    release() {
        this.clear();
        this.ordered.length = 0;
        this.trim();
    }

    add(sector: Sector, startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) {
        const { pool, entries } = this;
        let entry = pool[entries.length];
        if (entry == null) {
            entry = { sector, startAngle, endAngle, innerRadius, outerRadius, centerX: 0, centerY: 0, ...NO_GLOW_ENDS };
            pool[entries.length] = entry;
        }
        entry.sector = sector;
        entry.startAngle = startAngle;
        entry.endAngle = endAngle;
        entry.innerRadius = innerRadius;
        entry.outerRadius = outerRadius;
        entry.centerX = sector.centerX;
        entry.centerY = sector.centerY;
        entries.push(entry);
    }

    /** Refills the ring from the sectors of `source`, with the angles and radii that `add` gives each, and ends their glows. */
    endGlows<TDatum>(
        source: SectorSource<TDatum>,
        add: (ring: SectorGlowRing, sector: Sector<TDatum>, datum: TDatum) => void,
        padded: boolean = false
    ) {
        this.clear();
        source.each((sector, datum) => add(this, sector, datum));
        setSectorGlowEnds(this, padded);
    }
}

const NO_GLOW_ENDS = {
    startGap: 0,
    startSpan: 0,
    startInner: 0,
    startOuter: 0,
    endGap: 0,
    endSpan: 0,
    endInner: 0,
    endOuter: 0,
};

/** Adds a sector to a ring at the angles and radii of its datum, for the series whose datums carry all four. */
export function addSectorDatum(
    ring: SectorGlowRing,
    sector: Sector,
    datum: { startAngle: number; endAngle: number; innerRadius: number; outerRadius: number }
) {
    ring.add(sector, datum.startAngle, datum.endAngle, datum.innerRadius, datum.outerRadius);
}

/**
 * Ends the glow of each sector of a ring on the radial line between it and the next sector, where both glow. The angles
 * of the ring's entries are unwrapped in place, and a sector with no sweep has no glow ends. Two sectors are beside
 * each other if their angles meet. In a `padded` ring, where the sectors are set apart by a padding, every two in a row
 * are beside each other, as are the last and the first if no more than the widest padding is left between them.
 */
export function setSectorGlowEnds(ring: SectorGlowRing, padded: boolean = false) {
    const full = 2 * Math.PI;
    const delta = 1e-6;
    const { entries, ordered } = ring;
    ordered.length = 0;
    let sorted = true;
    for (const entry of entries) {
        entry.startSpan = 0;
        entry.endSpan = 0;
        const sweep = clockwiseSweep(entry.startAngle, entry.endAngle);
        if (sweep > 0) {
            entry.startAngle = clockwiseAngle(entry.startAngle, 0);
            entry.endAngle = entry.startAngle + sweep;
            sorted &&= ordered.length === 0 || ordered.at(-1)!.startAngle <= entry.startAngle;
            ordered.push(entry);
        }
    }
    if (ordered.length >= 2) {
        if (!sorted) ordered.sort(byStartAngle);
        findGlowEnds(ordered, padded, full, delta);
    }
    for (const entry of entries) assignGlowEnds(entry);
    ring.trim();
}

function findGlowEnds(entries: SectorGlowEntry[], padded: boolean, full: number, delta: number) {
    const count = entries.length;
    let widest = delta;
    if (padded) {
        for (let i = 0; i < count - 1; i++) {
            widest = Math.max(widest, entries[i + 1].startAngle - entries[i].endAngle);
        }
    }

    for (let i = 0; i < count; i++) {
        const prev = entries[i];
        const next = entries[(i + 1) % count];
        if (!glows(prev) || !glows(next)) continue;

        const gap = next.startAngle - prev.endAngle + (i === count - 1 ? full : 0);
        const beside = padded && i < count - 1 ? gap >= -delta : gap >= -delta && gap <= widest;
        if (!beside || !sameCentre(prev, next, delta)) continue;

        prev.endGap = next.startGap = Math.max(gap, 0);
        prev.endSpan = next.endAngle - next.startAngle;
        prev.endInner = next.innerRadius;
        prev.endOuter = next.outerRadius;
        next.startSpan = prev.endAngle - prev.startAngle;
        next.startInner = prev.innerRadius;
        next.startOuter = prev.outerRadius;
    }
}

/** Sectors moved apart, as a selected sector is by `selectedOffset`, are not beside each other, so their glows wrap round. */
function sameCentre(a: SectorGlowEntry, b: SectorGlowEntry, delta: number) {
    return Math.abs(a.centerX - b.centerX) <= delta && Math.abs(a.centerY - b.centerY) <= delta;
}

/** Assigns the glow ends worked out for a sector. A span of `0` is none, so the rest of that end is left as it was. */
function assignGlowEnds(entry: SectorGlowEntry) {
    const { sector } = entry;
    sector.glowStartSpan = entry.startSpan;
    if (entry.startSpan > 0) {
        sector.glowStartGap = entry.startGap;
        sector.glowStartInner = entry.startInner;
        sector.glowStartOuter = entry.startOuter;
    }
    sector.glowEndSpan = entry.endSpan;
    if (entry.endSpan > 0) {
        sector.glowEndGap = entry.endGap;
        sector.glowEndInner = entry.endInner;
        sector.glowEndOuter = entry.endOuter;
    }
}
