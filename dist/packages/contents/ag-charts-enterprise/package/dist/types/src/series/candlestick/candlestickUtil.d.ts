import { _ModuleSupport, type _Scene } from 'ag-charts-community';
import type { CandlestickBaseGroup } from './candlestickGroup';
import type { CandlestickNodeBaseDatum } from './candlestickTypes';
export type AnimatableCandlestickGroupDatum = {
    x?: number;
    y?: number;
    yBottom?: number;
    yHigh?: number;
    yLow?: number;
    width?: number;
    height?: number;
};
export declare function resetCandlestickSelectionsFn(_node: CandlestickBaseGroup<CandlestickNodeBaseDatum, any>, datum: CandlestickNodeBaseDatum): {
    x: number;
    y: number;
    yBottom: number;
    yHigh: number;
    yLow: number;
    width: number;
    height: number;
};
export declare function prepareCandlestickAnimationFunctions(initial: boolean): {
    toFn: _ModuleSupport.FromToMotionPropFn<CandlestickBaseGroup<CandlestickNodeBaseDatum, any>, AnimatableCandlestickGroupDatum, CandlestickNodeBaseDatum>;
    fromFn: _ModuleSupport.FromToMotionPropFn<CandlestickBaseGroup<CandlestickNodeBaseDatum, any>, AnimatableCandlestickGroupDatum, CandlestickNodeBaseDatum>;
};
type AbstractCandlestickSeries = {
    getNodeData(): CandlestickNodeBaseDatum[] | undefined;
    contentGroup: _Scene.Group;
};
export declare function computeCandleFocusBounds(series: AbstractCandlestickSeries, opts: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined;
export {};
