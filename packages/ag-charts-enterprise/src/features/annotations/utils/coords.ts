import { _ModuleSupport } from 'ag-charts-community';
import { entries } from 'ag-charts-core';

import type { AnnotationContext, Point } from '../annotationTypes';
import { convertPoint, invertCoords } from './values';

const { Vec2, toRadians } = _ModuleSupport;

export function snapPoint(
    offset: _ModuleSupport.Vec2,
    context: AnnotationContext,
    snapping: boolean = false,
    origin?: Point,
    angleStep: number = 1
) {
    if (!snapping) return invertCoords(offset, context);

    const center = origin ? convertPoint(origin, context) : Vec2.origin();
    return invertCoords(snapToAngle(offset, center, angleStep), context);
}

export function snapToAngle(
    { x, y }: _ModuleSupport.Vec2,
    center: _ModuleSupport.Vec2,
    step: number,
    direction: number = 1
) {
    const { x: cx, y: cy } = center;
    const r = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
    const theta = Math.atan2(y - cy, x - cx);

    const stepRadians = toRadians(step);
    const snapTheta = Math.round(theta / stepRadians) * stepRadians;

    return {
        x: cx + r * Math.cos(snapTheta),
        y: cy + r * Math.sin(snapTheta) * direction,
    };
}

export function getDragStartState<PointName extends string>(
    points: Record<PointName, Point>,
    context: AnnotationContext
) {
    const dragState = {} as Record<PointName, _ModuleSupport.Vec2>;

    for (const [name, point] of entries(points)) {
        dragState[name] = convertPoint(point as Point, context);
    }

    return dragState;
}

export function translate<VectorName extends string>(
    vectors: Record<VectorName, _ModuleSupport.Vec2>,
    translation: _ModuleSupport.Vec2,
    context: AnnotationContext
) {
    const vecs: _ModuleSupport.Vec2[] = [];
    const result: Partial<Record<VectorName, _ModuleSupport.Vec2>> = {};

    for (const [name, vector] of entries(vectors)) {
        const translatedVec = Vec2.add(vector as _ModuleSupport.Vec2, translation);
        vecs.push(translatedVec);
        result[name] = invertCoords(translatedVec, context);
    }

    const { xAxis, yAxis } = context;

    // Only move the points along each axis if all the corners are within the axis, allowing the annotation to
    // slide along the perpendicular axis.
    const within = (min: number, value: number, max: number) => value >= min && value <= max;

    const translateX = vecs.every((vec) => within(xAxis.bounds.x, vec.x, xAxis.bounds.x + xAxis.bounds.width));
    const translateY = vecs.every((vec) => within(yAxis.bounds.y, vec.y, yAxis.bounds.y + yAxis.bounds.height));

    return { vectors: result, translateX, translateY };
}
