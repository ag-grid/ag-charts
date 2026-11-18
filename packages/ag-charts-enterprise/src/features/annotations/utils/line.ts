import type { PixelSize } from 'ag-charts-community';
import {
    type BBox,
    type Bounds4,
    type Point,
    type ShapeLineCap,
    Vec2,
    isLineDashName,
    scaleLineDashName,
} from 'ag-charts-core';
import type { AgLineDashName } from 'ag-charts-types';

import type { AnnotationLineStyleType } from '../annotationTypes';

/**
 * The line style that a `lineDash` shows as in the toolbar and settings dialog. A dash that draws a solid line counts
 * as `solid`, and any dash other than `dot` counts as `dash`.
 */
export function getLineStyle(lineDash?: PixelSize[] | AgLineDashName): AnnotationLineStyleType {
    if (lineDash == null || lineDash === 'solid') return 'solid';
    if (Array.isArray(lineDash) && !hasGap(lineDash)) return 'solid';
    return lineDash === 'dot' ? 'dot' : 'dash';
}

/**
 * Whether a dash array leaves a gap. Canvas repeats an odd-length array once, so that its entries alternate between a
 * dash and a gap. Without a positive gap the stroke is continuous.
 */
function hasGap(lineDash: PixelSize[]) {
    const pattern = lineDash.length % 2 === 0 ? lineDash : [...lineDash, ...lineDash];
    return pattern.some((length, index) => index % 2 === 1 && length > 0);
}

export interface LineStyleSource {
    lineDash?: PixelSize[] | AgLineDashName;
    strokeWidth?: number;
}

/**
 * The dash to draw. A stock name is measured in multiples of the stroke width and an array in pixels. The annotation
 * keeps the name, rather than its array, so that the dash follows a change of width.
 *
 * A `dot` is drawn with round caps (see `getLineCap`), which extend every dash by the line width. It is therefore drawn
 * as a zero-length dash over the stock pattern's whole period, giving round dots at the same spacing as the stock dot.
 */
export function resolveLineDash(lineDash: PixelSize[] | AgLineDashName | undefined, strokeWidth: number | undefined) {
    if (!isLineDashName(lineDash)) return lineDash ?? [];

    const dash = scaleLineDashName(lineDash, strokeWidth);
    return lineDash === 'dot' ? [0, dash.reduce((sum, length) => sum + length, 0)] : dash;
}

export function getLineDash({ lineDash, strokeWidth }: LineStyleSource): PixelSize[] {
    return resolveLineDash(lineDash, strokeWidth);
}

export function getLineCap({ lineDash }: LineStyleSource): ShapeLineCap | undefined {
    return lineDash === 'dot' ? 'round' : undefined;
}

/**
 * Find the pair of points where a line intersects a bounding box.
 */
export function boundsIntersections(coords: Bounds4, bounds: BBox): [Point, Point] {
    const [p1, p2] = Vec2.from(coords);

    const reflection = bounds.height;
    const gradient = Vec2.gradient(p2, p1, reflection);
    const intercept = Vec2.intercept(p2, gradient, reflection);

    // Fallback intersections of a vertical line at the x value
    const fallback = [
        { x: p1.x, y: reflection ?? 0 },
        { x: p1.x, y: reflection == null ? bounds.height : reflection - bounds.height },
    ] as [Point, Point];

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

    return points as [Point, Point];
}
