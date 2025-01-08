import { _ModuleSupport, _Widget } from 'ag-charts-community';

type Origin = { identifier: number; normalX: number; normalY: number };

// Interpolate `a` from [Rx, Rw] to [min, max]
function clientToNormal({ min, max }: _ModuleSupport.ZoomState, a: number, Rx: number, Rw: number): number {
    if (Rw === 0) return 0; // don't divide by 0.
    return ((a - Rx) / Rw) * (max - min) + min;
}

function solveTwoUnknowns(
    x0: number,
    x1: number,
    a0: number,
    a1: number,
    Rx: number,
    Rw: number
): _ModuleSupport.ZoomState {
    // The math expects x0 <= x1 (and a0 <= a1).
    // If x0 > x1, then the gesture will be reversed (i.e. fingers moving closer would zoom in).
    [x0, x1] = [Math.min(x0, x1), Math.max(x0, x1)];
    [a0, a1] = [Math.min(a0, a1), Math.max(a0, a1)];

    const k0 = (a0 - Rx) / Rw;
    const k1 = (a1 - Rx) / Rw;
    const g = (a0 - Rx) / (a1 - Rx); // === k0 / k1;

    const min = (x0 - g * x1) / (1 - k0 - g * (k1 - 1));
    const max = (x1 + (k1 - 1) * min) / k1;

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
                (rect.height + rect.y) - touches[0].clientY,
                (rect.height + rect.y) - touches[1].clientY,
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
