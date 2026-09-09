import { type FitRegion, type Position, memoiseByBand } from 'ag-charts-core';

import { polygonPointSearch } from './polygonPointSearch';

export function preferredLabelCenter(
    polygons: Position[][],
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
    a: Position,
    b: Position,
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
    if (abx === 0) {
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
    } else {
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
    }

    // Use reciprocals to avoid division by zero
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

function maxWidthOfRectConstrainedByCenterAndAspectRatioToPolygon(
    polygons: Position[][],
    cx: number,
    cy: number,
    aspectRatio: number
) {
    let inside = false;
    let minWidth = Infinity;

    for (const polygon of polygons) {
        let p0 = polygon.at(-1)!;
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

function applyX(into: { minX: number; maxX: number }, cx: number, x: number) {
    if (x >= cx) {
        into.maxX = Math.min(into.maxX, x - cx);
    }
    if (x <= cx) {
        into.minX = Math.max(into.minX, x - cx);
    }
}

export function xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(
    into: { minX: number; maxX: number },
    a: Position,
    b: Position,
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

    if (abx !== 0) {
        const abm = aby / abx;

        for (let i = 0; i <= 1; i += 1) {
            const y = i === 0 ? ry0 : ry1;
            // y - ay = abm * (x - ax)
            const x = (y - ay) / abm + ax;
            if (x >= leftPointX && x <= rightPointX) {
                applyX(into, cx, x);
            }
        }
    } else if (Math.max(ry0, Math.min(ay, by)) <= Math.min(ry1, Math.max(ay, by))) {
        applyX(into, cx, ax);
    }

    if (rightPointX < cx && rightPointY >= ry0 && rightPointY <= ry1) {
        // Line completely to left center
        applyX(into, cx, rightPointX);
    } else if (leftPointX > cx && leftPointY >= ry0 && leftPointY <= ry1) {
        // Line completely to right center
        applyX(into, cx, leftPointX);
    }

    return into;
}

/**
 * The room a polygon offers a label anchored at `(cx, cy)`, which must lie inside it, as a {@link FitRegion}.
 * Spans are exact, taken from the edges each band meets, and memoised as wrapping asks per candidate word.
 */
export function polygonFitRegion(polygons: Position[][], cx: number, cy: number): FitRegion {
    let extentAbove = Infinity;
    let extentBelow = Infinity;
    for (const polygon of polygons) {
        let [x0, y0] = polygon.at(-1)!;
        for (const [x1, y1] of polygon) {
            if (Math.min(x0, x1) <= cx && cx <= Math.max(x0, x1)) {
                // A vertical edge on the anchor's own column bounds it at its nearer end on each side.
                const yLo = x0 === x1 ? Math.min(y0, y1) : y0 + ((cx - x0) * (y1 - y0)) / (x1 - x0);
                const yHi = x0 === x1 ? Math.max(y0, y1) : yLo;
                if (yLo <= cy) extentAbove = Math.min(extentAbove, cy - Math.min(yHi, cy));
                if (yHi >= cy) extentBelow = Math.min(extentBelow, Math.max(yLo, cy) - cy);
            }
            x0 = x1;
            y0 = y1;
        }
    }

    const spanAt = (top: number, bottom: number): readonly [number, number] => {
        const into = { minX: -Infinity, maxX: Infinity };
        for (const polygon of polygons) {
            let p0 = polygon.at(-1)!;
            for (const p1 of polygon) {
                xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(
                    into,
                    p0,
                    p1,
                    cx,
                    cy + (top + bottom) / 2,
                    bottom - top
                );
                p0 = p1;
            }
        }
        return Number.isFinite(into.minX) && Number.isFinite(into.maxX) ? [into.minX, into.maxX] : [0, 0];
    };

    return {
        spanAt: memoiseByBand(spanAt),
        extentAbove: Number.isFinite(extentAbove) ? extentAbove : 0,
        extentBelow: Number.isFinite(extentBelow) ? extentBelow : 0,
    };
}
