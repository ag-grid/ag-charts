import { _ModuleSupport, _Widget } from 'ag-charts-community';

type Origin = { identifier: number; normalX: number; normalY: number };

const N = 1_000_000;

// Interpolate `a` from [Rx, Rw] to [min, max]
function clientToNormal({ min, max }: _ModuleSupport.ZoomState, a: number, Rx: number, Rw: number): number {
    if (Rw === 0) return 0; // don't divide by 0.
    return N * (((a - Rx) / Rw) * (max - min) + min);
}

function solveTwoUnknowns(
    x1: number,
    x2: number,
    a1: number,
    a2: number,
    Rx: number,
    Rw: number
): _ModuleSupport.ZoomState {
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

export class ZoomTwoFingers {
    private readonly origins: [Origin, Origin] = [
        { identifier: 0, normalX: NaN, normalY: NaN },
        { identifier: 0, normalX: NaN, normalY: NaN },
    ];
    start(
        event: _Widget.TouchWidgetEvent<'touchstart'>,
        target: _Widget.Widget,
        zoom: _ModuleSupport.AxisZoomState
    ): boolean {
        if (event.sourceEvent.targetTouches.length !== 2) return false;
        event.sourceEvent.preventDefault();
        const targetTouches = Array.from(event.sourceEvent.targetTouches);
        const { x: Rx, y: Ry, width: Rw, height: Rh } = target.getBoundingClientRect();

        for (const i of [0, 1]) {
            const a = targetTouches[i].clientX;
            const b = Ry + Rh - targetTouches[i].clientY;
            this.origins[i].identifier = targetTouches[i].identifier;
            this.origins[i].normalX = clientToNormal(zoom.x ?? { min: 0, max: 1 }, a, Rx, Rw);
            this.origins[i].normalY = clientToNormal(zoom.y ?? { min: 0, max: 1 }, b, Ry, Rh);
        }

        return true;
    }

    update(event: _Widget.TouchWidgetEvent<'touchmove'>, target: _Widget.Widget): _ModuleSupport.DefinedZoomState {
        event.sourceEvent.preventDefault();
        const targetTouches = Array.from(event.sourceEvent.targetTouches);

        const { origins } = this;
        const { x: Rx, y: Ry, width: Rw, height: Rh } = target.getBoundingClientRect();

        const touches = [0, 1].map((i) => targetTouches.find((t) => t.identifier === origins[i].identifier)!);
        const x1 = origins[0].normalX;
        const x2 = origins[1].normalX;
        const a1 = touches[0].clientX;
        const a2 = touches[1].clientX;
        const y1 = origins[0].normalY;
        const y2 = origins[1].normalY;
        const b1 = Ry + Rh - touches[0].clientY;
        const b2 = Ry + Rh - touches[1].clientY;
        return {
            x: solveTwoUnknowns(x1, x2, a1, a2, Rx, Rw),
            y: solveTwoUnknowns(y1, y2, b1, b2, Ry, Rh),
        };
    }

    end(event: _Widget.TouchWidgetEvent<'touchend' | 'touchcancel'>): boolean {
        const identifiers = Array.from(event.sourceEvent.targetTouches).map((t) => t.identifier);
        return !identifiers.includes(this.origins[0].identifier) || !identifiers.includes(this.origins[1].identifier);
    }
}
