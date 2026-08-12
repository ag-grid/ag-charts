import { _ModuleSupport } from 'ag-charts-community';
import type { DistantObject } from 'ag-charts-core';
import { SceneChangeDetection, lineDistanceSquared } from 'ag-charts-core';

const { BBox, Path } = _ModuleSupport;

const delta = 1e-6;
function pointsEq([ax, ay]: readonly [number, number], [bx, by]: readonly [number, number]) {
    return Math.abs(ax - bx) <= delta && Math.abs(ay - by) <= delta;
}

/**
 * The flat edge of a segment the connector terminates against, running `from` -> `to`, with `flank` pointing
 * along the segment's perpendicular edges (into the segment) — the direction the rounded corners cut in from.
 */
interface ConnectorCap {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    radius: number;
    flankX: number;
    flankY: number;
}

export class FunnelConnector<D = unknown> extends Path<D> implements DistantObject {
    @SceneChangeDetection()
    x0: number = 0;

    @SceneChangeDetection()
    y0: number = 0;

    @SceneChangeDetection()
    x1: number = 0;

    @SceneChangeDetection()
    y1: number = 0;

    @SceneChangeDetection()
    x2: number = 0;

    @SceneChangeDetection()
    y2: number = 0;

    @SceneChangeDetection()
    x3: number = 0;

    @SceneChangeDetection()
    y3: number = 0;

    /** Corner radius drawn by the segment this connector leaves, already clamped to that segment's size. */
    @SceneChangeDetection()
    startCornerRadius: number = 0;

    /** Corner radius drawn by the segment this connector arrives at, already clamped to that segment's size. */
    @SceneChangeDetection()
    endCornerRadius: number = 0;

    /** Whether the edges shared with the segments run along the x axis, i.e. the funnel flows vertically. */
    @SceneChangeDetection()
    capsAlongX: boolean = false;

    get midPoint(): { x: number; y: number } {
        const { x0, y0, x1, y1, x2, y2, x3, y3 } = this;
        return {
            x: (x0 + x1 + x2 + x3) / 4,
            y: (y0 + y1 + y2 + y3) / 4,
        };
    }

    override distanceSquared(x: number, y: number): number {
        if (this.containsPoint(x, y)) return 0;

        const { x0, y0, x1, y1, x2, y2, x3, y3 } = this;
        return Math.min(
            lineDistanceSquared(x, y, x0, y0, x1, y1, Infinity),
            lineDistanceSquared(x, y, x1, y1, x2, y2, Infinity),
            lineDistanceSquared(x, y, x2, y2, x3, y3, Infinity),
            lineDistanceSquared(x, y, x3, y3, x0, y0, Infinity)
        );
    }

    protected override computeBBox(): _ModuleSupport.BBox | undefined {
        const { x0, y0, x1, y1, x2, y2, x3, y3, capsAlongX } = this;
        let x = Math.min(x0, x1, x2, x3);
        let width = Math.max(x0, x1, x2, x3) - x;
        let y = Math.min(y0, y1, y2, y3);
        let height = Math.max(y0, y1, y2, y3) - y;

        // The rounded caps reach past the quad, into the cut-away corners of both segments.
        const overhang = Math.max(this.startCornerRadius, this.endCornerRadius);
        if (capsAlongX) {
            y -= overhang;
            height += 2 * overhang;
        } else {
            x -= overhang;
            width += 2 * overhang;
        }

        return new BBox(x, y, width, height);
    }

    override updatePath(): void {
        this.path.clear();

        if (this.startCornerRadius > 0 || this.endCornerRadius > 0) {
            this.traceRoundedPath();
        } else {
            this.traceQuadPath();
        }

        this.path.closePath();
    }

    /** Fills the corners the segments' radii cut away, so the connector butts up against the rounded outline. */
    private traceRoundedPath() {
        const { path } = this;
        let moved = false;

        for (const cap of this.caps()) {
            const { fromX, fromY, toX, toY, flankX, flankY } = cap;
            const length = Math.hypot(toX - fromX, toY - fromY);
            const radius = Math.min(cap.radius, length / 2);

            if (moved) {
                path.lineTo(fromX, fromY);
            } else {
                path.moveTo(fromX, fromY);
                moved = true;
            }

            if (radius <= 0) {
                path.lineTo(toX, toY);
                continue;
            }

            const capX = (toX - fromX) / length;
            const capY = (toY - fromY) / length;
            // Both corners are convex and traversed in the same rotational sense.
            const counterClockwise = capX * flankY - capY * flankX < 0;
            const flankAngle = Math.atan2(-flankY, -flankX);
            const capAngle = Math.atan2(-capY, -capX);

            // Up the segment's perpendicular edge to the tangent point, around the corner, along the flat edge.
            path.lineTo(fromX + flankX * radius, fromY + flankY * radius);
            path.arc(
                fromX + (capX + flankX) * radius,
                fromY + (capY + flankY) * radius,
                radius,
                capAngle,
                flankAngle,
                counterClockwise
            );

            path.lineTo(toX - capX * radius, toY - capY * radius);
            path.arc(
                toX + (flankX - capX) * radius,
                toY + (flankY - capY) * radius,
                radius,
                flankAngle,
                Math.atan2(capY, capX),
                counterClockwise
            );
            path.lineTo(toX, toY);
        }
    }

    private caps(): ConnectorCap[] {
        const { x0, y0, x1, y1, x2, y2, x3, y3, startCornerRadius, endCornerRadius, capsAlongX } = this;

        if (capsAlongX) {
            const flankY = y0 <= y2 ? -1 : 1;
            return [
                { fromX: x0, fromY: y0, toX: x1, toY: y1, radius: startCornerRadius, flankX: 0, flankY },
                { fromX: x2, fromY: y2, toX: x3, toY: y3, radius: endCornerRadius, flankX: 0, flankY: -flankY },
            ];
        }

        const flankX = x1 >= x0 ? 1 : -1;
        return [
            { fromX: x1, fromY: y1, toX: x2, toY: y2, radius: endCornerRadius, flankX, flankY: 0 },
            { fromX: x3, fromY: y3, toX: x0, toY: y0, radius: startCornerRadius, flankX: -flankX, flankY: 0 },
        ];
    }

    private traceQuadPath(): void {
        const { path, x0, y0, x1, y1, x2, y2, x3, y3 } = this;
        const points = [
            [x0, y0],
            [x1, y1],
            [x2, y2],
            [x3, y3],
        ] as const;

        let start: readonly [number, number] | undefined;
        let current: readonly [number, number] | undefined;

        // Required because path hit detection is flaky when the points are the same
        for (const p of points) {
            if ((start != null && pointsEq(start, p)) || (current != null && pointsEq(current, p))) {
                continue;
            }

            const [x, y] = p;
            if (start == null) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }

            start ??= p;
            current = p;
        }
    }
}
