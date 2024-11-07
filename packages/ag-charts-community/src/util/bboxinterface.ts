export const BBoxValues = { containsPoint, isEmpty };

export interface BBoxValues {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface BBoxContainsTester {
    containsPoint(x: number, y: number): boolean;
}

export interface BBoxProvider<T = BBoxValues> {
    id: string;
    toCanvasBBox(): T;
    fromCanvasPoint(x: number, y: number): { x: number; y: number };
    visible?: boolean;
}

function containsPoint(bbox: BBoxValues, x: number, y: number): boolean {
    return x >= bbox.x && x <= bbox.x + bbox.width && y >= bbox.y && y <= bbox.y + bbox.height;
}

function isEmpty(bbox: BBoxValues | undefined): boolean {
    return bbox == null || bbox.height === 0 || bbox.width === 0 || isNaN(bbox.height) || isNaN(bbox.width);
}
