import type { ExtendedPath2D } from '../extendedPath2D';

export interface Corner {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    cx: number;
    cy: number;
}

export const drawCorner = (
    path: ExtendedPath2D,
    { x0, y0, x1, y1, cx, cy }: Corner,
    cornerRadius: number,
    move: boolean
) => {
    if (move) {
        path.moveTo(x0, y0);
    }

    if (x0 !== x1 || y0 !== y1) {
        const r0 = Math.atan2(y0 - cy, x0 - cx);
        const r1 = Math.atan2(y1 - cy, x1 - cx);
        path.arc(cx, cy, cornerRadius, r0, r1);
    } else {
        path.lineTo(x0, y0);
    }
};
