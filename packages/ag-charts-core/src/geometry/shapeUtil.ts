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
 * Calculates the minimum axis-aligned outer rectangle that fully contains
 * an inner rectangle of the given size when rotated by a specified angle.
 *
 * @param rotationDeg - Rotation angle in degrees.
 * @param innerWidth - Width of the inner rectangle.
 * @param innerHeight - Height of the inner rectangle (defaults to Infinity).
 * @returns The smallest outer rectangle that contains the rotated inner rectangle.
 */
export function getMinOuterRectSize(rotationDeg: number, innerWidth: number, innerHeight: number = Infinity): Size {
    return getMinOuterRectSizeInto({ width: 0, height: 0 }, rotationDeg, innerWidth, innerHeight);
}

/** {@link getMinOuterRectSize}, written into `out` instead of a new object. */
export function getMinOuterRectSizeInto(out: Size, rotationDeg: number, w: number, h: number): Size {
    // Periodic every 180 degrees
    const angle = (rotationDeg % 180) * (Math.PI / 180);
    const sin = Math.abs(Math.sin(angle));
    const cos = Math.abs(Math.cos(angle));

    if (sin === 0) {
        // 0 or 180
        out.width = w;
        out.height = h;
    } else if (cos === 0) {
        // 90
        out.width = h;
        out.height = w;
    } else {
        // Bounding-box of a rotated rectangle
        out.width = w * cos + h * sin;
        out.height = w * sin + h * cos;
    }
    return out;
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
