export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function boxCollides(b: BoundingBox, x: number, y: number, w: number, h: number): boolean {
    return x < b.x + b.width && x + w > b.x && y < b.y + b.height && y + h > b.y;
}

export function boxContains(b: BoundingBox, x: number, y: number, w: number = 0, h: number = 0): boolean {
    return x >= b.x && x + w <= b.x + b.width && y >= b.y && y + h <= b.y + b.height;
}

export function boxEmpty(b: BoundingBox | undefined): boolean {
    return b == null || b.height === 0 || b.width === 0 || isNaN(b.height) || isNaN(b.width);
}

export function boxesEqual(a: BoundingBox, b: BoundingBox): boolean {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
