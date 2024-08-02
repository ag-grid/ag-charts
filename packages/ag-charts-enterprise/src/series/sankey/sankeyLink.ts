import { _Scene } from 'ag-charts-community';

const { BBox, Path, ScenePathChangeDetection, splitBezier } = _Scene;

function offsetTrivialCubicBezier(
    path: _Scene.ExtendedPath2D,
    p0x: number,
    p0y: number,
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number,
    p3x: number,
    p3y: number,
    offset: number
) {
    /**
     * An ok-ish approximation for Bezier curves where:-
     * - The inner control points on the same side of the line p0->p1
     * - It has no self-intersections
     * - The offset distance won't cause self-intersections in the output bezier
     *
     * It currently doesn't apply the offset in the correct direction -
     * ideally it would apply positive offsets moving towards the inner control points
     */
    let tx, ty;

    if (p1y !== p0y && p3y !== p2y) {
        // Calculate slopes of the lines
        const slope1 = -(p1x - p0x) / (p1y - p0y);
        const slope2 = -(p3x - p2x) / (p3y - p2y);

        tx = (p2y - p0y + slope1 * p0x - slope2 * p2x) / (slope1 - slope2);
        ty = slope1 * (tx - p0x) + p0y;
    } else if (p1y === p0y && p3y !== p2y) {
        tx = p0x;
        const slope2 = -(p3x - p2x) / (p3y - p2y);
        ty = slope2 * (tx - p3x) + p3y;
    } else if (p1y !== p0y && p3y === p2y) {
        tx = p3x;
        const slope1 = -(p1x - p0x) / (p1y - p0y);
        ty = slope1 * (tx - p0x) + p0y;
    } else {
        // We don't hit this case for sankey links
        // But if we want to make this more generic, we need to support this
        throw new Error('Offsetting flat bezier curve');
    }

    const d0 = Math.hypot(p0y - ty, p0x - tx);
    const s0 = (d0 + offset) / d0;
    const d1 = Math.hypot(p3y - ty, p3x - tx);
    const s1 = (d1 + offset) / d1;

    // const q0x = tx + (p0x - tx) * s0;
    // const q0y = ty + (p0y - ty) * s0;
    const q1x = tx + (p1x - tx) * s0;
    const q1y = ty + (p1y - ty) * s0;
    const q2x = tx + (p2x - tx) * s1;
    const q2y = ty + (p2y - ty) * s1;
    const q3x = tx + (p3x - tx) * s1;
    const q3y = ty + (p3y - ty) * s1;

    path.cubicCurveTo(q1x, q1y, q2x, q2y, q3x, q3y);
}

export class SankeyLink extends Path {
    @ScenePathChangeDetection()
    x1: number = 0;

    @ScenePathChangeDetection()
    x2: number = 0;

    @ScenePathChangeDetection()
    y1: number = 0;

    @ScenePathChangeDetection()
    y2: number = 0;

    @ScenePathChangeDetection()
    height: number = 0;

    @ScenePathChangeDetection()
    inset: number = 0;

    protected override computeBBox(): _Scene.BBox | undefined {
        const x = Math.min(this.x1, this.x2);
        const width = Math.max(this.x1, this.x2) - x;
        const y = Math.min(this.y1, this.y2);
        const height = Math.max(this.y1, this.y2) - y + this.height;
        return new BBox(x, y, width, height);
    }

    override updatePath(): void {
        const { path, inset } = this;

        path.clear();

        const x1 = this.x1 + inset;
        const x2 = this.x2 - inset;
        const y1 = this.y1 + inset;
        const y2 = this.y2 + inset;
        const height = this.height - 2 * inset;

        if (height < 0 || x1 > x2) return;

        const p0x = x1;
        const p0y = y1 + height / 2;
        const p1x = (x1 + x2) / 2;
        const p1y = y1 + height / 2;
        const p2x = (x1 + x2) / 2;
        const p2y = y2 + height / 2;
        const p3x = x2;
        const p3y = y2 + height / 2;

        path.moveTo(p0x, p0y - height / 2);
        if (Math.abs(this.y2 - this.y1) < 1 || this.x2 - this.x1 < this.height * Math.SQRT2) {
            path.cubicCurveTo(p1x, p1y - height / 2, p2x, p2y - height / 2, p3x, p3y - height / 2);
            path.lineTo(p3x, p3y + height / 2);
            path.cubicCurveTo(p2x, p2y + height / 2, p1x, p1y + height / 2, p0x, p0y + height / 2);
        } else {
            const [a, b] = splitBezier(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, 0.5);
            const offset = ((y2 > y1 ? 1 : -1) * height) / 2;

            offsetTrivialCubicBezier(path, a[0].x, a[0].y, a[1].x, a[1].y, a[2].x, a[2].y, a[3].x, a[3].y, offset);
            offsetTrivialCubicBezier(path, b[0].x, b[0].y, b[1].x, b[1].y, b[2].x, b[2].y, b[3].x, b[3].y, -offset);
            path.lineTo(p3x, p3y + height / 2);
            offsetTrivialCubicBezier(path, b[3].x, b[3].y, b[2].x, b[2].y, b[1].x, b[1].y, b[0].x, b[0].y, offset);
            offsetTrivialCubicBezier(path, a[3].x, a[3].y, a[2].x, a[2].y, a[1].x, a[1].y, a[0].x, a[0].y, -offset);
        }

        path.closePath();
    }
}
