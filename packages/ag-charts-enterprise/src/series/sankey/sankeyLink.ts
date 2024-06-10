import { _Scene } from 'ag-charts-community';

const { BBox, Path, ScenePathChangeDetection } = _Scene;

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

    override computeBBox(): _Scene.BBox | undefined {
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
            // Use De Casteljau to split the base bezier at its midpoint (t = 0.5)
            // This gives two 'trivial' beziers
            const x01 = 0.5 * p0x + 0.5 * p1x;
            const y01 = 0.5 * p0y + 0.5 * p1y;
            const x12 = 0.5 * p1x + 0.5 * p2x;
            const y12 = 0.5 * p1y + 0.5 * p2y;
            const x23 = 0.5 * p2x + 0.5 * p3x;
            const y23 = 0.5 * p2y + 0.5 * p3y;
            const x012 = 0.5 * x01 + 0.5 * x12;
            const y012 = 0.5 * y01 + 0.5 * y12;
            const x123 = 0.5 * x12 + 0.5 * x23;
            const y123 = 0.5 * y12 + 0.5 * y23;
            const x0123 = 0.5 * x012 + 0.5 * x123;
            const y0123 = 0.5 * y012 + 0.5 * y123;

            const ap0x = p0x;
            const ap0y = p0y;
            const ap1x = x01;
            const ap1y = y01;
            const ap2x = x012;
            const ap2y = y012;
            const ap3x = x0123;
            const ap3y = y0123;

            const bp0x = x0123;
            const bp0y = y0123;
            const bp1x = x123;
            const bp1y = y123;
            const bp2x = x23;
            const bp2y = y23;
            const bp3x = p3x;
            const bp3y = p3y;

            const offset = ((y2 > y1 ? 1 : -1) * height) / 2;

            offsetTrivialCubicBezier(path, ap0x, ap0y, ap1x, ap1y, ap2x, ap2y, ap3x, ap3y, offset);
            offsetTrivialCubicBezier(path, bp0x, bp0y, bp1x, bp1y, bp2x, bp2y, bp3x, bp3y, -offset);
            path.lineTo(p3x, p3y + height / 2);
            offsetTrivialCubicBezier(path, bp3x, bp3y, bp2x, bp2y, bp1x, bp1y, bp0x, bp0y, offset);
            offsetTrivialCubicBezier(path, ap3x, ap3y, ap2x, ap2y, ap1x, ap1y, ap0x, ap0y, -offset);
        }

        path.closePath();
    }
}
