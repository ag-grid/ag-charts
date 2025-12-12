export interface ZoomState {
    min: number;
    max: number;
}

export interface ZoomStateDirection extends ZoomState {
    direction: 'x' | 'y';
}

export interface DefinedZoomState {
    x: ZoomState;
    y: ZoomState;
}

export interface AxisZoomState {
    x?: ZoomState;
    y?: ZoomState;
    autoScaleYAxis?: boolean;
}

export const UNIT_MIN = 0;
export const UNIT_MAX = 1;

export function definedZoomState(zoom?: AxisZoomState): DefinedZoomState {
    return {
        x: { min: zoom?.x?.min ?? UNIT_MIN, max: zoom?.x?.max ?? UNIT_MAX },
        y: { min: zoom?.y?.min ?? UNIT_MIN, max: zoom?.y?.max ?? UNIT_MAX },
    };
}
