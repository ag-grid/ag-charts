import { _ModuleSupport } from 'ag-charts-community';
import { type Point, SceneChangeDetection, Vec2, clamp } from 'ag-charts-core';

const { BBox, Path } = _ModuleSupport;

/**
 * The flat edge of the node a link terminates against, plus the rounded corners that cut into it.
 * `direction` is the way the rounded outline curves away from the flat edge, into the node.
 */
export interface SankeyLinkNodeEdge {
    x: number;
    y: number;
    height: number;
    radius: number;
    direction: 1 | -1;
}

export class SankeyLink<D = unknown> extends Path<D> {
    @SceneChangeDetection()
    x1: number = 0;

    @SceneChangeDetection()
    x2: number = 0;

    @SceneChangeDetection()
    y1: number = 0;

    @SceneChangeDetection()
    y2: number = 0;

    @SceneChangeDetection()
    height: number = 0;

    @SceneChangeDetection()
    inset: number = 0;

    elbows: { x: number; y: number }[] = [];

    startEdge: SankeyLinkNodeEdge | undefined = undefined;
    endEdge: SankeyLinkNodeEdge | undefined = undefined;

    protected override computeBBox(): _ModuleSupport.BBox | undefined {
        const x = Math.min(this.x1, this.x2);
        const width = Math.max(this.x1, this.x2) - x;
        const y = Math.min(this.y1, this.y2);
        const height = Math.max(this.y1, this.y2) - y + this.height;
        return new BBox(x, y, width, height);
    }

    override updatePath(): void {
        const { path, inset, startEdge, endEdge } = this;

        path.clear();

        const height = this.height - 2 * this.inset;
        const offset = height / 2;

        const startTop = this.y1 + inset;
        const startBottom = startTop + height;
        const endTop = this.y2 + inset;
        const endBottom = endTop + height;
        const startFallback = this.x1 + inset;
        const endFallback = this.x2 - inset;

        let x1 = edgeX(startEdge, startTop, inset, startFallback);
        let y1 = startTop;

        path.moveTo(x1, y1);

        // top path
        for (const elbow of this.elbows) {
            this.updatePathSection(x1, y1, elbow.x, elbow.y, height, -offset);
            x1 = elbow.x;
            y1 = elbow.y;
        }

        const x2 = edgeX(endEdge, endTop, inset, endFallback);
        const y2 = endTop;
        this.updatePathSection(x1, y1, x2, y2, height, -offset);

        // end cap
        traceEdge(path, endEdge, endTop, endBottom, inset, endFallback);
        x1 = edgeX(endEdge, endBottom, inset, endFallback);
        y1 = y2;

        // bottom path
        for (const elbow of this.elbows.toReversed()) {
            this.updatePathSection(x1, y1, elbow.x, elbow.y, height, offset);
            x1 = elbow.x;
            y1 = elbow.y;
        }

        this.updatePathSection(x1, y1, edgeX(startEdge, startBottom, inset, startFallback), startTop, height, offset);

        // start cap
        traceEdge(path, startEdge, startBottom, startTop, inset, startFallback);

        path.closePath();
    }

    updatePathSection(x1: number, y1: number, x2: number, y2: number, height: number, yOffset: number) {
        const { path } = this;

        const start = Vec2.from(x1, y1 + yOffset + height / 2);
        const end = Vec2.from(x2, y2 + yOffset + height / 2);

        // Draw straight lines if the vertical change is very small
        if (Math.abs(end.y - start.y) < 2) {
            path.lineTo(end.x, end.y);
            return;
        }

        let angle = Vec2.angle(Vec2.sub(end, start));
        if (angle < 0) angle = 2 * Math.PI + angle;

        const right = 0;
        const down = Math.PI / 2;
        const left = Math.PI;
        const up = Math.PI * 1.5;

        const innerArc = getArcValues(start, end, 0);
        const outerArc = getArcValues(start, end, height);

        // Fallback to a normal curve if there is not enough space to draw the consistent-width arcs
        if (innerArc.radius < height) {
            path.cubicCurveTo((start.x + end.x) / 2, start.y, (start.x + end.x) / 2, end.y, end.x, end.y);
            return;
        }

        if (angle >= up) {
            // up and right
            path.arc(start.x, y1 - innerArc.radius, innerArc.radius, down, down + outerArc.angle, true);
            path.arc(end.x, y2 + outerArc.radius, outerArc.radius, up + outerArc.angle, up);
            path.lineTo(end.x, end.y);
        } else if (angle > right && angle <= down) {
            // down and right
            path.arc(start.x, y1 + outerArc.radius, outerArc.radius, up, up + outerArc.angle);
            path.arc(end.x, y2 - innerArc.radius, innerArc.radius, down + innerArc.angle, down, true);
            path.lineTo(end.x, end.y);
        } else if (angle > down && angle <= left) {
            // down and left
            path.arc(start.x, y1 + outerArc.radius, outerArc.radius - height, up, up + outerArc.angle, true);
            path.arc(end.x, y2 - innerArc.radius, innerArc.radius + height, down + innerArc.angle, down);
            path.lineTo(end.x, end.y);
        } else {
            // up and left
            path.arc(start.x, y1 - innerArc.radius, innerArc.radius + height, down, down + innerArc.angle);
            path.arc(end.x, y2 + outerArc.radius, outerArc.radius - height, up + outerArc.angle, up, true);
            path.lineTo(end.x, end.y);
        }
    }
}

