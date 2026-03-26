import type { Bounds4, Point } from '../../types/scene';

/**
 * An interface for a vector with 4 components, considered to be a pair of vector2 coordinates. This can represent a
 * line with a start and end point, or two opposite corners of a box. There is no inherent ordering of the values
 * for each component, though positional functions such as `topCenter` will consider the min or max of each pair
 * of `x` and `y` components.
 */

/**
 * Get the vector2 at the start of a vector4.
 */
export function start(a: Bounds4): Point {
    return { x: a.x1, y: a.y1 };
}

/**
 * Get the vector2 at the end of a vector4.
 */
export function end(a: Bounds4): Point {
    return { x: a.x2, y: a.y2 };
}

/**
 * Get the vector2 at top center of a vector4.
 */
export function topCenter(a: Bounds4): Point {
    return { x: (a.x1 + a.x2) / 2, y: Math.min(a.y1, a.y2) };
}

/**
 * Get the vector2 at center of a vector4.
 */
export function center(a: Bounds4): Point {
    return { x: (a.x1 + a.x2) / 2, y: (a.y1 + a.y2) / 2 };
}

/**
 * Get the vector2 at bottom center of a vector4.
 */
export function bottomCenter(a: Bounds4): Point {
    return { x: (a.x1 + a.x2) / 2, y: Math.max(a.y1, a.y2) };
}

/**
 * Get the absolute width of a vector4.
 */
export function width(a: Bounds4): number {
    return Math.abs(a.x2 - a.x1);
}

/**
 * Get the absolute height of a vector4.
 */
export function height(a: Bounds4): number {
    return Math.abs(a.y2 - a.y1);
}

/**
 * Round each component of the vector4 to the nearest integer.
 */
export function round(a: Bounds4): Bounds4 {
    return { x1: Math.round(a.x1), y1: Math.round(a.y1), x2: Math.round(a.x2), y2: Math.round(a.y2) };
}

/**
 * Clone a vector4.
 */
export function clone(a: Bounds4): Bounds4 {
    return { x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2 };
}

export function collides(a: Bounds4, b: Bounds4): boolean {
    const an = normalise(a);
    const bn = normalise(b);
    return an.x1 <= bn.x2 && an.x2 >= bn.x1 && an.y1 <= bn.y2 && an.y2 >= bn.y1;
}

export function normalise(a: Bounds4): Bounds4 {
    return {
        x1: Math.min(a.x1, a.x2),
        x2: Math.max(a.x1, a.x2),
        y1: Math.min(a.y1, a.y2),
        y2: Math.max(a.y1, a.y2),
    };
}

/**
 * Create a vector4 from an `x1`, `y1`, `x2` and `y2`.
 */
export function from(x1: number, y1: number, x2: number, y2: number): Bounds4;
/**
 * Create a vector4 from a bounding box.
 */
export function from(bbox: { x: number; y: number; width: number; height: number }): Bounds4;
export function from(
    a: number | { x: number; y: number; width: number; height: number } | Bounds4,
    b?: number,
    c?: number,
    d?: number
): Bounds4 {
    if (typeof a === 'number') {
        return { x1: a, y1: b!, x2: c!, y2: d! };
    }

    if ('width' in a) {
        return normalise({
            x1: a.x,
            y1: a.y,
            x2: a.x + a.width,
            y2: a.y + a.height,
        });
    }

    throw new Error(`Values can not be converted into a vector4: [${JSON.stringify(a)}] [${b}] [${c}] [${d}]`);
}

/**
 * Create a vector4 at the origin point (0,0).
 */
export function origin(): Bounds4 {
    return { x1: 0, y1: 0, x2: 0, y2: 0 };
}
