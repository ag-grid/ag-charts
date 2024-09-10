import { type AgAnnotationLineStyleType, type PixelSize, type _Scene, _Util } from 'ag-charts-community';

import type { Coords, LineCoords } from '../annotationTypes';

const { Vec2 } = _Util;

export function getLineStyle(lineDash?: PixelSize[], lineStyle?: AgAnnotationLineStyleType) {
    return lineDash ? 'dashed' : lineStyle ?? 'solid';
}

export function getComputedLineDash(strokeWidth: number, styleType: AgAnnotationLineStyleType): PixelSize[] {
    switch (styleType) {
        case 'solid':
            return [];
        case 'dashed':
            return [strokeWidth * 4, strokeWidth * 2];
        case 'dotted':
            return [0, strokeWidth * 2];
    }
}

export function getLineDash(
    lineDash?: PixelSize[],
    computedLineDash?: PixelSize[],
    lineStyle?: AgAnnotationLineStyleType,
    strokeWidth?: number
): PixelSize[] | undefined {
    const styleType = getLineStyle(lineDash, lineStyle);
    return computedLineDash ?? lineDash ?? getComputedLineDash(strokeWidth ?? 1, styleType);
}

export function getLineCap(
    lineCap?: _Scene.ShapeLineCap,
    lineDash?: PixelSize[],
    lineStyle?: AgAnnotationLineStyleType
): _Scene.ShapeLineCap | undefined {
    const styleType = getLineStyle(lineDash, lineStyle);
    return lineCap ?? styleType === 'dotted' ? 'round' : undefined;
}

/**
 * Find the pair of points where a line intersects a bounding box.
 */
export function boundsIntersections({ x1, y1, x2, y2 }: LineCoords, bounds: _Scene.BBox): [Coords, Coords] {
    const p1 = Vec2.from(x1, y1);
    const p2 = Vec2.from(x2, y2);

    const reflection = bounds.height;

    const gradient = Vec2.gradient(p2, p1, reflection);
    const intercept = Vec2.intercept(p2, gradient, reflection);

    // Fallback intersections of a vertical line at the x value
    const fallback = [
        { x: p1.x, y: reflection == null ? 0 : reflection },
        { x: p1.x, y: reflection == null ? bounds.height : reflection - bounds.height },
    ] as [Coords, Coords];

    // When a line is vertical the gradient is infinity and none of our intersections will be valid, so shortcut and
    // return the fallback value.
    if (gradient === Infinity) {
        return fallback;
    }

    // Create a set of the four possible intersection points at each of the four sides of the bounding box.
    let points = [
        Vec2.intersectAtY(gradient, intercept, 0, reflection),
        Vec2.intersectAtY(gradient, intercept, bounds.height, reflection),
        Vec2.intersectAtX(gradient, intercept, 0, reflection),
        Vec2.intersectAtX(gradient, intercept, bounds.width, reflection),
    ];

    // Filter the points to the two that are within the bounds of the box.
    points = points
        .filter((p) => p.x >= bounds.x && p.x <= bounds.width && p.y >= bounds.y && p.y <= bounds.height)
        .sort((a, b) => {
            if (a.x === b.x) return 0;
            return a.x < b.x ? -1 : 1;
        });

    // This should never happen since we handle the infinite gradient vertical case above.
    if (points.length !== 2) {
        return fallback;
    }

    return points as [Coords, Coords];
}
