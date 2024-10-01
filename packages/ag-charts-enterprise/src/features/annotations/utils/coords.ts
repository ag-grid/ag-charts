import { _Scene } from 'ag-charts-community';

import type { Coords } from '../annotationTypes';

const { toRadians } = _Scene;

export function snapToAngle({ x, y }: Coords, center: Coords, step: number, direction: number = 1) {
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
