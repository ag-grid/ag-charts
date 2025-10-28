import type { Bounds4, Point } from '../interfaces/sceneTypes';
import { roundTo } from './numbers';

/**
 * Add the components of the vectors `a` and `b`.
 */
export function add(a: Point, b: Point): Point;
export function add(a: Point, b: number): Point;
export function add(a: Point, b: Point | number): Point {
    if (typeof b === 'number') {
        return { x: a.x + b, y: a.y + b };
    }
    return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract the components of `b` from `a`.
 */
export function sub(a: Point, b: Point): Point;
export function sub(a: Point, b: number): Point;
export function sub(a: Point, b: Point | number): Point {
    if (typeof b === 'number') {
        return { x: a.x - b, y: a.y - b };
    }
    return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Multiply the components of `a` and `b`.
 */
export function multiply(a: Point, b: Point): Point;
export function multiply(a: Point, b: number): Point;
export function multiply(a: Point, b: Point | number): Point {
    if (typeof b === 'number') {
        return { x: a.x * b, y: a.y * b };
    }
    return { x: a.x * b.x, y: a.y * b.y };
}

/**
 * Get the length of a vector.
 */
export function length(a: Point) {
    return Math.hypot(a.x, a.y);
}

/**
 * Get the squared length of a vector. This method is faster than `length(a)` and is useful when making comparisons
 * where the precise length does not matter.
 */
export function lengthSquared(a: Point) {
    return a.x * a.x + a.y * a.y;
}

/**
 * Get the distance between two vectors.
 */
export function distance(a: Point, b: Point) {
    return length(sub(a, b));
}

/**
 * Get the squared distance between two vectors. This method is faster than `distance(a, b)` and is useful when making
 * comparisons where the precise distance does not matter.
 */
export function distanceSquared(a: Point, b: Point) {
    return lengthSquared(sub(a, b));
}

/**
 * Normalize a vector so that each component is a value between 0 and 1 and the length of the vector is always 1.
 */
export function normalized(a: Point): Point {
    const l = length(a);
    return { x: a.x / l, y: a.y / l };
}

/**
 * Find the angle between two vectors.
 */
export function angle(a: Point, b?: Point) {
    if (b == null) return Math.atan2(a.y, a.x);
    return Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x);
}

/**
 * Rotate vector `a` by the angle `theta` around the origin `b`.
 * This rotation is not cumulative, i.e. `rotate(rotate(a, Math.PI), Math.PI) !== a`.
 */
export function rotate(a: Point, theta: number, b: Point = origin()): Point {
    const l = length(a);
    return { x: b.x + l * Math.cos(theta), y: b.y + l * Math.sin(theta) };
}

/**
 * Get the gradient of the line that intersects two points.
 * Optionally reflect the line about the y-axis when the coordinate system has y = 0 at the top.
 */
export function gradient(a: Point, b: Point, reflection?: number) {
    const dx = b.x - a.x;
    const dy = reflection == null ? b.y - a.y : reflection - b.y - (reflection - a.y);
    return dy / dx;
}

/**
 * Get the y-intercept of a line through a point with a gradient where `c = y - mx`.
 * Optionally reflect the line about the y-axis when the coordinate system has y = 0 at the top.
 */
// eslint-disable-next-line @typescript-eslint/no-shadow
export function intercept(a: Point, gradient: number, reflection?: number) {
    const y = reflection == null ? a.y : reflection - a.y;
    return y - gradient * a.x;
}

/**
 * Get the point where a line intersects a horizontal line at the given y value.
 * Optionally reflect the line about the y-axis when the coordinate system has y = 0 at the top.
 */
// eslint-disable-next-line @typescript-eslint/no-shadow
export function intersectAtY(gradient: number, coefficient: number, y: number = 0, reflection?: number): Point {
    return {
        x: gradient === Infinity ? Infinity : (y - coefficient) / gradient,
        y: reflection == null ? y : reflection - y,
    };
}

/**
 * Get the point where a line intersects a vertical line at the given x value.
 * Optionally reflect the line about the y-axis when the coordinate system has y = 0 at the top.
 */
// eslint-disable-next-line @typescript-eslint/no-shadow
export function intersectAtX(gradient: number, coefficient: number, x: number = 0, reflection?: number): Point {
    const y = gradient === Infinity ? Infinity : gradient * x + coefficient;
    return { x: x, y: reflection == null ? y : reflection - y };
}

/**
 * Round each component of the vector.
 */
export function round(a: Point, decimals: number = 2): Point {
    return { x: roundTo(a.x, decimals), y: roundTo(a.y, decimals) };
}

/**
 * Check if the components of `a` and `b` are equal.
 */
export function equal(a: Point, b: Point): boolean {
    return a.x === b.x && a.y === b.y;
}

/**
 * Create a vector from an `x` and `y`.
 */
export function from(x: number, y: number): Point;
/**
 * Create a vector from a widget event.
 */
export function from(event: { currentX: number; currentY: number }): Point;
/**
 * Create a vector from a html element's `offsetWidth` and `offsetHeight`.
 */
export function from(element: { offsetWidth: number; offsetHeight: number }): Point;
/**
 * Create a pair of vectors of the top left and bottom right of a bounding box.
 */
export function from(bbox: { x: number; y: number; width: number; height: number }): [Point, Point];
/**
 * Create a pair of vectors from a line or box containing a pair of coordinates.
 */
export function from(vec4: Bounds4): [Point, Point];
export function from(
    a:
        | number
        | { currentX: number; currentY: number }
        | { offsetWidth: number; offsetHeight: number }
        | { x: number; y: number; width: number; height: number }
        | Bounds4,
    b?: number
): Point | [Point, Point] {
    if (typeof a === 'number') {
        return { x: a, y: b! };
    }

    // Pick from object properties in order of specificity and return type
    if ('currentX' in a) {
        return { x: a.currentX, y: a.currentY };
    }

    if ('offsetWidth' in a) {
        return { x: a.offsetWidth, y: a.offsetHeight };
    }

    if ('width' in a) {
        return [
            { x: a.x, y: a.y },
            { x: a.x + a.width, y: a.y + a.height },
        ];
    }

    if ('x1' in a) {
        return [
            { x: a.x1, y: a.y1 },
            { x: a.x2, y: a.y2 },
        ];
    }

    throw new Error(`Values can not be converted into a vector: [${JSON.stringify(a)}] [${b}]`);
}

/**
 * Apply the components of `b` to `a` and return `a`.
 */
export function apply(a: Partial<Point>, b: Point): Point {
    a.x = b.x;
    a.y = b.y;
    return a as Point;
}

/**
 * Create a vector, defaulting the components to `0` if nullish.
 */
export function required(a?: Partial<Point>): Point {
    return { x: a?.x ?? 0, y: a?.y ?? 0 };
}

/**
 * Create a vector at the origin point (0,0).
 */
export function origin(): Point {
    return { x: 0, y: 0 };
}
