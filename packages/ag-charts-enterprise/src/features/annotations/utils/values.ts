import type { Point } from 'ag-charts-core';

import type { PointProperties } from '../annotationProperties';
import type { AnnotationAxisContext, AnnotationContext, DataPoint } from '../annotationTypes';
import { getGrouping } from './scale';

export function convertLine(
    datum: { start: Pick<PointProperties, 'x' | 'y'>; end: Pick<PointProperties, 'x' | 'y'> },
    context: AnnotationContext
) {
    if (datum.start == null || datum.end == null) return;

    const start = convertPoint(datum.start, context);
    const end = convertPoint(datum.end, context);

    if (start == null || end == null) return;

    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

export function convertPoint(point: DataPoint, context: AnnotationContext) {
    const x = convert(point.x, context.xAxis);
    const y = convert(point.y, context.yAxis);

    return { x, y };
}

export function convert(
    p: DataPoint['x' | 'y'],
    context: Pick<AnnotationAxisContext, 'scale' | 'snapToGroup'>
): number {
    if (p == null) return 0;

    const { value, groupPercentage } = getGrouping(p);

    const { scale, snapToGroup } = context;
    const width = scale.bandwidth === 0 ? scale.step ?? 0 : scale.bandwidth ?? 0;

    // For band scales, groupPercentage represents the position within the band
    // 0 = start of band, 0.5 = center, 1 = end of band
    // Values outside 0-1 extend beyond the band boundaries
    const offset = snapToGroup ? width / 2 : width * groupPercentage;
    return scale.convert(value) + offset;
}

export function invertCoords(coords: Point, context: AnnotationContext) {
    const x = invert(coords.x, context.xAxis);
    const y = invert(coords.y, context.yAxis);

    return { x, y };
}

export function invert(
    n: number,
    context: Pick<AnnotationAxisContext, 'scale' | 'continuous' | 'scaleInvert' | 'scaleInvertNearest'>
) {
    const { scale } = context;
    if (context.continuous && scale.step == null) {
        return context.scaleInvert(n);
    }

    const value = context.scaleInvertNearest(n);
    const width = scale.bandwidth === 0 ? scale.step : scale.bandwidth ?? 0;
    const bandStart = scale.convert(value);
    const bandEnd = bandStart + width;
    const groupPercentage = bandStart === bandEnd ? 0 : (n - bandStart) / (bandEnd - bandStart);

    return { value, groupPercentage };
}
