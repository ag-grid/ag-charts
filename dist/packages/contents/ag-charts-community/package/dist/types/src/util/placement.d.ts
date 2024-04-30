export type Bounds = {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    width?: number;
    height?: number;
};
export declare function calculatePlacement(naturalWidth: number, naturalHeight: number, containerWidth: number, containerHeight: number, bounds: Bounds): {
    x: number;
    y: number;
    width: number;
    height: number;
};
