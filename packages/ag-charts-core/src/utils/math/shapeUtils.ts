import type { Point, Size } from '../boxBounds';

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

    if (!isFinite(H)) {
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
