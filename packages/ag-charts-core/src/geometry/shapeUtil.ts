import type { Point, Size } from '../types/scene';

/**
 * Calculates the maximum width and height of an inner rectangle that can be
 * rotated by a given angle (in degrees) and still fully fit within a container.
 *
 * @param rotationDeg - Rotation angle in degrees.
 * @param containerWidth - Width of the outer container.
 * @param containerHeight - Optional height of the container (defaults to Infinity).
 * @returns The largest inner rectangle size that fits when rotated.
 */
export function getMaxInnerRectSize(
    rotationDeg: number,
    containerWidth: number,
    containerHeight: number = Infinity
): Size {
    const W = containerWidth;
    const H = containerHeight;

    const angle = (rotationDeg % 180) * (Math.PI / 180);
    const sin = Math.abs(Math.sin(angle));
    const cos = Math.abs(Math.cos(angle));

    if (sin === 0) return { width: W, height: H };
    if (cos === 0) return { width: H, height: W };

    if (!Number.isFinite(H)) {
        const r = cos / sin;
        const width = W / (cos + r * sin);
        return { width, height: r * width };
    }

    const denominator = cos * cos - sin * sin;
    if (denominator === 0) {
        const side = Math.min(W, H) / Math.SQRT2;
        return { width: side, height: side };
    }

    return {
        width: Math.abs((W * cos - H * sin) / denominator),
        height: Math.abs((H * cos - W * sin) / denominator),
    };
}

/**
 * Like `getMaxInnerRectSize`, but always returns a rectangle that fits its container once rotated, including
 * containers with one infinite side and containers too narrow for a rectangle touching all four sides.
 *
 * @param rotationDeg - Rotation angle in degrees.
 * @param containerWidth - Width of the outer container.
 * @param containerHeight - Height of the outer container.
 * @returns The largest inner rectangle size that fits when rotated.
 */
export function getInnerRectSize(rotationDeg: number, containerWidth: number, containerHeight: number): Size {
    const W = containerWidth;
    const H = containerHeight;

    // A box with an infinite width has the same answer as the box turned a quarter-turn.
    if (!Number.isFinite(W)) return getMaxInnerRectSize(rotationDeg + 90, H, W);
    if (!Number.isFinite(H)) return getMaxInnerRectSize(rotationDeg, W, H);

    const angle = (rotationDeg % 180) * (Math.PI / 180);
    const sin = Math.abs(Math.sin(angle));
    const cos = Math.abs(Math.cos(angle));
    const short = Math.min(W, H);
    if (sin === 0 || cos === 0 || short > 2 * sin * cos * Math.max(W, H)) {
        return getMaxInnerRectSize(rotationDeg, W, H);
    }

    // Too narrow for the four-sided solution: take the largest rectangle touching only the two long sides.
    const half = short / 2;
    return W <= H ? { width: half / cos, height: half / sin } : { width: half / sin, height: half / cos };
}

/**
 * Calculates the minimum axis-aligned outer rectangle that fully contains
 * an inner rectangle of the given size when rotated by a specified angle.
 *
 * @param rotationDeg - Rotation angle in degrees.
 * @param innerWidth - Width of the inner rectangle.
 * @param innerHeight - Height of the inner rectangle (defaults to Infinity).
 * @returns The smallest outer rectangle that contains the rotated inner rectangle.
 */
export function getMinOuterRectSize(rotationDeg: number, innerWidth: number, innerHeight: number = Infinity): Size {
    const w = innerWidth;
    const h = innerHeight;

    // Periodic every 180 degrees
    const angle = (rotationDeg % 180) * (Math.PI / 180);
    const sin = Math.abs(Math.sin(angle));
    const cos = Math.abs(Math.cos(angle));

    // Special cases
    if (sin === 0) return { width: w, height: h }; // 0 or 180
    if (cos === 0) return { width: h, height: w }; // 90

    // Bounding-box of a rotated rectangle
    return {
        width: w * cos + h * sin,
        height: w * sin + h * cos,
    };
}

export function rotatePoint(
    x: number,
    y: number,
    angle: number, // in radians
    originX: number = 0,
    originY: number = 0
): Point {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const dx = x - originX;
    const dy = y - originY;

    return {
        x: originX + dx * cos - dy * sin,
        y: originY + dx * sin + dy * cos,
    };
}
