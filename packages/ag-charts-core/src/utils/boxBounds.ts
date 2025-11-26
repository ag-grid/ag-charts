import type { Point, Size } from '../interfaces/sceneTypes';

export interface BoxBounds extends Size, Point {}

export function boxCollides(b: BoxBounds, x: number, y: number, w: number, h: number): boolean {
    return x < b.x + b.width && x + w > b.x && y < b.y + b.height && y + h > b.y;
}

export function boxContains(b: BoxBounds, x: number, y: number, w: number = 0, h: number = 0): boolean {
    return x >= b.x && x + w <= b.x + b.width && y >= b.y && y + h <= b.y + b.height;
}

export function boxEmpty(b: BoxBounds | undefined): boolean {
    return b == null || b.height === 0 || b.width === 0 || Number.isNaN(b.height) || Number.isNaN(b.width);
}

export function boxesEqual(a: BoxBounds | undefined, b: BoxBounds | undefined): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
