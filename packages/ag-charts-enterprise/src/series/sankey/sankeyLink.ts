import { _Scene } from 'ag-charts-community';

const { Path, ScenePathChangeDetection } = _Scene;

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

    override updatePath(): void {
        const { path, x1, x2, y1, y2, height, inset } = this;
        path.clear();
        if (inset > height / 2 || inset > (x2 - x1) / 2) return;

        // The base shape is a bezier starting and ending at the {x,y}{1,2} coordinates
        // The control points have x set to the mid point between x1 and x2, and y of y1 or y2

        path.moveTo(x1, y1);
        if (Math.abs(y2 - y1) < 1) {
            path.lineTo(x2, y2);
            path.lineTo(x2, y2 + height);
            path.lineTo(x1, y1 + height);
        } else if (x2 - x1 > height * Math.SQRT2) {
            // This draws two cubics on both the top and the bottom of the link, preserving the
            // thickness along the base bezier. It's not possible to analytically offset bezier
            // curves like this, so this is an approximation determined visually, and has is no
            // real mathematical basis
            //
            // For each the top and the bottom:-
            //
            // The join of the two cubics is is the midpoint of base bezier, offset by
            // half the height in a direction tangent to the base bezier at its midpoint
            //
            // The control points for each bezier is computed using a line passing
            // through the midpoint of the two cubics with direction of the base bezier
            // at its midpoint
            //
            // For the top bezier, the first control point is where this line intersects with x1.
            // The second control point is offset from the end of the bezier in the direction
            // of the same line, with a distance of half of the average of both the change in x and
            // the change in y. Again, this distance is a heuristic which I determined visually

            const baseBezierMidpointGradient = (2 * (y2 - y1)) / (x2 - x1);
            const theta = Math.atan(-1 / baseBezierMidpointGradient);
            const dir = y2 > y1 ? 1 : -1;

            const dcr = (y2 - y1 + (x2 - x1)) / 8;
            const dcx = dir * dcr * Math.cos(Math.PI / 2 - theta);
            const dcy = dir * dcr * Math.sin(Math.PI / 2 - theta);

            let cx, cy;

            cx = (x1 + x2) / 2 + ((dir * height) / 2) * Math.cos(theta);
            cy = (y1 + y2) / 2 + height / 2 + ((dir * height) / 2) * Math.sin(theta);
            path.cubicCurveTo(cx + (cy - y1) * Math.tan(theta), y1, cx + dcx, cy - dcy, cx, cy);
            path.cubicCurveTo(cx - dcx, cy + dcy, cx - (y2 - cy) * Math.tan(theta), y2, x2, y2);
            path.lineTo(x2, y2 + height);

            cx = (x1 + x2) / 2 - ((dir * height) / 2) * Math.cos(theta);
            cy = (y1 + y2) / 2 + height / 2 - ((dir * height) / 2) * Math.sin(theta);
            path.cubicCurveTo(cx - (y2 + height - cy) * Math.tan(theta), y2 + height, cx - dcx, cy + dcy, cx, cy);
            path.cubicCurveTo(
                cx + dcx,
                cy - dcy,
                cx + (cy - (y1 + height)) * Math.tan(theta),
                y1 + height,
                x1,
                y1 + height
            );
        } else {
            // Unable to preserve thickness in direction tangent to line...
            // Preserve thickness of line in y-axis
            const midX = (x1 + x2) / 2;
            path.cubicCurveTo(midX, y1, midX, y2, x2, y2);
            path.lineTo(x2, y2 + height);
            path.cubicCurveTo(midX, y2 + height, midX, y1 + height, x1, y1 + height);
        }

        path.closePath();
    }
}
