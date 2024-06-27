export const Vec2 = {
    add,
    angle,
    apply,
    equal,
    distance,
    distanceSquared,
    from,
    fromOffset,
    length,
    lengthSquared,
    required,
    rotate,
    sub,
};

interface Vec2 {
    x: number;
    y: number;
}

/**
 * Add the components of the vectors `a` and `b`.
 */
function add(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtract the components of `b` from `a`.
 */
function sub(a: Vec2, b: Vec2): Vec2 {
    return { x: a.x - b.x, y: a.y - b.y };
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
 * Find the angle between two vectors.
 */
function angle(a: Vec2, b: Vec2) {
    return Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x);
}

/**
 * Rotate vector `a` by the angle `theta around the origin `b`.
 */
function rotate(a: Vec2, theta: number, b: Vec2 = required()) {
    const l = Vec2.length(a);
    return { x: b.x + l * Math.cos(theta), y: b.y + l * Math.sin(theta) };
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
function from(x: number, y: number): Vec2 {
    return { x, y };
}

/**
 * Transform an object with `offsetX` and `offsetY` to a vector.
 */
function fromOffset(a: { offsetX: number; offsetY: number }): Vec2 {
    return { x: a.offsetX, y: a.offsetY };
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
