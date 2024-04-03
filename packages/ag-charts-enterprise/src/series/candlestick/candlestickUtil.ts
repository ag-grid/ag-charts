import { _ModuleSupport, _Scene } from 'ag-charts-community';

import type { CandlestickBaseGroup } from './candlestickGroup';
import type { CandlestickNodeBaseDatum } from './candlestickTypes';

export function prepareCandlestickFromTo(isVertical: boolean) {
    const from = isVertical ? { scalingX: 1, scalingY: 0 } : { scalingX: 0, scalingY: 1 };
    const to = { scalingX: 1, scalingY: 1 };

    return { from, to };
}

export function resetCandlestickSelectionsScalingStartFn(
    isVertical: boolean
): (
    node: CandlestickBaseGroup<any, any>,
    datum: CandlestickNodeBaseDatum
) => { scalingCenterY: number } | { scalingCenterX: number } {
    return (_node, datum) => {
        if (isVertical) {
            const maxOrMin = datum.itemId === 'up' ? Math.max : Math.min;
            return { scalingCenterY: maxOrMin(datum.scaledValues.highValue, datum.scaledValues.lowValue) };
        }
        return { scalingCenterX: datum.scaledValues.highValue };
    };
}
