import { _ModuleSupport, _Widget } from 'ag-charts-community';

// clientXY  (unit: px)          :  Touch screen points.
// normalXY  (unit: N/A - ratio) :  Touch normalised points in [0, N] range.
type Origin = { identifier: number; normalX: number; normalY: number };
type ZoomState = _ModuleSupport.ZoomState;
type AxisZoomState = _ModuleSupport.AxisZoomState;
type DefinedZoomState = _ModuleSupport.DefinedZoomState;
type ZoomTwoFingersTouchStart =
    | { type: 'zoompan'; readonly origins: [Origin, Origin] }
    | { type: 'pan'; readonly origins: [Origin & { readonly identifier: 0 }] };

const N = 1_000_000;

function centerOf(touchA: Touch, touchB: Touch) {
    return { centerX: (touchA.clientX + touchB.clientX) / 2, centerY: touchA.clientY + touchB.clientY / 2 };
}

// Interpolate `a` from [Rx, Rw] to [min, max]
function clientToNormal({ min, max }: ZoomState, a: number, Rx: number, Rw: number): number {
    if (Rw === 0) return 0; // don't divide by 0.
    return N * (((a - Rx) / Rw) * (max - min) + min);
}

// See AG-13737 for explanation.
function solveTwoUnknowns(x1: number, x2: number, a1: number, a2: number, Rx: number, Rw: number): ZoomState {
    // The math expects x1 <= x2 (and a1 <= a2).
    // If x1 > x2, then the gesture will be reversed (i.e. fingers moving closer would zoom in).
    [x1, x2] = [Math.min(x1, x2), Math.max(x1, x2)];
    [a1, a2] = [Math.min(a1, a2), Math.max(a1, a2)];

    const t1 = (N * (a1 - Rx)) / Rw;
    const t2 = (N * (a2 - Rx)) / Rw;
    const c = (a1 - Rx) / (a2 - Rx); // === (t1 / t2);

    const min = (x1 - c * x2) / (N - t1 + c * (t2 - N));
    const max = (x2 + (t2 - N) * min) / t2;
    return { min, max };
}

let last = {
    xMin: -Infinity,
    xMax: -Infinity,
    yMin: -Infinity,
    yMax: -Infinity,
    a1: -Infinity,
    a2: -Infinity,
    b1: -Infinity,
    b2: -Infinity,
};

export class ZoomTwoFingers {
    private readonly touchStart: ZoomTwoFingersTouchStart = {
        type: 'zoompan',
        origins: [
            { identifier: 0, normalX: NaN, normalY: NaN },
            { identifier: 0, normalX: NaN, normalY: NaN },
        ],
    };
    private readonly initialZoom: DefinedZoomState = { x: { min: 0, max: 1 }, y: { min: 0, max: 1 } };
    private previous = { a1: NaN, a2: NaN, b1: NaN, b2: NaN };
    private zoomingX: boolean = false;
    private zoomingY: boolean = false;

    // Check if X-axis or Y-axis overlap. zoompan will be sensitive if the fingers are close to one another on an axis.
    private checkTouchOverlaps(touchA: Touch, touchB: Touch) {
        const isRangeOverlapping = (centerA: number, radiusA: number, centerB: number, radiusB: number): boolean => {
            const minA = centerA - radiusA;
            const maxA = centerA + radiusA;
            const minB = centerB - radiusB;
            const maxB = centerB + radiusB;
            return !(maxA < minB || maxB < minA);
        };

        this.zoomingX = !isRangeOverlapping(touchA.clientX, touchA.radiusX, touchB.clientX, touchB.radiusX);
        this.zoomingY = !isRangeOverlapping(touchA.clientY, touchA.radiusY, touchB.clientY, touchB.radiusY);
    }

    start(event: _Widget.TouchWidgetEvent<'touchstart'>, target: _Widget.Widget, zoom: AxisZoomState): boolean {
        if (event.sourceEvent.targetTouches.length !== 2) return false;
        event.sourceEvent.preventDefault();

        const targetTouches = Array.from(event.sourceEvent.targetTouches);
        const { x: Rx, y: Ry, width: Rw, height: Rh } = target.getBoundingClientRect();

        this.checkTouchOverlaps(targetTouches[0], targetTouches[1]);
        this.initialZoom.x.min = zoom.x?.min ?? 0;
        this.initialZoom.x.max = zoom.x?.max ?? 1;
        this.initialZoom.y.min = zoom.y?.min ?? 0;
        this.initialZoom.y.max = zoom.y?.max ?? 1;

        this.touchStart.origins.forEach((t) => (t.identifier = 0));
        this.touchStart.type = this.zoomingX || this.zoomingY ? 'zoompan' : 'pan';

        if (this.touchStart.type === 'zoompan') {
            for (const i of [0, 1]) {
                const a = targetTouches[i].clientX;
                const b = Ry + Rh - targetTouches[i].clientY;
                this.touchStart.origins[i].identifier = targetTouches[i].identifier;
                this.touchStart.origins[i].normalX = clientToNormal(this.initialZoom.x, a, Rx, Rw);
                this.touchStart.origins[i].normalY = clientToNormal(this.initialZoom.y, b, Ry, Rh);
            }
        } else {
            const { centerX, centerY } = centerOf(targetTouches[0], targetTouches[1]);
            this.touchStart.origins[0].normalX = clientToNormal(this.initialZoom.x, centerX, Rx, Rw);
            this.touchStart.origins[0].normalY = clientToNormal(this.initialZoom.y, Ry + Rh - centerY, Ry, Rh);
        }

        return true;
    }

