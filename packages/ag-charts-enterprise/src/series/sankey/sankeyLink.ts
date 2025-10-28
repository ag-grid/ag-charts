import { _ModuleSupport } from 'ag-charts-community';
import { type Point, Vec2, clamp } from 'ag-charts-core';

const { BBox, Path, SceneChangeDetection } = _ModuleSupport;

export class SankeyLink<D = any> extends Path<D> {
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

    protected override computeBBox(): _ModuleSupport.BBox | undefined {
        const x = Math.min(this.x1, this.x2);
        const width = Math.max(this.x1, this.x2) - x;
        const y = Math.min(this.y1, this.y2);
        const height = Math.max(this.y1, this.y2) - y + this.height;
        return new BBox(x, y, width, height);
    }

    override updatePath(): void {
        const { path, inset } = this;

        path.clear();

        const height = this.height - 2 * this.inset;
        const offset = height / 2;

        let x1 = this.x1 + inset;
        let y1 = this.y1 + inset;

        path.moveTo(x1, y1);

        // top path
        for (const elbow of this.elbows) {
            this.updatePathSection(x1, y1, elbow.x, elbow.y, height, -offset);
            x1 = elbow.x;
            y1 = elbow.y;
        }

        const x2 = this.x2 - inset;
        const y2 = this.y2 + inset;
        this.updatePathSection(x1, y1, x2, y2, height, -offset);

        // end cap
        path.lineTo(x2, y2 + height);
        x1 = x2;
        y1 = y2;

        // bottom path
        for (const elbow of this.elbows.toReversed()) {
            this.updatePathSection(x1, y1, elbow.x, elbow.y, height, offset);
            x1 = elbow.x;
            y1 = elbow.y;
        }

        this.updatePathSection(x1, y1, this.x1 + inset, this.y1 + inset, height, offset);

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
