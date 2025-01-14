import { _ModuleSupport } from 'ag-charts-community';

import type { PointProperties } from '../annotationProperties';
import type { AnnotationAxisContext, AnnotationContext, Point } from '../annotationTypes';
import { getGroupingValue } from './scale';

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

export function convertPoint(point: Point, context: AnnotationContext) {
    const x = convert(point.x, context.xAxis);
    const y = convert(point.y, context.yAxis);

    return { x, y };
}

export function convert(p: Point['x' | 'y'], context: Pick<AnnotationAxisContext, 'scale' | 'snapToGroup'>) {
    if (p == null) return 0;

    const { value, groupPercentage } = getGroupingValue(p);

    const { scale, snapToGroup } = context;
    const bandwidth = scale.bandwidth ?? 0;
    const offset = snapToGroup ? bandwidth / 2 : bandwidth * groupPercentage;
    return scale.convert(value) + offset;
}

export function invertCoords(coords: _ModuleSupport.Vec2, context: AnnotationContext) {
    const x = invert(coords.x, context.xAxis);
    const y = invert(coords.y, context.yAxis);

    return { x, y };
}

export function invert(
    n: _ModuleSupport.Vec2['x' | 'y'],
    context: Pick<AnnotationAxisContext, 'scale' | 'continuous' | 'scaleInvert' | 'scaleInvertNearest'>
) {
    if (context.continuous) {
        return context.scaleInvert(n);
    }

    const { scale } = context;
    const value = context.scaleInvertNearest(n);
    const bandStart = scale.convert(value);
    const bandEnd = bandStart + (scale.bandwidth ?? 0);
    const position = Math.max(Math.min(n, scale.range[1]), scale.range[0]);
    const groupPercentage = bandStart === bandEnd ? 0 : (position - bandStart) / (bandEnd - bandStart);

    return { value, groupPercentage };
}
