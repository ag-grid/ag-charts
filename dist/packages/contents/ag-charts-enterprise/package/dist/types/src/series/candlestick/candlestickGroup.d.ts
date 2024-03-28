import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { AgCandlestickSeriesItemOptions } from 'ag-charts-community/src/options/next';
import type { CandlestickNodeDatum } from './candlestickTypes';
export declare enum GroupTags {
    Rect = 0,
    Outline = 1,
    Wick = 2
}
export type ActiveCandlestickGroupStyles = AgCandlestickSeriesItemOptions;
export declare class CandlestickGroup extends _Scene.Group {
    constructor();
    updateDatumStyles(datum: CandlestickNodeDatum, activeStyles: _ModuleSupport.DeepRequired<ActiveCandlestickGroupStyles>): void;
}
