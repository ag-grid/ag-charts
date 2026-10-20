import type { ExtendedPath2D } from 'ag-charts-core';

/** Emits one closed polygon ring: a single `moveTo`, `n - 1` `lineTo` and one `closePath`. */
export function drawPolygonRing(
    path: Pick<ExtendedPath2D, 'moveTo' | 'lineTo' | 'closePath'>,
    angles: readonly number[],
    radius: number
) {
    for (const [index, angle] of angles.entries()) {
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (index === 0) {
            path.moveTo(x, y);
        } else {
            path.lineTo(x, y);
        }
    }
    path.closePath();
}
