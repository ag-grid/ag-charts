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
    return undefined;
}
