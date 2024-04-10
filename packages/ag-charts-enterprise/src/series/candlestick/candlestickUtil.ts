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
        const { lowValue, highValue } = datum.scaledValues;
        if (isVertical) {
            return { scalingCenterY: (highValue + lowValue) / 2 };
        }
        return { scalingCenterX: (highValue + lowValue) / 2 };
    };
}
