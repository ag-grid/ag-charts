export interface ZoomMinMax {
    min: number;
    max: number;
}

export interface ZoomMinMaxDirection extends ZoomMinMax {
    direction: 'x' | 'y';
}

export interface DefinedZoomState {
    x: ZoomMinMax;
    y: ZoomMinMax;
}

export interface ZoomState {
    x?: ZoomMinMax;
    y?: ZoomMinMax;
    autoScaleYAxis?: boolean;
}

export const UNIT_MIN = 0;
export const UNIT_MAX = 1;

export function definedZoomState(zoom?: ZoomState): DefinedZoomState {
    return {
        x: { min: zoom?.x?.min ?? UNIT_MIN, max: zoom?.x?.max ?? UNIT_MAX },
        y: { min: zoom?.y?.min ?? UNIT_MIN, max: zoom?.y?.max ?? UNIT_MAX },
    };
}

/**
 * Pick the zoom entry for a given direction. Returns `undefined` for angle / radius directions
 * where per-direction cartesian zoom does not apply.
 */
export function pickDirectionZoom(zoom: ZoomState | undefined, direction: string): ZoomMinMax | undefined {
    if (direction === 'x') return zoom?.x;
    if (direction === 'y') return zoom?.y;
}

type CoreZoomLike = Readonly<Record<string, Readonly<ZoomMinMaxDirection> | undefined>>;

/**
 * Projects a per-axis zoom map onto the `{ x?, y? }` shape used by the public zoom API. Takes the
 * primary (first) entry in each direction. Used at the boundary between the internal per-axis
 * representation (still present in ZoomManager as a transient compatibility layer) and the public
 * per-direction state in ChartState.
 */
export function toZoomState(coreZoom: CoreZoomLike): ZoomState | undefined {
    let x: ZoomMinMax | undefined;
    let y: ZoomMinMax | undefined;

    for (const id of Object.keys(coreZoom)) {
        const entry = coreZoom[id];
        if (!entry) continue;
        if (entry.direction === 'x') {
            x ??= { min: entry.min, max: entry.max };
        } else if (entry.direction === 'y') {
            y ??= { min: entry.min, max: entry.max };
        }
    }

    if (x || y) {
        return { x, y };
    }
}
