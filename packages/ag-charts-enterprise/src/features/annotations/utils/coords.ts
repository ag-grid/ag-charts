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
    context: AnnotationContext,
    options: { overflowContinuous: number } = { overflowContinuous: 0 }
) {
    const { xAxis, yAxis } = context;
    const vectorNames = Object.keys(vectors) as VectorName[];
    const overflowsX: number[] = [];
    const overflowsY: number[] = [];

    for (const name of vectorNames) {
        vectors[name] = Vec2.add(vectors[name], translation);

        overflowsX.push(xAxis.getRangeOverflow(vectors[name].x));
        overflowsY.push(yAxis.getRangeOverflow(vectors[name].y));
    }

    const sortedOverflowsX = overflowsX.toSorted((a, b) => Math.abs(a) - Math.abs(b));
    const sortedOverflowsY = overflowsY.toSorted((a, b) => Math.abs(a) - Math.abs(b));

    const overflow = Vec2.from(sortedOverflowsX.at(-1) ?? 0, sortedOverflowsY.at(-1) ?? 0);

    // Explicitly test the scales because ordinal time axes report as continuous
    if (_ModuleSupport.ContinuousScale.is(xAxis.scale) && options.overflowContinuous > 0) {
        overflow.x = sortedOverflowsX.at(-options.overflowContinuous - 1) ?? 0;
    }
    if (_ModuleSupport.ContinuousScale.is(yAxis.scale) && options.overflowContinuous > 0) {
        overflow.y = sortedOverflowsY.at(-options.overflowContinuous - 1) ?? 0;
    }

    if (!Vec2.equal(overflow, Vec2.origin())) {
        for (const name of vectorNames) {
            // Round to prevent slight adjustments from floating point imprecision
            vectors[name] = Vec2.round(Vec2.sub(vectors[name], overflow), 4);
        }
    }

    const result = {} as Record<VectorName, _ModuleSupport.Vec2>;
    for (const name of vectorNames) {
        result[name] = invertCoords(vectors[name], context);
    }

    return result;
}
