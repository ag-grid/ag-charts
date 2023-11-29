import type { BoxPlotGroup } from './boxPlotGroup';
import type { BoxPlotNodeDatum } from './boxPlotTypes';
export declare function prepareBoxPlotFromTo(isVertical: boolean): {
    from: {
        scalingX: number;
        scalingY: number;
    };
    to: {
        scalingX: number;
        scalingY: number;
    };
};
export declare function resetBoxPlotSelectionsScalingCenterFn(isVertical: boolean): (node: BoxPlotGroup, datum: BoxPlotNodeDatum) => {
    scalingCenterY: number;
} | {
    scalingCenterX: number;
};
