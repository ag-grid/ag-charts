import type { _ModuleSupport, _Scene } from 'ag-charts-community';

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

type RequiredNonNullable<T> = {
    [P in keyof T]: NonNullable<T[P]>;
};

export function prepareCandlestickAnimationFunctions() {
    const fromFn: _ModuleSupport.FromToMotionPropFn<
        _Scene.Group,
        RequiredNonNullable<Pick<_Scene.Group, 'scalingX' | 'scalingY' | 'scalingCenterY'>>,
        CandlestickNodeBaseDatum
    > = (candlestickGroup: _Scene.Group, datum: CandlestickNodeBaseDatum, status: _ModuleSupport.NodeUpdateState) => {
        if (status === 'updated' && candlestickGroup.previousDatum == null) {
            status = 'added';
        }
        const maxOrMin = datum.itemId === 'up' ? Math.max : Math.min;
        if (status === 'added' && datum != null) {
            return {
                scalingCenterY: maxOrMin(datum.scaledValues.highValue, datum.scaledValues.lowValue),
                scalingX: 1,
                scalingY: 0,
            };
        }
        return {
            scalingCenterY: maxOrMin(datum.scaledValues.highValue, datum.scaledValues.lowValue),
            scalingX: 1,
            scalingY: 1,
        };
    };
    const toFn: _ModuleSupport.FromToMotionPropFn<
        _Scene.Group,
        Pick<_Scene.Group, 'scalingX' | 'scalingY'>,
        CandlestickNodeBaseDatum
    > = () => {
        return { scalingX: 1, scalingY: 1 };
    };

    return { toFn, fromFn };
}
