import type { _ModuleSupport } from 'ag-charts-community';

import { polygonPointSearch } from './polygonPointSearch';

export function preferredLabelCenter(
    polygons: _ModuleSupport.Position[][],
    { aspectRatio, precision }: { aspectRatio: number; precision: number }
) {
    const result = polygonPointSearch(polygons, precision, (p, cx, cy, stride) => {
        const width = maxWidthOfRectConstrainedByCenterAndAspectRatioToPolygon(p, cx, cy, aspectRatio);
        const maxWidth = width + 2 * stride * aspectRatio;
        const distance = width * Math.SQRT2;
        const maxDistance = maxWidth * Math.SQRT2;
        return { distance, maxDistance };
    });
    if (result == null) return;

    const { x, y, distance } = result;
    const maxWidth = distance / Math.SQRT2;

    return { x, y, maxWidth };
}

export function maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment(
    a: _ModuleSupport.Position,
    b: _ModuleSupport.Position,
    cx: number,
    cy: number,
    aspectRatio: number
) {
    const [ax, ay] = a;
    const [bx, by] = b;

    const positiveM = 1 / aspectRatio;

    const abx = bx - ax;
    const aby = by - ay;

    const [topPointX, topPointY] = ay <= by ? a : b;
    const [leftPointX, leftPointY] = ax <= bx ? a : b;
    const [bottomPointX, bottomPointY] = ay <= by ? b : a;
    const [rightPointX, rightPointY] = ax <= bx ? b : a;

    let maxWidth = Infinity;

    // (y - y0) = m(x - x0)
    if (abx !== 0) {
        const abm = aby / abx;

        for (let i = 0; i <= 1; i += 1) {
            const m = i === 0 ? positiveM : -positiveM;
            // (y - cy) = m(x - cx)
            // y - ay = abm * (x - ax)
            // y = abm * (x - ax) + ay = m * x
            // abm * x - abm * ax + ay = m * x
            // x * (abm - m) = abm * ax - ay
            const x = (abm * ax - ay - m * cx + cy) / (abm - m);
            if (x >= leftPointX && x <= rightPointX) {
                const width = Math.abs(cx - x) * 2;
                maxWidth = Math.min(maxWidth, width);
            }
        }
    } else {
        // x = ax = bx
        for (let i = 0; i <= 1; i += 1) {
            const m = i === 0 ? positiveM : -positiveM;
            // (y - cy) = m * (x - cx); x = ax
            const y = m * (ax - cx) + cy;
            if (y >= topPointY && y <= bottomPointY) {
                const height = Math.abs(cy - y) * 2;
                const width = height * aspectRatio;
                maxWidth = Math.min(maxWidth, width);
            }
        }
    }

    // Use reciporicals to avoid division by zero
    const positiveMRecip = aspectRatio;
    const centerToTopMRecip = Math.abs((topPointX - cx) / (topPointY - cy));
    const centerToBottomMRecip = Math.abs((bottomPointX - cx) / (bottomPointY - cy));

    if (bottomPointY < cy && centerToBottomMRecip < positiveMRecip) {
        // Line completely above center
        const height = Math.abs(cy - bottomPointY) * 2;
        const width = height * aspectRatio;
        maxWidth = Math.min(maxWidth, width);
    } else if (topPointY > cy && centerToTopMRecip < positiveMRecip) {
        // Line completely below center
        const height = Math.abs(cy - topPointY) * 2;
        const width = height * aspectRatio;
        maxWidth = Math.min(maxWidth, width);
    }

    const centerToLeftM = Math.abs((leftPointY - cy) / (leftPointX - cx));
    const centerToRightM = Math.abs((rightPointY - cy) / (rightPointX - cx));

    if (rightPointX < cx && centerToRightM < positiveM) {
        // Line completely to left center
        const width = Math.abs(cx - rightPointX) * 2;
        maxWidth = Math.min(maxWidth, width);
    } else if (leftPointX > cx && centerToLeftM < positiveM) {
        // Line completely to right center
        const width = Math.abs(cx - leftPointX) * 2;
        maxWidth = Math.min(maxWidth, width);
    }

    return maxWidth;
}

export function maxWidthOfRectConstrainedByCenterAndAspectRatioToPolygon(
    polygons: _ModuleSupport.Position[][],
    cx: number,
    cy: number,
    aspectRatio: number
) {
    let inside = false;
    let minWidth = Infinity;

    for (const polygon of polygons) {
        let p0 = polygon[polygon.length - 1];
        let [x0, y0] = p0;

        for (const p1 of polygon) {
            const [x1, y1] = p1;

            if (y1 > cy !== y0 > cy && cx < ((x0 - x1) * (cy - y1)) / (y0 - y1) + x1) {
                inside = !inside;
            }

            const width = maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment(p0, p1, cx, cy, aspectRatio);

            minWidth = Math.min(minWidth, width);
            p0 = p1;
            x0 = x1;
            y0 = y1;
        }
    }

    return (inside ? 1 : -1) * minWidth;
}

export function maxWidthOfRectConstrainedByCenterAndHeightToLineSegment(
    a: _ModuleSupport.Position,
    b: _ModuleSupport.Position,
    cx: number,
    cy: number,
    height: number
) {
    const ry0 = cy - height / 2;
    const ry1 = cy + height / 2;

    const [ax, ay] = a;
    const [bx, by] = b;

    const abx = bx - ax;
    const aby = by - ay;

    const [leftPointX, leftPointY] = ax <= bx ? a : b;
    const [rightPointX, rightPointY] = ax <= bx ? b : a;

    let maxWidth = Infinity;

    if (abx !== 0) {
        const abm = aby / abx;

        for (let i = 0; i <= 1; i += 1) {
            const y = i === 0 ? ry0 : ry1;
            // y - ay = abm * (x - ax)
            const x = (y - ay) / abm + ax;
            if (x >= leftPointX && x <= rightPointX) {
                const width = Math.abs(cx - x) * 2;
                maxWidth = Math.min(maxWidth, width);
            }
        }
    } else if ((ay >= ry0 && ay <= ry1) || (by >= ry0 && by <= ry1)) {
        const width = Math.abs(cx - ax) * 2;
        maxWidth = Math.min(maxWidth, width);
    }

    if (rightPointX < cx && rightPointY >= ry0 && rightPointY <= ry1) {
        // Line completely to left center
        const width = Math.abs(cx - rightPointX) * 2;
        maxWidth = Math.min(maxWidth, width);
    } else if (leftPointX > cx && leftPointY >= ry0 && leftPointY <= ry1) {
        // Line completely to right center
        const width = Math.abs(cx - leftPointX) * 2;
        maxWidth = Math.min(maxWidth, width);
    }

    return maxWidth;
}

export function maxWidthInPolygonForRectOfHeight(
    polygons: _ModuleSupport.Position[][],
    cx: number,
    cy: number,
    height: number
) {
    let minWidth = Infinity;

    for (const polygon of polygons) {
        let p0 = polygon[polygon.length - 1];

        for (const p1 of polygon) {
            const width = maxWidthOfRectConstrainedByCenterAndHeightToLineSegment(p0, p1, cx, cy, height);

            minWidth = Math.min(minWidth, width);
            p0 = p1;
        }
    }

    return minWidth;
}
