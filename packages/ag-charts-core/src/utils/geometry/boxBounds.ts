import type { Point, Size } from '../../types/scene';

export interface BoxBounds extends Size, Point {}

export function boxCollides(b: BoxBounds, x: number, y: number, w: number, h: number): boolean {
    return x < b.x + b.width && x + w > b.x && y < b.y + b.height && y + h > b.y;
}

export function boxContains(b: BoxBounds, x: number, y: number, w: number = 0, h: number = 0): boolean {
    return x >= b.x && x + w <= b.x + b.width && y >= b.y && y + h <= b.y + b.height;
}

/** `b` shrunk by `inset` px on every side. Width/height may go non-positive for a small box; callers guard. */
export function insetBox(b: BoxBounds, inset: number): BoxBounds {
    return { x: b.x + inset, y: b.y + inset, width: b.width - 2 * inset, height: b.height - 2 * inset };
}

/** `b` shrunk by `insetX` on left/right and `insetY` on top/bottom. Width/height may go non-positive; callers guard. */
export function insetBoxXY(b: BoxBounds, insetX: number, insetY: number): BoxBounds {
    return { x: b.x + insetX, y: b.y + insetY, width: b.width - 2 * insetX, height: b.height - 2 * insetY };
}

export function boxEmpty(b: BoxBounds | undefined): boolean {
    return b == null || b.height === 0 || b.width === 0 || Number.isNaN(b.height) || Number.isNaN(b.width);
}

export function boxesEqual(a: BoxBounds | undefined, b: BoxBounds | undefined): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
