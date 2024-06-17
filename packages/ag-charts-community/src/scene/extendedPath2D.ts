import { angleDiff } from '../util/angle';
import { arcDistanceSquared, lineDistanceSquared } from '../util/distance';
import { Logger } from '../util/logger';
import { arcIntersections, cubicSegmentIntersections, segmentIntersection } from './intersection';

enum Command {
    Move,
    Line,
    Arc,
    Curve,
    ClosePath,
}

export class ExtendedPath2D {
    // The methods of this class will likely be called many times per animation frame,
    // and any allocation can trigger a GC cycle during animation, so we attempt
    // to minimize the number of allocations.

    private path2d = new Path2D();

    private previousCommands: Command[] = [];
    private previousParams: number[] = [];
    private previousClosedPath: boolean = false;
    commands: Command[] = [];
    params: number[] = [];

    openedPath: boolean = false;
    closedPath: boolean = false;

    isDirty() {
        return (
            this.closedPath !== this.previousClosedPath ||
            this.previousCommands.length !== this.commands.length ||
            this.previousParams.length !== this.params.length ||
            this.previousCommands.toString() !== this.commands.toString() ||
            this.previousParams.toString() !== this.params.toString()
        );
    }

    getPath2D() {
        return this.path2d;
    }

    moveTo(x: number, y: number) {
        this.openedPath = true;
        this.path2d.moveTo(x, y);
        this.commands.push(Command.Move);
        this.params.push(x, y);
    }

    lineTo(x: number, y: number) {
        if (this.openedPath) {
            this.path2d.lineTo(x, y);
            this.commands.push(Command.Line);
            this.params.push(x, y);
        } else {
            this.moveTo(x, y);
        }
    }

    rect(x: number, y: number, width: number, height: number) {
        this.moveTo(x, y);
        this.lineTo(x + width, y);
        this.lineTo(x + width, y + height);
        this.lineTo(x, y + height);
        this.closePath();
    }

    roundRect(x: number, y: number, width: number, height: number, radii: number) {
        // Newer API - so support is limited
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/roundRect
        radii = Math.min(radii, width / 2, height / 2);
        this.moveTo(x, y + radii);
        this.arc(x + radii, y + radii, radii, Math.PI, 1.5 * Math.PI);
        this.lineTo(x + radii, y);
        this.lineTo(x + width - radii, y);
        this.arc(x + width - radii, y + radii, radii, 1.5 * Math.PI, 2 * Math.PI);
        this.lineTo(x + width, y + radii);
        this.lineTo(x + width, y + height - radii);
        this.arc(x + width - radii, y + height - radii, radii, 0, Math.PI / 2);
        this.lineTo(x + width - radii, y + height);
        this.lineTo(x + radii, y + height);
        this.arc(x + +radii, y + height - radii, radii, Math.PI / 2, Math.PI);
        this.lineTo(x, y + height - radii);
        this.closePath();
    }

    arc(x: number, y: number, r: number, sAngle: number, eAngle: number, counterClockwise?: boolean) {
        this.openedPath = true;
        this.path2d.arc(x, y, r, sAngle, eAngle, counterClockwise);
        this.commands.push(Command.Arc);
        this.params.push(x, y, r, sAngle, eAngle, counterClockwise ? 1 : 0);
    }

    cubicCurveTo(cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number) {
        if (!this.openedPath) {
            this.moveTo(cx1, cy1);
        }
        this.path2d.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
        this.commands.push(Command.Curve);
        this.params.push(cx1, cy1, cx2, cy2, x, y);
    }

    closePath() {
        if (this.openedPath) {
            this.path2d.closePath();
            this.commands.push(Command.ClosePath);
            this.openedPath = false;
            this.closedPath = true;
        }
    }

    clear(trackChanges?: boolean) {
        if (trackChanges) {
            this.previousCommands = this.commands;
            this.previousParams = this.params;
            this.previousClosedPath = this.closedPath;
        }
        this.path2d = new Path2D();
        this.openedPath = false;
        this.closedPath = false;
        this.commands = [];
        this.params = [];
    }

