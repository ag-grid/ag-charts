import { _ModuleSupport } from 'ag-charts-community';
import type { Chart } from 'ag-charts-community-test';
import { ChartAxisDirection } from 'ag-charts-core';

import type { PolarCrossLine } from '../axes/polar-crosslines/polarCrossLine';

type CrossLinesPlugin = NonNullable<ReturnType<typeof _ModuleSupport.getCrossLinesPlugin>>;

// Polar axes get the enterprise `polarCrossLines` module, which the module map keys by that
// name — so `getCrossLinesPlugin`, which looks up `crossLines`, only resolves cartesian axes.
export function crossLineInstances(target: Chart, axisId: string) {
    const axis = target.axes.findById(axisId);
    if (axis == null) return [];
    const plugin =
        _ModuleSupport.getCrossLinesPlugin(axis) ?? axis.getModuleMap().getModule<CrossLinesPlugin>('polarCrossLines');
    return plugin?.getInstances() ?? [];
}

export function polarCrossLineAt(target: Chart, axisId: string, index = 0) {
    return crossLineInstances(target, axisId)[index] as PolarCrossLine;
}

export function polarCanvasPoint(instance: PolarCrossLine, radius: number, angle: number) {
    return _ModuleSupport.Transformable.toCanvasPoint(
        instance.type === 'range' ? instance.rangeGroup : instance.lineGroup,
        radius * Math.cos(angle),
        radius * Math.sin(angle)
    );
}

// A point on the drawn geometry of each cross-line kind, derived from the instance's own layout.
export function pointOnPolarCrossLine(instance: PolarCrossLine) {
    const { scale, axisInnerRadius, axisOuterRadius } = instance;
    const midRadius = (axisInnerRadius + axisOuterRadius) / 2;
    if (instance.direction === ChartAxisDirection.Angle) {
        const angle =
            instance.type === 'line'
                ? scale!.convert(instance.value)
                : (scale!.convert(instance.range![0]) + scale!.convert(instance.range![1])) / 2;
        return polarCanvasPoint(instance, midRadius, angle);
    }
    const toRadius = (value: unknown) => axisOuterRadius + axisInnerRadius - scale!.convert(value);
    const radius =
        instance.type === 'line'
            ? toRadius(instance.value)
            : (toRadius(instance.range![0]) + toRadius(instance.range![1])) / 2;
    return polarCanvasPoint(instance, radius, instance.gridAngles![0]);
}
