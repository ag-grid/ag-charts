import { normalizeAngle360 } from 'ag-charts-core';

import { lineDistanceSquared } from '../util/distance';
import { parseSvg } from '../util/svg';
import { BBox } from './bbox';
import { cubicSegmentIntersections, segmentIntersection } from './intersection';
import { bezier2DDistance, bezier2DExtrema, evaluateBezier } from './util/bezier';

enum Command {
    Move,
    Line,
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

    cx = Number.NaN;
    cy = Number.NaN;
    sx = Number.NaN;
    sy = Number.NaN;
    openedPath: boolean = false;
    closedPath: boolean = false;

    isEmpty() {
        return this.commands.length === 0;
    }

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
        this.sx = x;
        this.sy = y;
        this.cx = x;
        this.cy = y;
        this.path2d.moveTo(x, y);
        this.commands.push(Command.Move);
        this.params.push(x, y);
    }

    lineTo(x: number, y: number) {
        if (this.openedPath) {
            this.cx = x;
            this.cy = y;
            this.path2d.lineTo(x, y);
            this.commands.push(Command.Line);
            this.params.push(x, y);
        } else {
            this.moveTo(x, y);
        }
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
            this.cx = this.sx;
            this.cy = this.sy;
            this.sx = Number.NaN;
            this.sy = Number.NaN;
            this.path2d.closePath();
            this.commands.push(Command.ClosePath);
            this.openedPath = false;
            this.closedPath = true;
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

    ellipse(
        cx: number,
        cy: number,
        rx: number,
        ry: number,
        rotation: number,
        sAngle: number,
        eAngle: number,
        counterClockwise: boolean = false
    ) {
        const r = rx;
        const scaleY = ry / rx;
        const mxx = Math.cos(rotation);
        const myx = Math.sin(rotation);
        const mxy = -scaleY * myx;
        const myy = scaleY * mxx;

        const x0 = r * Math.cos(sAngle);
        const y0 = r * Math.sin(sAngle);
        const sx = cx + mxx * x0 + mxy * y0;
        const sy = cy + myx * x0 + myy * y0;
        const distanceSquared = (sx - this.cx) ** 2 + (sy - this.cy) ** 2;
        if (!this.openedPath) {
            this.moveTo(sx, sy);
        } else if (distanceSquared > 1e-6) {
            this.lineTo(sx, sy);
        }

        let sweep = counterClockwise ? -normalizeAngle360(sAngle - eAngle) : normalizeAngle360(eAngle - sAngle);
        if (Math.abs(Math.abs(eAngle - sAngle) - 2 * Math.PI) < 1e-6 && sweep < 2 * Math.PI) {
            sweep += 2 * Math.PI * (counterClockwise ? -1 : 1);
        }

        const arcSections = Math.max(Math.ceil(Math.abs(sweep) / (Math.PI / 2)), 1);

        const step = sweep / arcSections;
        const h = (4 / 3) * Math.tan(step / 4);

        for (let i = 0; i < arcSections; i += 1) {
            const a0 = sAngle + step * (i + 0);
            const a1 = sAngle + step * (i + 1);

            // "Approximation of circular arcs by cubic polynomials",
            // Michael Goldapp, Computer Aided Geometric Design 8 (1991) 227-238
            const rSinStart = r * Math.sin(a0);
            const rCosStart = r * Math.cos(a0);
            const rSinEnd = r * Math.sin(a1);
            const rCosEnd = r * Math.cos(a1);

            const cp1x = rCosStart - h * rSinStart;
            const cp1y = rSinStart + h * rCosStart;
            const cp2x = rCosEnd + h * rSinEnd;
            const cp2y = rSinEnd - h * rCosEnd;
            const cp3x = rCosEnd;
            const cp3y = rSinEnd;

            this.cubicCurveTo(
                cx + mxx * cp1x + mxy * cp1y,
                cy + myx * cp1x + myy * cp1y,
                cx + mxx * cp2x + mxy * cp2y,
                cy + myx * cp2x + myy * cp2y,
                cx + mxx * cp3x + mxy * cp3y,
                cy + myx * cp3x + myy * cp3y
            );
        }
    }

    arc(x: number, y: number, r: number, sAngle: number, eAngle: number, counterClockwise?: boolean) {
        this.ellipse(x, y, r, r, 0, sAngle, eAngle, counterClockwise);
    }

    appendSvg(svg: string) {
        const parts = parseSvg(svg);
        if (parts == null) return false;

        let sx = 0; // start of path x
        let sy = 0; // start of path y

        let cx: number; // current point x
        let cy: number; // current point y

        let cpx: number = 0;
        let cpy: number = 0;

        for (const { command, params } of parts) {
            cx ??= params[0];
            cy ??= params[1];

            const relative = command === command.toLowerCase();
            const dx = relative ? cx : 0;
            const dy = relative ? cy : 0;

            // straight lines - L, l, H, h, V and v
            // cubic curves - C, c, S and s
            // quadratic curves - Q, q, T and t
            // elliptical arc - A and a

            switch (command.toLowerCase()) {
                case 'm':
                    this.moveTo(dx + params[0], dy + params[1]);
                    cx = dx + params[0];
                    cy = dy + params[1];

                    sx = cx;
                    sy = cy;
                    break;

                case 'c':
                    this.cubicCurveTo(
                        dx + params[0],
                        dy + params[1],
                        dx + params[2],
                        dy + params[3],
                        dx + params[4],
                        dy + params[5]
                    );
                    cpx = dx + params[2];
                    cpy = dy + params[3];

                    cx = dx + params[4];
                    cy = dy + params[5];

                    break;

                case 's':
                    this.cubicCurveTo(
                        cx + cx - cpx,
                        cy + cy - cpy,
                        dx + params[0],
                        dy + params[1],
                        dx + params[2],
                        dy + params[3]
                    );

                    cpx = dx + params[0];
                    cpy = dy + params[1];

                    cx = dx + params[2];
                    cy = dy + params[3];

                    break;

                case 'q':
                    this.cubicCurveTo(
                        (dx + 2 * params[0]) / 3,
                        (dy + 2 * params[1]) / 3,
                        (2 * params[0] + params[2]) / 3,
                        (2 * params[1] + params[3]) / 3,
                        params[2],
                        params[3]
                    );

                    cpx = params[0];
                    cpy = params[1];

                    cx = params[2];
                    cy = params[3];

                    break;

                case 't':
                    this.cubicCurveTo(
                        (cx + 2 * (cx + cx - cpx)) / 3,
                        (cy + 2 * (cy + cy - cpy)) / 3,
                        (2 * (cx + cx - cpx) + params[0]) / 3,
                        (2 * (cy + cy - cpy) + params[1]) / 3,
                        params[0],
                        params[1]
                    );

                    cpx = cx + cx - cpx;
                    cpy = cy + cy - cpy;

                    cx = params[0];
                    cy = params[1];

                    break;

                case 'a':
                    this.svgEllipse(
                        cx,
                        cy,
                        params[0],
                        params[1],
                        (params[2] * Math.PI) / 180,
                        params[3],
                        params[4],
                        dx + params[5],
                        dy + params[6]
                    );

                    cx = dx + params[5];
                    cy = dy + params[6];

                    break;

                case 'h':
                    this.lineTo(dx + params[0], cy);
                    cx = dx + params[0];

                    break;

                case 'l':
                    this.lineTo(dx + params[0], dy + params[1]);
                    cx = dx + params[0];
                    cy = dy + params[1];

                    break;

                case 'v':
                    this.lineTo(cx, dy + params[0]);
                    cy = dy + params[0];

                    break;

                case 'z':
                    this.closePath();
                    cx = sx;
                    cy = sy;

                    break;

                default:
                    throw new Error(`Could not translate command '${command}' with '${params.join(' ')}'`);
            }
        }

        return true;
    }

    private svgEllipse(
        x1: number,
        y1: number,
        rx: number,
        ry: number,
        rotation: number,
        fA: number,
        fS: number,
        x2: number,
        y2: number
    ) {
        // https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
        // https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
        // https://www.w3.org/TR/SVG11/paths.html#PathDataEllipticalArcCommands
        rx = Math.abs(rx);
        ry = Math.abs(ry);

        // half differences
        const dx = (x1 - x2) / 2;
        const dy = (y1 - y2) / 2;

        const sin = Math.sin(rotation);
        const cos = Math.cos(rotation);

        // rotate the coordinate differences
        const rotX = cos * dx + sin * dy;
        const rotY = -sin * dx + cos * dy;

        // normalise by radii
        const normX = rotX / rx;
        const normY = rotY / ry;
        let scale = normX * normX + normY * normY;
        let cx = (x1 + x2) / 2;
        let cy = (y1 + y2) / 2;

        // control points
        let cpx = 0;
        let cpy = 0;

        if (scale >= 1) {
            // scale radii if necessary
            scale = Math.sqrt(scale);
            rx *= scale;
            ry *= scale;
        } else {
            // correct centre using the flag values
            scale = Math.sqrt(1 / scale - 1);
            if (fA === fS) scale = -scale;

            cpx = scale * rx * normY;
            cpy = -scale * ry * normX;

            cx += cos * cpx - sin * cpy;
            cy += sin * cpx + cos * cpy;
        }

        const sAngle = Math.atan2((rotY - cpy) / ry, (rotX - cpx) / rx);
        const deltaTheta = Math.atan2((-rotY - cpy) / ry, (-rotX - cpx) / rx) - sAngle;
        const eAngle = sAngle + deltaTheta;
        const counterClockwise = !!(1 - fS);

        this.ellipse(cx, cy, rx, ry, rotation, sAngle, eAngle, counterClockwise);
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
        let sx: number = Number.NaN;
        let sy: number = Number.NaN;
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
        let sx: number = Number.NaN;
        let sy: number = Number.NaN;
        // the previous point of the current path
        let cx = 0;
        let cy = 0;

        for (let ci = 0, pi = 0; ci < cn; ci++) {
            switch (commands[ci]) {
                case Command.Move:
                    cx = sx = params[pi++];
                    cy = sy = params[pi++];
                    break;
                case Command.Line: {
                    const x0 = cx;
                    const y0 = cy;
                    cx = params[pi++];
                    cy = params[pi++];
                    best = lineDistanceSquared(x, y, x0, y0, cx, cy, best);
                    break;
                }
                case Command.Curve: {
                    const cp0x = cx;
                    const cp0y = cy;
                    const cp1x = params[pi++];
                    const cp1y = params[pi++];
                    const cp2x = params[pi++];
                    const cp2y = params[pi++];
                    cx = params[pi++];
                    cy = params[pi++];
                    best = bezier2DDistance(cp0x, cp0y, cp1x, cp1y, cp2x, cp2y, cx, cy, x, y) ** 2;
                    break;
                }
                case Command.ClosePath:
                    best = lineDistanceSquared(x, y, cx, cy, sx, sy, best);
                    break;
            }
        }

        return best;
    }

    // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
    toSVG(transform: (x: number, y: number) => { x: number; y: number } = (x, y) => ({ x, y })): string {
        const buffer: (string | number)[] = [];
        const { commands, params } = this;

        const addCommand = (command: string, count: number) => {
            buffer.push(command);
            for (let i = 0; i < count; i += 2) {
                const { x, y } = transform(params[pi++], params[pi++]);
                buffer.push(x, y);
            }
        };

        let pi = 0;
        for (const command of commands) {
            switch (command) {
                case Command.Move:
                    addCommand('M', 2);
                    break;
                case Command.Line:
                    addCommand('L', 2);
                    break;
                case Command.Curve:
                    addCommand('C', 6);
                    break;
                case Command.ClosePath:
                    addCommand('Z', 0);
                    break;
            }
        }

        return buffer.join(' ');
    }

    computeBBox(): BBox {
        const { commands, params } = this;
        let [top, left, right, bot] = [Infinity, Infinity, -Infinity, -Infinity];
        let [cx, cy] = [Number.NaN, Number.NaN]; // the starting point of the current path
        let [sx, sy] = [Number.NaN, Number.NaN]; // the end point for a ClosePath command.

        const joinPoint = (x: number, y: number) => {
            top = Math.min(y, top);
            left = Math.min(x, left);
            right = Math.max(x, right);
            bot = Math.max(y, bot);

            cx = x;
            cy = y;
        };

        let pi = 0;
        for (const command of commands) {
            switch (command) {
                case Command.Move:
                    joinPoint(params[pi++], params[pi++]);
                    sx = cx;
                    sy = cy;
                    break;
                case Command.Line:
                    joinPoint(params[pi++], params[pi++]);
                    break;
                case Command.Curve: {
                    const cp0x = cx;
                    const cp0y = cy;
                    const cp1x = params[pi++];
                    const cp1y = params[pi++];
                    const cp2x = params[pi++];
                    const cp2y = params[pi++];
                    const cp3x = params[pi++];
                    const cp3y = params[pi++];

                    const ts = bezier2DExtrema(cp0x, cp0y, cp1x, cp1y, cp2x, cp2y, cp3x, cp3y);

                    // Check points where the derivative is zero
                    for (const t of ts) {
                        const px = evaluateBezier(cp0x, cp1x, cp2x, cp3x, t);
                        const py = evaluateBezier(cp0y, cp1y, cp2y, cp3y, t);
                        joinPoint(px, py);
                    }

                    joinPoint(cp3x, cp3y);
                    break;
                }
                case Command.ClosePath:
                    joinPoint(sx, sy);
                    sx = Number.NaN;
                    sy = Number.NaN;
                    break;
            }
        }

        return new BBox(left, top, right - left, bot - top);
    }
}
