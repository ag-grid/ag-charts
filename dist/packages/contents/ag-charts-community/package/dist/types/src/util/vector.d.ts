export declare const Vec2: {
    add: typeof add;
    angle: typeof angle;
    apply: typeof apply;
    equal: typeof equal;
    distance: typeof distance;
    distanceSquared: typeof distanceSquared;
    from: typeof from;
    fromOffset: typeof fromOffset;
    length: typeof length;
    lengthSquared: typeof lengthSquared;
    required: typeof required;
    rotate: typeof rotate;
    sub: typeof sub;
};
interface Vec2 {
    x: number;
    y: number;
}
/**
 * Add the components of the vectors `a` and `b`.
 */
declare function add(a: Vec2, b: Vec2): Vec2;
/**
 * Subtract the components of `b` from `a`.
 */
declare function sub(a: Vec2, b: Vec2): Vec2;
/**
 * Get the length of a vector.
 */
declare function length(a: Vec2): number;
/**
 * Get the squared length of a vector. This method is faster than `length(a)` and is useful when making comparisons
 * where the precise length does not matter.
 */
declare function lengthSquared(a: Vec2): number;
/**
 * Get the distance between two vectors.
 */
declare function distance(a: Vec2, b: Vec2): number;
/**
 * Get the squared distance between two vectors. This method is faster than `distance(a, b)` and is useful when making
 * comparisons where the precise distance does not matter.
 */
declare function distanceSquared(a: Vec2, b: Vec2): number;
/**
 * Find the angle between two vectors.
 */
declare function angle(a: Vec2, b: Vec2): number;
/**
 * Rotate vector `a` by the angle `theta around the origin `b`.
 */
declare function rotate(a: Vec2, theta: number, b?: Vec2): {
    x: number;
    y: number;
};
/**
 * Check if the components of `a` and `b` are equal.
 */
declare function equal(a: Vec2, b: Vec2): boolean;
/**
 * Create a vector from an `x` and `y`.
 */
declare function from(x: number, y: number): Vec2;
/**
 * Transform an object with `offsetX` and `offsetY` to a vector.
 */
declare function fromOffset(a: {
    offsetX: number;
    offsetY: number;
}): Vec2;
/**
 * Apply the components of `b` to `a` and return `a`.
 */
declare function apply(a: Partial<Vec2>, b: Vec2): Vec2;
/**
 * Create a vector, defaulting the components to `0` if nullish.
 */
declare function required(a?: Partial<Vec2>): Vec2;
export {};
