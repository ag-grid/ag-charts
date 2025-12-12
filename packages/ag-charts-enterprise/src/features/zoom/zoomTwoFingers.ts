import type { _Widget } from 'ag-charts-community';
import type { AxisZoomState, DefinedZoomState, ZoomMinMax } from 'ag-charts-core';

// clientXY  (unit: px)          :  Touch screen points.
// normalXY  (unit: N/A - ratio) :  Touch normalised points in [0, N] range.
type Origin = { identifier: number; normalX: number; normalY: number };
type ZoomTwoFingersTouchStart = { readonly origins: [Origin, Origin] };

const N = 1_000_000;

// Interpolate `a` from [Rx, Rw] to [min, max]
function clientToNormal({ min, max }: ZoomMinMax, a: number, Rx: number, Rw: number): number {
    if (Rw === 0) return 0; // don't divide by 0.
    return N * (((a - Rx) / Rw) * (max - min) + min);
}

// See AG-13737 for explanation.
function solveTwoUnknowns(x1: number, x2: number, a1: number, a2: number, Rx: number, Rw: number): ZoomMinMax {
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

function isRangeOverlapping(centerA: number, radiusA: number, centerB: number, radiusB: number): boolean {
    // On some platforms (e.g. Android) the radii are always 0.
    if (radiusA === 0) radiusA = 30;
    if (radiusB === 0) radiusB = 30;
    const minA = centerA - radiusA;
    const maxA = centerA + radiusA;
    const minB = centerB - radiusB;
    const maxB = centerB + radiusB;
    return !(maxA < minB || maxB < minA);
}

export class ZoomTwoFingers {
    private readonly touchStart: ZoomTwoFingersTouchStart = {
        origins: [
            { identifier: 0, normalX: Number.NaN, normalY: Number.NaN },
            { identifier: 0, normalX: Number.NaN, normalY: Number.NaN },
        ],
    };
    private readonly initialZoom: DefinedZoomState = { x: { min: 0, max: 1 }, y: { min: 0, max: 1 } };
    private readonly previous = { a1: Number.NaN, a2: Number.NaN, b1: Number.NaN, b2: Number.NaN };

    start(event: _Widget.TouchWidgetEvent<'touchstart'>, target: _Widget.Widget, zoom: AxisZoomState): boolean {
        if (event.sourceEvent.targetTouches.length !== 2) return false;
        event.sourceEvent.preventDefault();

        const targetTouches = Array.from(event.sourceEvent.targetTouches);
        const { x: Rx, y: Ry, width: Rw, height: Rh } = target.getBoundingClientRect();

        this.initialZoom.x.min = zoom.x?.min ?? 0;
        this.initialZoom.x.max = zoom.x?.max ?? 1;
        this.initialZoom.y.min = zoom.y?.min ?? 0;
        this.initialZoom.y.max = zoom.y?.max ?? 1;
        for (const t of this.touchStart.origins) {
            t.identifier = 0;
        }

        this.previous.a1 = Number.NaN;
        this.previous.a2 = Number.NaN;
        this.previous.b1 = Number.NaN;
        this.previous.b2 = Number.NaN;
        for (const i of [0, 1]) {
            const a = targetTouches[i].clientX;
            const b = Ry + Rh - targetTouches[i].clientY;
            this.touchStart.origins[i].identifier = targetTouches[i].identifier;
            this.touchStart.origins[i].normalX = clientToNormal(this.initialZoom.x, a, Rx, Rw);
            this.touchStart.origins[i].normalY = clientToNormal(this.initialZoom.y, b, Ry, Rh);
        }

        // Enable "pan-only" mode on axes if the X or Y values overlap.
        // The "zoom-pan" mode will be sensitive if the are close to one another on an axis.
        const [tA, tB] = targetTouches;
        const [oA, oB] = this.touchStart.origins;
        const xOverlap = isRangeOverlapping(tA.clientX, tA.radiusX, tB.clientX, tB.radiusX);
        const yOverlap = isRangeOverlapping(tA.clientY, tA.radiusY, tB.clientY, tB.radiusY);
        // We deliberately average out the normals instead clientXY values. This is so that we don't need to worry about
        // flipping coords on the Y axis (and not flipping them on the X axis).
        if (yOverlap) oA.normalY = oB.normalY = (oA.normalY + oB.normalY) / 2;
        if (xOverlap) oA.normalX = oB.normalX = (oA.normalX + oB.normalX) / 2;
        return true;
    }

    update(event: _Widget.TouchWidgetEvent<'touchmove'>, target: _Widget.Widget): DefinedZoomState {
        event.sourceEvent.preventDefault();

        const targetTouches = Array.from(event.sourceEvent.targetTouches);
        const { x: Rx, y: Ry, width: Rw, height: Rh } = target.getBoundingClientRect();

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
        return this.twitchTolerantZoomPan4(x1, x2, a1, a2, y1, y2, b1, b2, Rx, Ry, Rw, Rh);
    }

    end(event: _Widget.TouchWidgetEvent<'touchend' | 'touchcancel'>): boolean {
        const identifiers = Array.from(event.sourceEvent.targetTouches).map((t) => t.identifier);
        return (
            !identifiers.includes(this.touchStart.origins[0].identifier) ||
            !identifiers.includes(this.touchStart.origins[1].identifier)
        );
    }

    // Small touch deltas on an axis, which can defined as one fingers moving ±1 pixel and the other not moving, can
    // cause the canvas to flicker between two zoompan views.
    //
    // For example, consider two fingers moving upwards slowly on the Y-axis with the following events (Y=0 is the top
    // of the screen):
    //
    //   [0]:  { finger1: { clientY: 101 }, finger2: { clientY: 201 } }
    //   [1]:  { finger1: { clientY: 101 }, finger2: { clientY: 200 } }
    //   [2]:  { finger1: { clientY: 100 }, finger2: { clientY: 200 } }
    //
    // The following transitions cause these changes to the zoompan respectively.
    //
    //   [0] => [1] : yMin decreases, yMax increases
    //   [1] => [2] : yMin increases, yMax decreases
    //
    // At highly-zoomed views, this sudden shift in yMin/yMax in the [1] => [2] transition is very noticeable. When many
    // of these kind of a transitions occur, the chart flickers between pan states instead of smoothly panning. Note
    // however that, if we didn't receive event [1], our transition would like this:
    //
    //   [0] => [2] : yMin increases, yMax increases
    //
    // ... which is a smooth panning transition. Therefore to prevent flickering, we skip event [1].
    private twitchTolerantZoomPan4(
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
        const { initialZoom, previous } = this;
        const x = twitchTolerantZoomPan2(x1, x2, a1, a2, previous, 'a1', 'a2', Rx, Rw, initialZoom.x);
        const y = twitchTolerantZoomPan2(y1, y2, b1, b2, previous, 'b1', 'b2', Ry, Rh, initialZoom.y);
        return { x, y };
    }
}
// The "two-unknowns" variant of twitchTolerantZoomPan4
function twitchTolerantZoomPan2(
    x1: number,
    x2: number,
    a1: number,
    a2: number,
    previous: ZoomTwoFingers['previous'],
    previousKey1: keyof typeof previous,
    previousKey2: keyof typeof previous,
    Rx: number,
    Rw: number,
    initialZoom: ZoomMinMax
): ZoomMinMax {
    if (x1 == x2) {
        // pan-only mode:
        const xn1 = clientToNormal(initialZoom, a1, Rx, Rw);
        const xn2 = clientToNormal(initialZoom, a2, Rx, Rw);
        const xavg = (xn1 + xn2) / 2;
        const dzoom = (x1 - xavg) / N;
        return { min: initialZoom.min + dzoom, max: initialZoom.max + dzoom };
    } else {
        // zoom-pan mode:
        const a1prev = previous[previousKey1];
        const a2prev = previous[previousKey2];
        const dx = Math.abs(a1 - a1prev) + Math.abs(a2 - a2prev);
        if (dx <= 1) {
            a1 = a1prev;
            a2 = a2prev;
        } else {
            previous[previousKey1] = a1;
            previous[previousKey2] = a2;
        }
        return solveTwoUnknowns(x1, x2, a1, a2, Rx, Rw);
    }
}
