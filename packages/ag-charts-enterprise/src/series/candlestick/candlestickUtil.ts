import type { _ModuleSupport, _Scene } from 'ag-charts-community';

import { GroupTags } from './candlestickGroup';
import type { CandlestickNodeBaseDatum } from './candlestickTypes';

type AnimatableCandlestickBodyDatum = {
    x?: number;
    y?: number;
    height?: number;
    width?: number;
    opacity?: number;
};

type AnimatableCandlestickWickDatum = {
    y1?: number;
    y2?: number;
    x?: number;
    opacity?: number;
};

export function resetCandlestickSelectionsStartFn(): (
    node: _Scene.Rect,
    datum: CandlestickNodeBaseDatum
) => { x: number; y: number; width: number; height: number } {
    return (_node, datum) => {
        const { x, y, width, height } = getRectCoordinates(datum);

        return {
            x,
            y,
            width,
            height,
        };
    };
}

export function resetCandlestickWickSelectionsStartFn(): (
    node: _Scene.Line,
    datum: CandlestickNodeBaseDatum
) => { y1: number; y2: number; x: number } {
    return (node, datum) => {
        const { y1, y2, x } = getWickCoordinates(node, datum);

        return {
            y1,
            y2,
            x,
        };
    };
}

export function prepareCandlestickBodyAnimationFunctions() {
    const fromFn: _ModuleSupport.FromToMotionPropFn<
        _Scene.Rect,
        AnimatableCandlestickBodyDatum,
        CandlestickNodeBaseDatum
    > = (body: _Scene.Rect, datum: CandlestickNodeBaseDatum, status: _ModuleSupport.NodeUpdateState) => {
        const { x, width } = getRectCoordinates(datum);

        if (status === 'added' && datum != null) {
            const maxOrMin = datum.itemId === 'up' ? Math.max : Math.min;
            return {
                x,
                y: maxOrMin(datum.scaledValues.highValue, datum.scaledValues.lowValue),
                width,
                height: 0,
            };
        }
        return {
            x: body.x,
            y: body.y,
            width: body.width,
            height: body.height,
        };
    };
    const toFn: _ModuleSupport.FromToMotionPropFn<
        _Scene.Rect,
        AnimatableCandlestickBodyDatum,
        CandlestickNodeBaseDatum
    > = (rect: _Scene.Rect, datum: CandlestickNodeBaseDatum, status: _ModuleSupport.NodeUpdateState) => {
        const { x, y, width, height } = getRectCoordinates(datum);

        if (status === 'removed') {
            const maxOrMin = datum.itemId === 'up' ? Math.max : Math.min;
            // hmmm
            return {
                x,
                y: maxOrMin(datum.scaledValues.highValue, datum.scaledValues.lowValue),
                width,
                height: 0,
            };
        }

        return {
            x,
            y,
            width,
            height,
        };
    };

    return { toFn, fromFn };
}

export function prepareCandlestickWickAnimationFunctions() {
    const fromFn: _ModuleSupport.FromToMotionPropFn<
        _Scene.Line,
        AnimatableCandlestickWickDatum,
        CandlestickNodeBaseDatum
    > = (line: _Scene.Line, datum: CandlestickNodeBaseDatum, status: _ModuleSupport.NodeUpdateState) => {
        if (status === 'added' && datum != null) {
            const maxOrMin = datum.itemId === 'up' ? Math.max : Math.min;
            const collapsedY = maxOrMin(datum.scaledValues.highValue, datum.scaledValues.lowValue);
            const { x } = getWickCoordinates(line, datum);
            return {
                y1: collapsedY,
                y2: collapsedY,
                x,
            };
        }
        return {
            y1: line.y1,
            y2: line.y2,
            x: line.x1,
        };
    };
    const toFn: _ModuleSupport.FromToMotionPropFn<
        _Scene.Line,
        AnimatableCandlestickWickDatum,
        CandlestickNodeBaseDatum
    > = (line: _Scene.Line, datum: CandlestickNodeBaseDatum, status: _ModuleSupport.NodeUpdateState) => {
        const { y1, y2, x } = getWickCoordinates(line, datum);

        if (status === 'removed') {
            const maxOrMin = datum.itemId === 'up' ? Math.max : Math.min;
            const collapsedY = maxOrMin(datum.scaledValues.highValue, datum.scaledValues.lowValue);
            return {
                y1: collapsedY,
                y2: collapsedY,
                x,
            };
        }

        return {
            y1,
            y2,
            x,
        };
    };

    return { toFn, fromFn };
}

export function getRectCoordinates(datum: CandlestickNodeBaseDatum) {
    const {
        bandwidth,
        scaledValues: { xValue: x, openValue, closeValue },
    } = datum;

    const y = Math.min(openValue, closeValue);
    const yBottom = Math.max(openValue, closeValue);

    return {
        x,
        y,
        width: bandwidth,
        height: yBottom - y,
        yBottom,
    };
}

function getWickCoordinates(line: _Scene.Line, datum: CandlestickNodeBaseDatum) {
    const {
        bandwidth,
        scaledValues: { xValue: x, openValue, closeValue, highValue, lowValue },
    } = datum;

    const y = Math.min(openValue, closeValue);
    const yBottom = Math.max(openValue, closeValue);
    const yHigh = Math.min(highValue, lowValue);
    const yLow = Math.max(highValue, lowValue);

    const isLowWick = line.tag === GroupTags.LowWick;

    const halfStrokeWidth = line.strokeWidth / 2;
    return {
        y1: Math.round((isLowWick ? yLow : yHigh) + halfStrokeWidth),
        y2: Math.round((isLowWick ? yBottom : y) + halfStrokeWidth),
        x: Math.floor(x + bandwidth / 2),
    };
}
