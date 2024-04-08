import type { _ModuleSupport, _Scene } from 'ag-charts-community';

import { GroupTags } from './ohlcGroup';
import type { OhlcNodeDatum } from './ohlcTypes';

type AnimatableOhlcLineDatum = {
    y1?: number;
    y2?: number;
    x1?: number;
    x2: number;
    opacity?: number;
};

export function resetOhlcSelectionsStartFn(): (node: _Scene.Line, datum: OhlcNodeDatum) => AnimatableOhlcLineDatum {
    return (node, datum) => {
        const { y1, y2, x1, x2 } = getLineCoordinates(node, datum);

        return {
            y1,
            y2,
            x1,
            x2,
            opacity: 1,
        };
    };
}

export function prepareOhlcLineAnimationFunctions() {
    const fromFn: _ModuleSupport.FromToMotionPropFn<_Scene.Line, AnimatableOhlcLineDatum, OhlcNodeDatum> = (
        line: _Scene.Line,
        datum: OhlcNodeDatum,
        status: _ModuleSupport.NodeUpdateState
    ) => {
        if (status === 'added' && datum != null) {
            const maxOrMin = datum.itemId === 'up' ? Math.max : Math.min;
            const collapsedY = maxOrMin(datum.scaledValues.highValue, datum.scaledValues.lowValue);
            const { x1, x2 } = getLineCoordinates(line, datum);
            return {
                y1: collapsedY,
                y2: collapsedY,
                x1,
                x2,
                opacity: line.opacity,
            };
        }
        return {
            y1: line.y1,
            y2: line.y2,
            x1: line.x1,
            x2: line.x2,
            opacity: line.opacity,
        };
    };
    const toFn: _ModuleSupport.FromToMotionPropFn<_Scene.Line, AnimatableOhlcLineDatum, OhlcNodeDatum> = (
        line: _Scene.Line,
        datum: OhlcNodeDatum,
        status: _ModuleSupport.NodeUpdateState
    ) => {
        const { y1, y2, x1, x2 } = getLineCoordinates(line, datum);

        if (status === 'removed') {
            const maxOrMin = datum.itemId === 'up' ? Math.max : Math.min;
            const collapsedY = maxOrMin(datum.scaledValues.highValue, datum.scaledValues.lowValue);
            return {
                y1: collapsedY,
                y2: collapsedY,
                x1,
                x2,
                opacity: 0,
            };
        }

        return {
            y1,
            y2,
            x1,
            x2,
            opacity: line.opacity,
        };
    };

    return { toFn, fromFn };
}

function getLineCoordinates(line: _Scene.Line, datum: OhlcNodeDatum) {
    const {
        bandwidth,
        scaledValues: { xValue: x, openValue, closeValue, highValue, lowValue },
    } = datum;

    const yHigh = Math.min(highValue, lowValue);
    const yLow = Math.max(highValue, lowValue);
    const halfStrokeWidth = line.strokeWidth / 2;
    const halfBandwidth = bandwidth / 2;

    const { tag } = line;

    switch (tag) {
        case GroupTags.Body: {
            return {
                x1: Math.floor(x + halfBandwidth),
                x2: Math.floor(x + halfBandwidth),
                y1: yHigh,
                y2: yLow,
            };
        }
        case GroupTags.Open:
            return {
                y1: Math.round(openValue + halfStrokeWidth),
                y2: Math.round(openValue + halfStrokeWidth),
                x1: Math.floor(x),
                x2: Math.floor(x + halfBandwidth),
            };
        case GroupTags.Close:
        default:
            return {
                y1: Math.round(closeValue - halfStrokeWidth),
                y2: Math.round(closeValue - halfStrokeWidth),
                x1: Math.floor(x + halfBandwidth),
                x2: Math.floor(x + bandwidth),
            };
    }
}