    isPointInPath(x: number, y: number): boolean {
        const commands = this.commands;
        const params = this.params;
        const cn = commands.length;
        // Hit testing using ray casting method, where the ray's origin is some point
        // outside the path. In this case, an offscreen point that is remote enough, so that
        // even if the path itself is large and is partially offscreen, the ray's origin
        // will likely be outside the path anyway. To test if the given point is inside the
        // path or not, we cast a ray from the origin to the given point and check the number
        // of intersections of this segment with the path. If the number of intersections is
        // even, then the ray both entered and exited the path an equal number of times,
        // therefore the point is outside the path, and inside the path, if the number of
        // intersections is odd. Since the path is compound, we check if the ray segment
        // intersects with each of the path's segments, which can be either a line segment
        // (one or no intersection points) or a Bézier curve segment (up to 3 intersection
        // points).
        const ox = -10000;
        const oy = -10000;
        // the starting point of the  current path
        let sx: number = NaN;
        let sy: number = NaN;
        // the previous point of the current path
        let px = 0;
        let py = 0;
        let intersectionCount = 0;

        for (let ci = 0, pi = 0; ci < cn; ci++) {
            switch (commands[ci]) {
                case Command.Move:
                    intersectionCount += segmentIntersection(sx, sy, px, py, ox, oy, x, y);
                    px = params[pi++];
                    sx = px;
                    py = params[pi++];
                    sy = py;
                    break;
                case Command.Line:
                    intersectionCount += segmentIntersection(px, py, params[pi++], params[pi++], ox, oy, x, y);
                    px = params[pi - 2];
                    py = params[pi - 1];
                    break;
                case Command.Curve:
                    intersectionCount += cubicSegmentIntersections(
                        px,
                        py,
                        params[pi++],
                        params[pi++],
                        params[pi++],
                        params[pi++],
                        params[pi++],
                        params[pi++],
                        ox,
                        oy,
                        x,
                        y
                    );
                    px = params[pi - 2];
                    py = params[pi - 1];
                    break;
                case Command.Arc:
                    const cx = params[pi++];
                    const cy = params[pi++];
                    const r = params[pi++];
                    const startAngle = params[pi++];
                    const endAngle = params[pi++];
                    const counterClockwise = Boolean(params[pi++]);
                    intersectionCount += arcIntersections(
                        cx,
                        cy,
                        r,
                        startAngle,
                        endAngle,
                        counterClockwise,
                        ox,
                        oy,
                        x,
                        y
                    );
                    if (!isNaN(sx)) {
                        // AG-10199 the arc() command draws a connector line between previous position and the starting
                        // position of the arc. So we need to check if there's an intersection with this connector line.
                        const startX = cx + Math.cos(startAngle) * r;
                        const startY = cy + Math.sin(startAngle) * r;
                        intersectionCount += segmentIntersection(px, py, startX, startY, ox, oy, x, y);
                    }
                    px = cx + Math.cos(endAngle) * r;
                    py = cy + Math.sin(endAngle) * r;
                    break;
                case Command.ClosePath:
                    intersectionCount += segmentIntersection(sx, sy, px, py, ox, oy, x, y);
                    break;
            }
        }

        return intersectionCount % 2 === 1;
    }

    distanceSquared(x: number, y: number): number {
        let best = Infinity;
        const commands = this.commands;
        const params = this.params;
        const cn = commands.length;
        // the starting point of the  current path
        let sx: number = NaN;
        let sy: number = NaN;
        // the previous point of the current path
        let px = 0;
        let py = 0;

        for (let ci = 0, pi = 0; ci < cn; ci++) {
            switch (commands[ci]) {
                case Command.Move:
                    px = sx = params[pi++];
                    py = sy = params[pi++];
                    break;
                case Command.Line: {
                    const nx = params[pi++];
                    const ny = params[pi++];
                    best = lineDistanceSquared(x, y, px, py, nx, ny, best);
                    break;
                }
                case Command.Curve:
                    Logger.error('Command.Curve distanceSquare not implemented');
                    break;
                case Command.Arc: {
                    const cx = params[pi++];
                    const cy = params[pi++];
                    const r = params[pi++];
                    const startAngle = params[pi++];
                    const endAngle = params[pi++];
                    const startX = cx + Math.cos(startAngle) * r;
                    const startY = cy + Math.sin(startAngle) * r;
                    const counterClockwise = Boolean(params[pi++]);
                    best = lineDistanceSquared(x, y, px, py, startX, startY, best);
                    best = arcDistanceSquared(x, y, cx, cy, r, startAngle, endAngle, counterClockwise, best);
                    px = cx + Math.cos(endAngle) * r;
                    py = cy + Math.sin(endAngle) * r;
                    break;
                }
                case Command.ClosePath:
                    best = lineDistanceSquared(x, y, px, py, sx, sy, best);
                    break;
            }
        }

        return best;
    }

    getPoints(): Array<{ x: number; y: number }> {
        const { commands, params } = this;

        const coords: Array<{ x: number; y: number }> = [];
        let pi = 0;

        for (let ci = 0; ci < commands.length; ci++) {
            switch (commands[ci]) {
                case Command.Move:
                case Command.Line:
                    coords.push({ x: params[pi++], y: params[pi++] });
                    break;
                case Command.Curve:
                    pi += 4;
                    coords.push({ x: params[pi++], y: params[pi++] });
                    break;
                case Command.Arc:
                    coords.push({ x: params[pi++], y: params[pi++] });
                    pi += 4;
                    break;
                case Command.ClosePath:
                    break;
            }
        }

        return coords;
    }

    // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
    computeSVGDataPath(ox: number, oy: number): string {
        const buffer: (string | number)[] = [];
        const { commands, params } = this;

        let pi = 0;
        for (let ci = 0; ci < commands.length; ci++) {
            switch (commands[ci]) {
                case Command.Move:
                    buffer.push('M', ox + params[pi++], oy + params[pi++]);
                    break;
                case Command.Line:
                    buffer.push('L', ox + params[pi++], oy + params[pi++]);
                    break;
                case Command.Curve:
                    throw new Error('Not implemented');
                case Command.Arc:
                    const [cx, cy, r, a0, a1, ccw] = [
                        params[pi++],
                        params[pi++],
                        params[pi++],
                        params[pi++],
                        params[pi++],
                        params[pi++],
                    ];
                    const x0 = ox + cx + Math.cos(a0) * r;
                    const y0 = oy + cy + Math.sin(a0) * r;
                    const x1 = ox + cx + Math.cos(a1) * r;
                    const y1 = oy + cy + Math.sin(a1) * r;
                    const largeArcFlag = angleDiff(a0, a1, !!ccw) > Math.PI ? 1 : 0;
                    const sweepFlag = (ccw + 1) % 2;
                    buffer.push('L', x0, y0, 'A', r, r, 0, largeArcFlag, sweepFlag, x1, y1);
                    break;
                case Command.ClosePath:
                    buffer.push('Z');
                    break;
            }
        }

        return buffer.join(' ');
    }
}
