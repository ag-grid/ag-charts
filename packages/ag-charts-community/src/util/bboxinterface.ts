export const BBoxValues = { containsPoint, equals, isEmpty, normalize };

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

function equals(lhs: BBoxValues, rhs: BBoxValues): boolean {
    return lhs.x === rhs.x && lhs.y === rhs.y && lhs.width === rhs.width && lhs.height === rhs.height;
}

function isEmpty(bbox: BBoxValues | undefined): boolean {
    return bbox == null || bbox.height === 0 || bbox.width === 0 || isNaN(bbox.height) || isNaN(bbox.width);
}

function normalize(bbox: Partial<BBoxValues>): Partial<BBoxValues> {
    let { x, y, width, height } = bbox;
    if ((width == null || width > 0) && (height == null || height > 0)) return bbox;
    if (x != null && width != null && width < 0) {
        width = -width;
        x = x - width;
    }
    if (y != null && height != null && height < 0) {
        height = -height;
        y = y - height;
    }
    return { x, y, width, height };
}