/** Segments of a node edge in top-to-bottom order; `centerY` is the corner circle centre, absent for the flat middle. */
function edgeSegments({ y, height, radius }: SankeyLinkNodeEdge) {
    return [
        { lo: y, hi: y + radius, centerY: y + radius },
        { lo: y + radius, hi: y + height - radius, centerY: undefined },
        { lo: y + height - radius, hi: y + height, centerY: y + height - radius },
    ];
}

function cornerAngle(edge: SankeyLinkNodeEdge, centerY: number, y: number) {
    const angle = Math.asin(clamp(-1, (y - centerY) / edge.radius, 1));
    return edge.direction === 1 ? Math.PI - angle : angle;
}

/** Distance the rounded outline has cut into the node at `y`, as an absolute x. */
function edgeX(edge: SankeyLinkNodeEdge | undefined, y: number, inset: number, fallback: number) {
    if (edge == null || edge.radius <= 0) return fallback;

    const flat = edge.x - edge.direction * inset;
    const clampedY = clamp(edge.y, y, edge.y + edge.height);
    const segment = edgeSegments(edge).find(
        ({ lo, hi, centerY }) => centerY != null && clampedY >= lo && clampedY <= hi
    );
    if (segment?.centerY == null) return flat;

    const dy = clamp(-edge.radius, clampedY - segment.centerY, edge.radius);
    return flat + edge.direction * (edge.radius - Math.sqrt(edge.radius ** 2 - dy ** 2));
}

/**
 * Append the node's own outline between two y positions, so the link fills the space cut away by a corner
 * without overlapping the node body — an overlap would show through a translucent node and would take the
 * node's pointer events.
 */
function traceEdge(
    path: _ModuleSupport.ExtendedPath2D,
    edge: SankeyLinkNodeEdge | undefined,
    fromY: number,
    toY: number,
    inset: number,
    fallback: number
) {
    if (edge == null || edge.radius <= 0) {
        path.lineTo(fallback, toY);
        return;
    }

    const flat = edge.x - edge.direction * inset;
    const cx = flat + edge.direction * edge.radius;
    const down = toY > fromY;
    const lo = Math.min(fromY, toY);
    const hi = Math.max(fromY, toY);
    const segments = edgeSegments(edge);

    for (const { lo: segLo, hi: segHi, centerY } of down ? segments : segments.toReversed()) {
        const from = Math.max(segLo, lo);
        const to = Math.min(segHi, hi);
        if (from >= to) continue;

        if (centerY == null) {
            path.lineTo(flat, down ? to : from);
        } else {
            // Both edges are traversed in the direction of decreasing angle, hence the constant `true`.
            const startAngle = cornerAngle(edge, centerY, down ? from : to);
            const endAngle = cornerAngle(edge, centerY, down ? to : from);
            path.arc(cx, centerY, edge.radius, startAngle, endAngle, true);
        }
    }

    path.lineTo(edgeX(edge, toY, inset, fallback), toY);
}

/**
 * The links are drawn as two arcs of equal radius creating a similar appearance to a bezier curve but with
 * constant width. The `start` and `end` form a chord of a circle that has twice the radius of the pair
 * of arcs we wish to draw.
 */
function getArcValues(start: Point, end: Point, minRadius: number) {
    // Find the perpendicular bisector of the chord
    const lineAngle = Vec2.angle(Vec2.sub(end, start));
    const chordLength = Vec2.distance(start, end);
    const bisect = Vec2.add(start, Vec2.rotate(Vec2.from(chordLength / 2, 0), lineAngle));
    const gradient = -1 / Vec2.gradient(start, end);
    const intercept = Vec2.intercept(bisect, gradient);

    // Offset the arc x position if the gradient is too steep
    const offset = lerpClamp(0.1, 0.5, Math.PI / 2 - Math.abs(Vec2.gradient(start, end)));

    // Where this bisector intersects the x-axis at `start.x` is the centre of the circle
    const center = Vec2.intersectAtX(gradient, intercept, start.x);
    const radius = Math.max(minRadius, Vec2.distance(start, center) * offset);

    // Scale the angle between the center and the bisector (relative to the start) to create an arc that
    // reaches the offset mid-point between the start and end
    const angle = Vec2.angle(Vec2.sub(center, start), Vec2.sub(center, bisect)) / -(1.1 - offset);

    return { angle, radius };
}

function lerpClamp(a: number, b: number, ratio: number) {
    return clamp(a, (b - a) * ratio + a, b);
}
