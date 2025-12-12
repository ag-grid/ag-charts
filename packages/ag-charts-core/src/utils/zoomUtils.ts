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

export interface AxisZoomState {
    x?: ZoomMinMax;
    y?: ZoomMinMax;
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
