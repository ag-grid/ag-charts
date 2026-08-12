import { _ModuleSupport } from 'ag-charts-community';
import { SceneChangeDetection, SceneObjectChangeDetection, normalizeAngle360, objectsEqual } from 'ag-charts-core';

const { Path } = _ModuleSupport;

export function bezierControlPoints({
    radius,
    startAngle,
    endAngle,
    tension,
}: {
    radius: number;
    startAngle: number;
    endAngle: number;
    tension: number;
}) {
    const cp0x = radius * Math.cos(startAngle);
    const cp0y = radius * Math.sin(startAngle);
    const cp3x = radius * Math.cos(endAngle);
    const cp3y = radius * Math.sin(endAngle);
    const cp1x = cp0x * tension;
    const cp1y = cp0y * tension;
    const cp2x = cp3x * tension;
    const cp2y = cp3y * tension;

    return {
        x: [cp0x, cp1x, cp2x, cp3x] as const,
        y: [cp0y, cp1y, cp2y, cp3y] as const,
    };
}

/**
 * The inner outline of the node a link end terminates against. Angles are the whole node's, not
 * the link end's — a link end covers whatever part of the outline its own sweep spans, which for a
 * narrow link can be part of a corner rather than all or none of it.
 */
export interface ChordLinkNodeEdge {
    /** The node's inner radius as `Sector` normalises it, i.e. including the concentric edge inset. */
    innerRadius: number;
    /** The corner radius as `Sector` will actually draw it, after clamping. */
    cornerRadius: number;
    startAngle: number;
    endAngle: number;
    /** Angles of the corner circle centres, which also bound the flat part of the inner edge. */
    startCentreAngle: number;
    endCentreAngle: number;
    /** Half-angle a corner circle subtends at the chart centre. */
    cornerSweep: number;
}

/**
 * The angle on circle `(cx, cy, r)` at which the ray from `(centerX, centerY)` at `rayAngle`
 * crosses it, taking the crossing nearer the chart centre — the side a node's inner outline runs
 * along. Undefined when the ray misses the circle.
 */
function circleAngleOnRay(
    centerX: number,
    centerY: number,
    cx: number,
    cy: number,
    r: number,
    rayAngle: number
): number | undefined {
    const cos = Math.cos(rayAngle);
    const sin = Math.sin(rayAngle);
    const dx = cx - centerX;
    const dy = cy - centerY;
    const along = dx * cos + dy * sin;
    const perpendicular = dx * sin - dy * cos;
    const halfChordSquared = r * r - perpendicular * perpendicular;
    if (halfChordSquared <= 0) return;

    const distance = along - Math.sqrt(halfChordSquared);
    if (distance <= 0) return;

    return Math.atan2(centerY + distance * sin - cy, centerX + distance * cos - cx);
}

/** `angle` moved into the turn starting at `from`, then clamped to `[from, to]`. */
function clampArcAngle(angle: number, from: number, to: number): number {
    const normalised = from + normalizeAngle360(angle - from);
    return Math.min(Math.max(normalised, from), to);
}

export class ChordLink<D = unknown> extends Path<D> {
    @SceneChangeDetection()
    centerX: number = 0;

    @SceneChangeDetection()
    centerY: number = 0;

    @SceneChangeDetection()
    radius: number = 0;

    @SceneChangeDetection()
    startAngle1: number = 0;

    @SceneChangeDetection()
    endAngle1: number = 0;

    @SceneChangeDetection()
    startAngle2: number = 0;

    @SceneChangeDetection()
    endAngle2: number = 0;

    @SceneChangeDetection()
    tension: number = 1;

    // Change-detected because a cornerRadius change moves the link's ends without touching any of
    // the angles above, so nothing else would mark the path dirty.
    @SceneObjectChangeDetection({ equals: objectsEqual })
    edge1: ChordLinkNodeEdge | undefined = undefined;

    @SceneObjectChangeDetection({ equals: objectsEqual })
    edge2: ChordLinkNodeEdge | undefined = undefined;

    private tensionedCurveTo(
        cp0x: number,
        cp0y: number,
        cp1x: number,
        cp1y: number,
        cp2x: number,
        cp2y: number,
        cp3x: number,
        cp3y: number
    ) {
        const { path, tension } = this;
        const scale = 1 - tension;

        path.cubicCurveTo(
            (cp1x - cp0x) * scale + cp0x,
            (cp1y - cp0y) * scale + cp0y,
            (cp2x - cp3x) * scale + cp3x,
            (cp2y - cp3y) * scale + cp3y,
            cp3x,
            cp3y
        );
    }

