import type { CandlestickGroup } from './candlestickGroup';
import type { CandlestickNodeDatum } from './candlestickTypes';
export declare function prepareCandlestickFromTo(isVertical: boolean): {
    from: {
        scalingX: number;
        scalingY: number;
    };
    to: {
        scalingX: number;
        scalingY: number;
    };
};
export declare function resetCandlestickSelectionsScalingStartFn(isVertical: boolean): (node: CandlestickGroup, datum: CandlestickNodeDatum) => {
    scalingCenterY: number;
} | {
    scalingCenterX: number;
};
