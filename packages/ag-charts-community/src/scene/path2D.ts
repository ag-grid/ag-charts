import { arcIntersections, cubicSegmentIntersections, segmentIntersection } from './intersection';

enum Command {
    Move,
    Line,
    Arc,
    Curve,
    ClosePath,
}

export class Path2D {
    // The methods of this class will likely be called many times per animation frame,
    // and any allocation can trigger a GC cycle during animation, so we attempt
    // to minimize the number of allocations.

    private xy?: [number, number];
    private previousCommands: Command[] = [];
    private previousParams: number[] = [];
    private previousClosedPath: boolean = false;
    commands: Command[] = [];
    params: number[] = [];

    isDirty() {
        if (this._closedPath !== this.previousClosedPath) {
            return true;
        }
        if (this.previousCommands.length !== this.commands.length) {
            return true;
        }
        if (this.previousParams.length !== this.params.length) {
            return true;
        }

        for (let i = 0; i < this.commands.length; i++) {
            if (this.commands[i] !== this.previousCommands[i]) {
                return true;
            }
        }

        for (let i = 0; i < this.params.length; i++) {
            if (this.params[i] !== this.previousParams[i]) {
                return true;
            }
        }

        return false;
    }

    draw(ctx: CanvasDrawPath & CanvasPath) {
        const commands = this.commands;
        const params = this.params;
        let j = 0;

        ctx.beginPath();
        for (const command of commands) {
            switch (command) {
                case Command.Move:
                    ctx.moveTo(params[j++], params[j++]);
                    break;
                case Command.Line:
                    ctx.lineTo(params[j++], params[j++]);
                    break;
                case Command.Curve:
                    ctx.bezierCurveTo(params[j++], params[j++], params[j++], params[j++], params[j++], params[j++]);
                    break;
                case Command.Arc:
                    ctx.arc(params[j++], params[j++], params[j++], params[j++], params[j++], params[j++] === 1);
                    break;
                case Command.ClosePath:
                    ctx.closePath();
                    break;
            }
        }

        if (commands.length === 0) {
            ctx.closePath();
        }
    }

    moveTo(x: number, y: number) {
        if (this.xy) {
            this.xy[0] = x;
            this.xy[1] = y;
        } else {
            this.xy = [x, y];
        }

        this.commands.push(Command.Move);
        this.params.push(x, y);
    }

    lineTo(x: number, y: number) {
        if (this.xy) {
            this.commands.push(Command.Line);
            this.params.push(x, y);
            this.xy[0] = x;
            this.xy[1] = y;
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
        this.arc(x + radii, y + radii, radii, Math.PI, (3 * Math.PI) / 2);
        this.lineTo(x + radii, y);
        this.lineTo(x + width - radii, y);
        this.arc(x + width - radii, y + radii, radii, (3 * Math.PI) / 2, 2 * Math.PI);
        this.lineTo(x + width, y + radii);
        this.lineTo(x + width, y + height - radii);
        this.arc(x + width - radii, y + height - radii, radii, 0, Math.PI / 2);
        this.lineTo(x + width - radii, y + height);
        this.lineTo(x + radii, y + height);
        this.arc(x + +radii, y + height - radii, radii, Math.PI / 2, Math.PI);
        this.lineTo(x, y + height - radii);
        this.closePath();
    }

    arc(x: number, y: number, r: number, sAngle: number, eAngle: number, antiClockwise = false) {
        const endX = x + r * Math.cos(eAngle);
        const endY = y + r * Math.sin(eAngle);

        if (this.xy) {
            this.xy[0] = endX;
            this.xy[1] = endY;
        } else {
            this.xy = [endX, endY];
        }

        this.commands.push(Command.Arc);
        this.params.push(x, y, r, sAngle, eAngle, antiClockwise ? 1 : 0);
    }

    cubicCurveTo(cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number) {
        if (!this.xy) {
            this.moveTo(cx1, cy1);
        }
        this.commands.push(Command.Curve);
        this.params.push(cx1, cy1, cx2, cy2, x, y);
        if (this.xy) {
            this.xy[0] = x;
            this.xy[1] = y;
        }
    }

    private _closedPath: boolean = false;
    get closedPath(): boolean {
        return this._closedPath;
    }

    closePath() {
        if (this.xy) {
            this.xy = undefined;
            this.commands.push(Command.ClosePath);
            this._closedPath = true;
        }
    }

    clear(trackChanges?: boolean) {
        if (trackChanges) {
            this.previousCommands = this.commands;
            this.previousParams = this.params;
            this.previousClosedPath = this._closedPath;
            this.commands = [];
            this.params = [];
        } else {
            this.commands.length = 0;
            this.params.length = 0;
        }
        this.xy = undefined;
        this._closedPath = false;
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
}
