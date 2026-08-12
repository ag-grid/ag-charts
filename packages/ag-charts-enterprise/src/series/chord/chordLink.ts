import { _ModuleSupport } from 'ag-charts-community';
import { SceneChangeDetection, SceneObjectChangeDetection, objectsEqual } from 'ag-charts-core';

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
 * The node edge one end of a link terminates against, and the rounded corners that cut into it.
 * A corner radius is 0 unless this link actually reaches that end of the node's sweep — only the
 * first and last link of a node do.
 */
export interface ChordLinkNodeEdge {
    /** The node's inner radius as `Sector` normalises it, i.e. including the concentric edge inset. */
    innerRadius: number;
    /** The node's radial edge inset, which shifts each corner circle's centre. */
    inset: number;
    startCornerRadius: number;
    endCornerRadius: number;
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
     * Trace one end of the link from `endAngle` back to `startAngle`, filling the area the node's
     * rounded corners cut away rather than stopping short of it and leaving a gap. Where a corner
     * is present the link follows the node's own outline, so it butts up against the node without
     * overlapping its body — an overlap would show through a translucent node and take its
     * pointer events.
     *
     * Assumes the current point is on the link's radius at `endAngle`, and leaves it on the link's
     * radius at `startAngle`, so the caller's curves join up either way.
     */
    private traceEnd(startAngle: number, endAngle: number, edge: ChordLinkNodeEdge | undefined) {
        const { path, centerX, centerY, radius } = this;
        const startCornerRadius = edge?.startCornerRadius ?? 0;
        const endCornerRadius = edge?.endCornerRadius ?? 0;

        if (edge == null || (startCornerRadius <= 0 && endCornerRadius <= 0)) {
            path.arc(centerX, centerY, radius, endAngle, startAngle, true);
            return;
        }

        const { innerRadius, inset } = edge;
        // Angles mirror `Sector`'s inner corner arcs so the two outlines coincide exactly —
        // see startInnerArc/endInnerArc in scene/shape/sector.ts.
        const endCornerCentreRadius = innerRadius + endCornerRadius;
        const endSweep = endCornerRadius > 0 ? Math.asin(endCornerRadius / endCornerCentreRadius) : 0;
        const endCentreAngle = endAngle - inset / endCornerCentreRadius - endSweep;
        const arcEnd = endCornerRadius > 0 ? endCentreAngle : endAngle;

        const startCornerCentreRadius = innerRadius + startCornerRadius;
        const startSweep = startCornerRadius > 0 ? Math.asin(startCornerRadius / startCornerCentreRadius) : 0;
        const startCentreAngle = startAngle + inset / startCornerCentreRadius + startSweep;
        const arcStart = startCornerRadius > 0 ? startCentreAngle : startAngle;

        if (arcEnd <= arcStart) {
            // The link is narrower than the corners it would have to trace, so there is no flat edge
            // left to run between them. Tracing anyway would sweep the arc the long way round the
            // circle; leave this link's end square instead.
            path.arc(centerX, centerY, radius, endAngle, startAngle, true);
            return;
        }

        if (endCornerRadius > 0) {
            path.arc(
                centerX + endCornerCentreRadius * Math.cos(endCentreAngle),
                centerY + endCornerCentreRadius * Math.sin(endCentreAngle),
                endCornerRadius,
                endAngle + Math.PI * 0.5,
                endAngle + Math.PI - endSweep
            );
        }

        path.arc(centerX, centerY, innerRadius, arcEnd, arcStart, true);

        if (startCornerRadius > 0) {
            path.arc(
                centerX + startCornerCentreRadius * Math.cos(startCentreAngle),
                centerY + startCornerCentreRadius * Math.sin(startCentreAngle),
                startCornerRadius,
                startAngle + Math.PI + startSweep,
                startAngle + Math.PI * 1.5
            );
        }

        path.lineTo(centerX + radius * Math.cos(startAngle), centerY + radius * Math.sin(startAngle));
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
