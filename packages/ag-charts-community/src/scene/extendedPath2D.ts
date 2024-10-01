import { normalizeAngle360 } from '../util/angle';
import { arcDistanceSquared, lineDistanceSquared } from '../util/distance';
import { Logger } from '../util/logger';
import { BBox } from './bbox';
import { arcIntersections, cubicSegmentIntersections, segmentIntersection } from './intersection';
import { calculateDerivativeExtremaXY, evaluateBezier } from './util/bezier';

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
                case Command.Arc: {
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
                }
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
    toSVG(transform: (x: number, y: number) => { x: number; y: number } = (x, y) => ({ x, y })): string {
        const buffer: (string | number)[] = [];
        const { commands, params } = this;

        const addCommand = (command: string, ...points: number[]) => {
            buffer.push(command);
            for (let i = 0; i < points.length; i += 2) {
                const { x, y } = transform(points[i], points[i + 1]);
                buffer.push(x, y);
            }
        };

        let pi = 0;
        for (let ci = 0; ci < commands.length; ci++) {
            switch (commands[ci]) {
                case Command.Move:
                    addCommand('M', params[pi++], params[pi++]);
                    break;
                case Command.Line:
                    addCommand('L', params[pi++], params[pi++]);
                    break;
                case Command.Curve:
                    addCommand('C', params[pi++], params[pi++], params[pi++], params[pi++], params[pi++], params[pi++]);
                    break;
                case Command.Arc: {
                    const cx = params[pi++];
                    const cy = params[pi++];
                    const r = params[pi++];
                    const A0 = params[pi++];
                    const A1 = params[pi++];
                    const ccw = params[pi++];

                    let sweep = ccw ? A0 - A1 : A1 - A0;
                    if (sweep < 0) {
                        sweep += Math.ceil(-sweep / (2 * Math.PI)) * 2 * Math.PI;
                    }
                    if (ccw) {
                        sweep = -sweep;
                    }

                    // A bezier curve can handle at most one quarter turn
                    const arcSections = Math.max(Math.ceil(Math.abs(sweep) / (Math.PI / 2)), 1);

                    const step = sweep / arcSections;
                    const h = (4 / 3) * Math.tan(step / 4);

                    const move = buffer.length === 0 ? 'M' : 'L';
                    addCommand(move, cx + Math.cos(A0) * r, cy + Math.sin(A0) * r);

                    for (let i = 0; i < arcSections; i += 1) {
                        const a0 = A0 + step * (i + 0);
                        const a1 = A0 + step * (i + 1);

                        // "Approximation of circular arcs by cubic polynomials",
                        // Michael Goldapp, Computer Aided Geometric Design 8 (1991) 227-238
                        const rSinStart = r * Math.sin(a0);
                        const rCosStart = r * Math.cos(a0);
                        const rSinEnd = r * Math.sin(a1);
                        const rCosEnd = r * Math.cos(a1);

                        addCommand(
                            'C',
                            cx + rCosStart - h * rSinStart,
                            cy + rSinStart + h * rCosStart,
                            cx + rCosEnd + h * rSinEnd,
                            cy + rSinEnd - h * rCosEnd,
                            cx + rCosEnd,
                            cy + rSinEnd
                        );
                    }
                    break;
                }
                case Command.ClosePath:
                    buffer.push('Z');
                    break;
            }
        }

        return buffer.join(' ');
    }

    computeBBox(): BBox {
        const { commands, params } = this;
        let [top, left, right, bot] = [Infinity, Infinity, -Infinity, -Infinity];
        let [sx, sy] = [NaN, NaN]; // the starting point of the current path
        let [mx, my] = [NaN, NaN]; // the end point for a ClosePath command.

        const joinPoint = (x: number, y: number, updatestart?: boolean) => {
            top = Math.min(y, top);
            left = Math.min(x, left);
            right = Math.max(x, right);
            bot = Math.max(y, bot);

            if (updatestart) {
                [sx, sy] = [x, y];
            }
        };

        let pi = 0;
        for (let ci = 0; ci < commands.length; ci++) {
            switch (commands[ci]) {
                case Command.Move:
                    joinPoint(params[pi++], params[pi++], true);
                    [mx, my] = [sx, sy];
                    break;
                case Command.Line:
                    joinPoint(params[pi++], params[pi++], true);
                    break;
                case Command.Curve:
                    const cp1x = params[pi++];
                    const cp1y = params[pi++];
                    const cp2x = params[pi++];
                    const cp2y = params[pi++];
                    const x = params[pi++];
                    const y = params[pi++];
                    joinPoint(x, y, true);

                    const Ts = calculateDerivativeExtremaXY(sx, sy, cp1x, cp1y, cp2x, cp2y, x, y);

                    // Check points where the derivative is zero
                    Ts.forEach((t: number) => {
                        const px = evaluateBezier(sx, cp1x, cp2x, x, t);
                        const py = evaluateBezier(sy, cp1y, cp2y, y, t);
                        joinPoint(px, py);
                    });
                    break;
                case Command.Arc: {
                    const cx = params[pi++];
                    const cy = params[pi++];
                    const r = params[pi++];
                    let A0 = normalizeAngle360(params[pi++]);
                    let A1 = normalizeAngle360(params[pi++]);
                    const ccw = params[pi++];

                    if (ccw) {
                        [A0, A1] = [A1, A0];
                    }

                    const joinAngle = (angle: number, updatestart?: boolean) => {
                        const px = cx + r * Math.cos(angle);
                        const py = cy + r * Math.sin(angle);
                        joinPoint(px, py, updatestart);
                    };
                    joinAngle(A0);
                    joinAngle(A1, true);
                    const criticalAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
                    for (const crit of criticalAngles) {
                        if ((A0 < A1 && A0 <= crit && crit <= A1) || (A0 > A1 && (A0 <= crit || crit <= A1))) {
                            joinAngle(crit);
                        }
                    }
                    break;
                }
                case Command.ClosePath:
                    [sx, sy] = [mx, my];
                    break;
            }
        }

        return new BBox(left, top, right - left, bot - top);
    }
}
