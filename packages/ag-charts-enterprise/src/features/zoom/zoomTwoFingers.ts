import { _ModuleSupport, _Widget } from 'ag-charts-community';

type Origin = { identifier: number; normalX: number; normalY: number };

// Interpolate `a` from [Rx, Rw] to [min, max]
function clientToNormal({ min, max }: _ModuleSupport.ZoomState, a: number, Rx: number, Rw: number): number {
    if (Rw === 0) return 0; // don't divide by 0.
    return ((a - Rx) / Rw) * (max - min) + min;
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

    const f1 = (a1 - Rx) / Rw;
    const f2 = (a2 - Rx) / Rw;
    const g = (a1 - Rx) / (a2 - Rx); // === f1 / f2;

    const min = (x1 - g * x2) / (1 - f1 + g * (f2 - 1));
    const max = (x2 + (f2 - 1) * min) / f2;

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
        const rect = target.getBoundingClientRect();

        for (const i of [0, 1]) {
            const origin = this.origins[i];
            const touch = targetTouches[i];
            origin.identifier = touch.identifier;
            origin.normalX = clientToNormal(zoom.x ?? { min: 0, max: 1 }, touch.clientX, rect.x, rect.width);
            origin.normalY = clientToNormal(zoom.y ?? { min: 0, max: 1 }, touch.clientY, rect.y, rect.height);
        }
        return true;
    }

    update(event: _Widget.TouchWidgetEvent<'touchmove'>, target: _Widget.Widget): _ModuleSupport.DefinedZoomState {
        event.sourceEvent.preventDefault();
        const targetTouches = Array.from(event.sourceEvent.targetTouches);

        const { origins } = this;
        const rect = target.getBoundingClientRect();
        const touches = [0, 1].map((i) => targetTouches.find((t) => t.identifier === origins[i].identifier)!);
        return {
            x: solveTwoUnknowns(
                origins[0].normalX,
                origins[1].normalX,
                touches[0].clientX,
                touches[1].clientX,
                rect.x,
                rect.width
            ),
            // Note: For the Y axis, normalised 0 is the bottom, but screen 0 is the top. Hence (MaxY - y) computation.
            y: solveTwoUnknowns(
                1 - origins[0].normalY,
                1 - origins[1].normalY,
                rect.height + rect.y - touches[0].clientY,
                rect.height + rect.y - touches[1].clientY,
                rect.y,
                rect.height
            ),
        };
    }

    end(event: _Widget.TouchWidgetEvent<'touchend' | 'touchcancel'>): boolean {
        const identifiers = Array.from(event.sourceEvent.targetTouches).map((t) => t.identifier);
        return !identifiers.includes(this.origins[0].identifier) || !identifiers.includes(this.origins[1].identifier);
    }
}
