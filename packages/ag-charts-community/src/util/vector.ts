export const Vec2 = {
    add,
    angle,
    apply,
    equal,
    distance,
    distanceSquared,
    from,
    gradient,
    intercept,
    intersectAtX,
    intersectAtY,
    length,
    lengthSquared,
    multiply,
    normalized,
    origin,
    required,
    rotate,
    sub,
};

export interface Vec2 {
    x: number;
    y: number;
}

/**
 * Add the components of the vectors `a` and `b`.
 */
function add(a: Vec2, b: Vec2): Vec2;
function add(a: Vec2, b: number): Vec2;
function add(a: Vec2, b: Vec2 | number): Vec2 {
    if (typeof b === 'number') {
        return { x: a.x + b, y: a.y + b };
    }
    return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract the components of `b` from `a`.
 */
function sub(a: Vec2, b: Vec2): Vec2;
function sub(a: Vec2, b: number): Vec2;
function sub(a: Vec2, b: Vec2 | number): Vec2 {
    if (typeof b === 'number') {
        return { x: a.x - b, y: a.y - b };
    }
    return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Multiply the components of `a` and `b`.
 */
function multiply(a: Vec2, b: Vec2 | number): Vec2 {
    if (typeof b === 'number') {
        return { x: a.x * b, y: a.y * b };
    }
    return { x: a.x * b.x, y: a.y * b.y };
}

/**
 * Get the length of a vector.
 */
function length(a: Vec2) {
    return Math.sqrt(a.x * a.x + a.y * a.y);
}

/**
 * Get the squared length of a vector. This method is faster than `length(a)` and is useful when making comparisons
 * where the precise length does not matter.
 */
function lengthSquared(a: Vec2) {
    return a.x * a.x + a.y * a.y;
}

/**
 * Get the distance between two vectors.
 */
function distance(a: Vec2, b: Vec2) {
    const d = sub(a, b);
    return Math.sqrt(d.x * d.x + d.y * d.y);
}

/**
 * Get the squared distance between two vectors. This method is faster than `distance(a, b)` and is useful when making
 * comparisons where the precise distance does not matter.
 */
function distanceSquared(a: Vec2, b: Vec2) {
    const d = sub(a, b);
    return d.x * d.x + d.y * d.y;
}

/**
 * Normalize a vector so that each component is a value between 0 and 1 and the length of the vector is always 1.
 */
function normalized(a: Vec2): Vec2 {
    const l = length(a);
    return { x: a.x / l, y: a.y / l };
}

/**
 * Find the angle between two vectors.
 */
function angle(a: Vec2, b: Vec2 = origin()) {
    return Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x);
}

/**
 * Rotate vector `a` by the angle `theta` around the origin `b`.
 * This rotation is not cumulative, i.e. `rotate(rotate(a, Math.PI), Math.PI) !== a`.
 */
function rotate(a: Vec2, theta: number, b: Vec2 = origin()) {
    const l = length(a);
    return { x: b.x + l * Math.cos(theta), y: b.y + l * Math.sin(theta) };
}

/**
 * Get the gradient of the line that intersects two points.
 * Optionally reflect the line about the y-axis when the coordinate system has y = 0 at the top.
 */
function gradient(a: Vec2, b: Vec2, reflection?: number) {
    const dx = b.x - a.x;
    const dy = reflection == null ? b.y - a.y : reflection - b.y - (reflection - a.y);
    return dy / dx;
}

/**
 * Get the y-intercept of a line through a point with a gradient where `c = y - mx`.
 * Optionally reflect the line about the y-axis when the coordinate system has y = 0 at the top.
 */
// eslint-disable-next-line @typescript-eslint/no-shadow
function intercept(a: Vec2, gradient: number, reflection?: number) {
    const y = reflection == null ? a.y : reflection - a.y;
    return y - gradient * a.x;
}

/**
 * Get the point where a line intersects a horizontal line at the given y value.
 * Optionally reflect the line about the y-axis when the coordinate system has y = 0 at the top.
 */
// eslint-disable-next-line @typescript-eslint/no-shadow
function intersectAtY(gradient: number, coefficient: number, y: number = 0, reflection?: number) {
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
function intersectAtX(gradient: number, coefficient: number, x: number = 0, reflection?: number) {
    const y = gradient === Infinity ? Infinity : gradient * x + coefficient;
    return { x: x, y: reflection == null ? y : reflection - y };
}

/**
 * Check if the components of `a` and `b` are equal.
 */
function equal(a: Vec2, b: Vec2): boolean {
    return a.x === b.x && a.y === b.y;
}

/**
 * Create a vector from an `x` and `y`.
 */
function from(x: number, y: number): Vec2;
/**
 * Create a vector from a box containing a `width` and `height`.
 */
function from(bbox: { width: number; height: number }): Vec2;
/**
 * Create a vector from a html element's `offsetWidth` and `offsetHeight`.
 */
function from(element: { offsetWidth: number; offsetHeight: number }): Vec2;
/**
 * Create a vector from a region event.
 */
function from(regionEvent: { regionOffsetX: number; regionOffsetY: number }): Vec2;
/**
 * Create a vector from a line or box containing a pair of coordinates.
 */
function from(pair: { x1: number; y1: number; x2: number; y2: number }): [Vec2, Vec2];
function from(
    a:
        | number
        | { width: number; height: number }
        | { offsetWidth: number; offsetHeight: number }
        | { regionOffsetX: number; regionOffsetY: number }
        | { x1: number; y1: number; x2: number; y2: number },
    b?: number
): Vec2 | [Vec2, Vec2] {
    if (typeof a === 'number') {
        return { x: a, y: b! };
    }

    // Pick from object properties in order of specificity and return type
    if ('regionOffsetX' in a) {
        return { x: a.regionOffsetX, y: a.regionOffsetY };
    }

    if ('offsetWidth' in a) {
        return { x: a.offsetWidth, y: a.offsetHeight };
    }

    if ('width' in a) {
        return { x: a.width, y: a.height };
    }

    if ('x1' in a) {
        return [
            { x: a.x1, y: a.y1 },
            { x: a.x2, y: a.y2 },
        ];
    }

    throw new Error(`Values can not be converted into a vector: [${a}] [${b}]`);
}

/**
 * Apply the components of `b` to `a` and return `a`.
 */
function apply(a: Partial<Vec2>, b: Vec2): Vec2 {
    a.x = b.x;
    a.y = b.y;
    return a as Vec2;
}

/**
 * Create a vector, defaulting the components to `0` if nullish.
 */
function required(a?: Partial<Vec2>): Vec2 {
    return { x: a?.x ?? 0, y: a?.y ?? 0 };
}

/**
 * Create a vector at the origin point (0,0).
 */
function origin(): Vec2 {
    return { x: 0, y: 0 };
}