    /**
     * Trace one end of the link from `endAngle` back to `startAngle` along the node's own inner
     * outline, filling the area its rounded corners cut away rather than stopping short of it and
     * leaving a gap. The outline is clipped to this link end's sweep, so each link fills exactly
     * its own share of a corner and no link overlaps the node body or its neighbours — an overlap
     * would show through the semi-transparent fills and take the node's pointer events.
     *
     * Assumes the current point is on the link's radius at `endAngle`, and leaves it on the link's
     * radius at `startAngle`, so the caller's curves join up either way.
     */
    private traceEnd(startAngle: number, endAngle: number, edge: ChordLinkNodeEdge | undefined) {
        const { path, centerX, centerY, radius } = this;

        if (edge == null || edge.cornerRadius <= 0) {
            path.arc(centerX, centerY, radius, endAngle, startAngle, true);
            return;
        }

        const { innerRadius, cornerRadius, startCentreAngle, endCentreAngle, cornerSweep } = edge;
        const centreRadius = innerRadius + cornerRadius;
        const delta = 1e-6;

        // Corner arcs run from the node's radial edge to the tangent point on its inner edge, and a
        // point's polar angle falls as the arc is traced, so this link end's higher boundary maps to
        // the lower arc angle. Angles mirror `Sector`'s startInnerArc/endInnerArc so the two
        // outlines coincide exactly — see scene/shape/sector.ts.
        if (endAngle > endCentreAngle + delta) {
            const cx = centerX + centreRadius * Math.cos(endCentreAngle);
            const cy = centerY + centreRadius * Math.sin(endCentreAngle);
            const edgeAngle = edge.endAngle + Math.PI * 0.5;
            const tangentAngle = edge.endAngle + Math.PI - cornerSweep;
            // A boundary flush with the node's own edge takes the arc's endpoint rather than a ray
            // crossing, because that endpoint sits on the node's radially inset edge, not on the ray.
            const from =
                endAngle >= edge.endAngle - delta
                    ? edgeAngle
                    : this.cornerArcAngle(endAngle, cx, cy, cornerRadius, edgeAngle, tangentAngle, edgeAngle);
            const to =
                startAngle <= endCentreAngle + delta
                    ? tangentAngle
                    : this.cornerArcAngle(startAngle, cx, cy, cornerRadius, edgeAngle, tangentAngle, tangentAngle);
            if (to > from) {
                path.arc(cx, cy, cornerRadius, from, to);
            }
        }

        const flatEnd = Math.min(endAngle, endCentreAngle);
        const flatStart = Math.max(startAngle, startCentreAngle);
        if (flatEnd > flatStart + delta) {
            path.arc(centerX, centerY, innerRadius, flatEnd, flatStart, true);
        }

        if (startAngle < startCentreAngle - delta) {
            const cx = centerX + centreRadius * Math.cos(startCentreAngle);
            const cy = centerY + centreRadius * Math.sin(startCentreAngle);
            const tangentAngle = edge.startAngle + Math.PI + cornerSweep;
            const edgeAngle = edge.startAngle + Math.PI * 1.5;
            const from =
                endAngle >= startCentreAngle - delta
                    ? tangentAngle
                    : this.cornerArcAngle(endAngle, cx, cy, cornerRadius, tangentAngle, edgeAngle, tangentAngle);
            const to =
                startAngle <= edge.startAngle + delta
                    ? edgeAngle
                    : this.cornerArcAngle(startAngle, cx, cy, cornerRadius, tangentAngle, edgeAngle, edgeAngle);
            if (to > from) {
                path.arc(cx, cy, cornerRadius, from, to);
            }
        }

        path.lineTo(centerX + radius * Math.cos(startAngle), centerY + radius * Math.sin(startAngle));
    }

    private cornerArcAngle(
        boundaryAngle: number,
        cx: number,
        cy: number,
        cornerRadius: number,
        from: number,
        to: number,
        fallback: number
    ) {
        const angle = circleAngleOnRay(this.centerX, this.centerY, cx, cy, cornerRadius, boundaryAngle);
        return angle == null ? fallback : clampArcAngle(angle, from, to);
    }

    override updatePath(): void {
        const { path, centerX, centerY, radius } = this;
        let { startAngle1, endAngle1, startAngle2, endAngle2, edge1, edge2 } = this;
        if (startAngle1 > startAngle2) {
            [startAngle1, startAngle2] = [startAngle2, startAngle1];
            [endAngle1, endAngle2] = [endAngle2, endAngle1];
            [edge1, edge2] = [edge2, edge1];
        }

        path.clear();
        const startX = centerX + radius * Math.cos(startAngle1);
        const startY = centerY + radius * Math.sin(startAngle1);
        path.moveTo(startX, startY);
        this.tensionedCurveTo(
            startX,
            startY,
            centerX,
            centerY,
            centerX,
            centerY,
            centerX + radius * Math.cos(endAngle2),
            centerY + radius * Math.sin(endAngle2)
        );
        this.traceEnd(startAngle2, endAngle2, edge2);
        this.tensionedCurveTo(
            centerX + radius * Math.cos(startAngle2),
            centerY + radius * Math.sin(startAngle2),
            centerX,
            centerY,
            centerX,
            centerY,
            centerX + radius * Math.cos(endAngle1),
            centerY + radius * Math.sin(endAngle1)
        );
        this.traceEnd(startAngle1, endAngle1, edge1);
        path.closePath();
    }
}
