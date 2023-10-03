import type { BoxPlotGroup } from './boxPlotGroup';
import type { BoxPlotNodeDatum } from './boxPlotTypes';

export function prepareBoxPlotFromTo(isVertical: boolean) {
    const from = isVertical ? { scalingX: 1, scalingY: 0 } : { scalingX: 0, scalingY: 1 };
    const to = { scalingX: 1, scalingY: 1 };

    return { from, to };
}

export function resetBoxPlotSelectionsScalingCenterFn(
    isVertical: boolean
): (node: BoxPlotGroup, datum: BoxPlotNodeDatum) => { scalingCenterY: number } | { scalingCenterX: number } {
    return (_node, datum) => {
        if (isVertical) {
            return { scalingCenterY: datum.scaledValues.medianValue };
        }
        return { scalingCenterX: datum.scaledValues.medianValue };
    };
}
