import { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { AnnotationContext, Point } from '../annotationTypes';
import { convertPoint, invertCoords } from './values';

const { Vec2 } = _ModuleSupport;
const { toRadians } = _Scene;

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
