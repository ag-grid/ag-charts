import { _ModuleSupport, _Scene } from 'ag-charts-community';

const { toRadians } = _Scene;

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