    update(event: _Widget.TouchWidgetEvent<'touchmove'>, target: _Widget.Widget): DefinedZoomState {
        event.sourceEvent.preventDefault();

        const targetTouches = Array.from(event.sourceEvent.targetTouches);
        const { x: Rx, y: Ry, width: Rw, height: Rh } = target.getBoundingClientRect();

        if (this.touchStart.type === 'zoompan') {
            const { origins } = this.touchStart;
            const touches = [0, 1].map((i) => targetTouches.find((t) => t.identifier === origins[i].identifier)!);
            const x1 = origins[0].normalX;
            const x2 = origins[1].normalX;
            const a1 = touches[0].clientX;
            const a2 = touches[1].clientX;
            const y1 = origins[0].normalY;
            const y2 = origins[1].normalY;
            const b1 = Ry + Rh - touches[0].clientY;
            const b2 = Ry + Rh - touches[1].clientY;
            return this.twitchTolerantZoomPan(x1, x2, a1, a2, y1, y2, b1, b2, Rx, Ry, Rw, Rh);
        } /* type === 'pan' */ else {
            const touch = centerOf(targetTouches[0], targetTouches[1]);
            const x1 = this.touchStart.origins[0].normalX;
            const y1 = this.touchStart.origins[0].normalY;
            const x2 = clientToNormal(this.initialZoom.x, touch.centerX, Rx, Rw);
            const y2 = clientToNormal(this.initialZoom.y, Ry + Rh - touch.centerY, Ry, Rh);
            const deltaX = (x1 - x2) / N;
            const deltaY = (y1 - y2) / N;
            return {
                x: { min: this.initialZoom.x.min + deltaX, max: this.initialZoom.x.max + deltaX },
                y: { min: this.initialZoom.y.min + deltaY, max: this.initialZoom.y.max + deltaY },
            };
        }
    }

    end(event: _Widget.TouchWidgetEvent<'touchend' | 'touchcancel'>): boolean {
        const identifiers = Array.from(event.sourceEvent.targetTouches).map((t) => t.identifier);
        if (this.touchStart.type === 'zoompan') {
            const { origins } = this.touchStart;
            return !identifiers.includes(origins[0].identifier) || !identifiers.includes(origins[1].identifier);
        }
        return true;
    }

    private twitchTolerantZoomPan(
        x1: number,
        x2: number,
        a1: number,
        a2: number,
        y1: number,
        y2: number,
        b1: number,
        b2: number,
        Rx: number,
        Ry: number,
        Rw: number,
        Rh: number
    ) {
        const { zoomingX, zoomingY, initialZoom, previous } = this;
        let x: ZoomState = initialZoom.x;
        let y: ZoomState = initialZoom.y;

        if (zoomingX) {
            const dx = Math.abs(a1 - previous.a1) + Math.abs(a2 - previous.a1);
            if (dx <= 1) {
                a1 = previous.a1;
                a2 = previous.a2;
            } else {
                previous.a1 = a1;
                previous.a2 = a2;
            }
            x = solveTwoUnknowns(x1, x2, a1, a2, Rx, Rw);
        }

        if (zoomingY) {
            const dy = Math.abs(b1 - previous.b1) + Math.abs(b2 - previous.b1);
            if (dy <= 1) {
                b1 = previous.b1;
                b2 = previous.b2;
            } else {
                previous.b1 = b1;
                previous.b2 = b2;
            }
            y = solveTwoUnknowns(y1, y2, b1, b2, Ry, Rh);
        }

        const r = { x, y };
        const current = {
            xMin: r.x.min,
            xMax: r.x.max,
            yMin: r.y.min,
            yMax: r.y.max,
            a1,
            a2,
            b1,
            b2,
        };
        const dir = (key: keyof (typeof last & typeof current)): string => {
            if (current[key] > last[key]) {
                return '🟢⬆️';
            }
            if (current[key] < last[key]) {
                return '🔴⬇️';
            }
            return '🔵➡️';
        };
        console.table([
            {
                xMin: `${dir('xMin')} ${r.x.min}`,
                xMax: `${dir('xMax')} ${r.x.max}`,
                yMin: `${dir('yMin')} ${r.y.min}`,
                yMax: `${dir('yMax')} ${r.y.max}`,
                a1: `${dir('a1')} ${a1}`,
                a2: `${dir('a2')} ${a2}`,
                b1: `${dir('b1')} ${b1}`,
                b2: `${dir('b2')} ${b2}`,
            },
        ]);
        last = current;
        return r;
        // return { x, y };
    }
}
