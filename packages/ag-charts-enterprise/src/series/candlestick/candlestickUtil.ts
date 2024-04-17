import { _ModuleSupport, type _Scene } from 'ag-charts-community';

import type { CandlestickBaseGroup } from './candlestickGroup';
import type { CandlestickNodeBaseDatum, CandlestickNodeDatum } from './candlestickTypes';

const { NODE_UPDATE_STATE_TO_PHASE_MAPPING } = _ModuleSupport;

export type AnimatableCandlestickGroupDatum = {
    x?: number;
    y?: number;
    yBottom?: number;
    yHigh?: number;
    yLow?: number;
    width?: number;
    height?: number;
};

export function resetCandlestickSelectionsFn(
    _node: CandlestickBaseGroup<CandlestickNodeBaseDatum, any>,
    datum: CandlestickNodeBaseDatum
) {
    return getCoordinates(datum);
}

export function prepareCandlestickAnimationFunctions() {
    const fromFn: _ModuleSupport.FromToMotionPropFn<
        CandlestickBaseGroup<CandlestickNodeBaseDatum, any>,
        AnimatableCandlestickGroupDatum,
        CandlestickNodeBaseDatum
    > = (
        candlestickGroup: CandlestickBaseGroup<CandlestickNodeBaseDatum, any>,
        datum: CandlestickNodeBaseDatum,
        status: _ModuleSupport.NodeUpdateState
    ) => {
        const phase = NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];

        if (status === 'unknown' || (status === 'added' && datum != null)) {
            const { x, y, yLow, yHigh, width, height } = getCoordinates(datum);
            let collapsedY = datum.itemId === 'up' ? yLow : yHigh;
            if (status === 'unknown') {
                collapsedY = y + height / 2;
            }
            return {
                x,
                y: collapsedY,
                yBottom: collapsedY,
                yHigh: collapsedY,
                yLow: collapsedY,
                width,
                height: 0,
                phase,
            };
        }

        return {
            x: candlestickGroup.x,
            y: candlestickGroup.y,
            yBottom: candlestickGroup.yBottom,
            yHigh: candlestickGroup.yHigh,
            yLow: candlestickGroup.yLow,
            width: candlestickGroup.width,
            height: candlestickGroup.height,
            phase,
        };
    };
    const toFn: _ModuleSupport.FromToMotionPropFn<
        CandlestickBaseGroup<CandlestickNodeBaseDatum, any>,
        AnimatableCandlestickGroupDatum,
        CandlestickNodeBaseDatum
    > = (
        _: CandlestickBaseGroup<CandlestickNodeBaseDatum, any>,
        datum: CandlestickNodeBaseDatum,
        status: _ModuleSupport.NodeUpdateState
    ) => {
        if (status === 'removed') {
            const { x, yLow, yHigh, width } = getCoordinates(datum);
            const collapsedY = datum.itemId === 'up' ? yLow : yHigh;
            return { x, y: collapsedY, yBottom: collapsedY, yHigh: collapsedY, yLow: collapsedY, width, height: 0 };
        }

        return getCoordinates(datum);
    };

    return { toFn, fromFn };
}

function getCoordinates(datum: CandlestickNodeDatum) {
    const {
        bandwidth,
        scaledValues: { xValue: x, openValue, closeValue, highValue, lowValue },
    } = datum;

    const y = Math.min(openValue, closeValue);
    const yBottom = isNaN(openValue) ? closeValue : Math.max(openValue, closeValue);
    const yHigh = Math.min(highValue, lowValue);
    const yLow = Math.max(highValue, lowValue);

    return {
        x,
        y,
        yBottom,
        yHigh,
        yLow,
        width: bandwidth,
        height: Math.max(yBottom - y, 0.001), // This is to differentiate between animation setting height 0 and data values resulting in height 0
    };
}
