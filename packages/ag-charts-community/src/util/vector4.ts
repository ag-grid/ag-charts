export const Vec4 = {
    bottomCenter,
    center,
    clone,
    end,
    from,
    height,
    start,
    topCenter,
    origin,
    width,
};

/**
 * An interface for a vector with 4 components, considered to be a pair of vector2 coordinates. This can represent a
 * line with a start and end point, or two opposite corners of a box. There is no inherent ordering of the values
 * for each component, though positional functions such as `topCenter` will consider the min or max of each pair
 * of `x` and `y` components.
 */
export interface Vec4 {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

// Avoiding circular deps, placing elsewhere causes issues of clashing Vec2.fn() naming
interface Vec2 {
    x: number;
    y: number;
}

/**
 * Get the vector2 at the start of a vector4.
 */
function start(a: Vec4): Vec2 {
    return { x: a.x1, y: a.y1 };
}

/**
 * Get the vector2 at the end of a vector4.
 */
function end(a: Vec4): Vec2 {
    return { x: a.x2, y: a.y2 };
}

/**
 * Get the vector2 at top center of a vector4.
 */
function topCenter(a: Vec4): Vec2 {
    return { x: (a.x1 + a.x2) / 2, y: Math.min(a.y1, a.y2) };
}

/**
 * Get the vector2 at center of a vector4.
 */
function center(a: Vec4): Vec2 {
    return { x: (a.x1 + a.x2) / 2, y: (a.y1 + a.y2) / 2 };
}

/**
 * Get the vector2 at bottom center of a vector4.
 */
function bottomCenter(a: Vec4): Vec2 {
    return { x: (a.x1 + a.x2) / 2, y: Math.max(a.y1, a.y2) };
}

/**
 * Get the absolute width of a vector4.
 */
function width(a: Vec4): number {
    return Math.abs(a.x2 - a.x1);
}

/**
 * Get the absolute height of a vector4.
 */
function height(a: Vec4): number {
    return Math.abs(a.y2 - a.y1);
}

/**
 * Clone a vector4.
 */
function clone(a: Vec4): Vec4 {
    return { x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2 };
}

/**
 * Create a vector4 from an `x1`, `y1`, `x2` and `y2`.
 */
function from(x1: number, y1: number, x2: number, y2: number): Vec4;
/**
 * Create a vector4 from a bounding box.
 */
function from(bbox: { x: number; y: number; width: number; height: number }): Vec4;
function from(
    a: number | { x: number; y: number; width: number; height: number } | Vec4,
    b?: number,
    c?: number,
    d?: number
): Vec4 {
    if (typeof a === 'number') {
        return { x1: a, y1: b!, x2: c!, y2: d! };
    }

    if ('width' in a) {
        return {
            x1: a.x,
            y1: a.y,
            x2: a.x + a.width,
            y2: a.y + a.height,
        };
    }

    throw new Error(`Values can not be converted into a vector4: [${a}] [${b}] [${c}] [${d}]`);
}

/**
 * Create a vector4 at the origin point (0,0).
 */
function origin(): Vec4 {
    return { x1: 0, y1: 0, x2: 0, y2: 0 };
}
