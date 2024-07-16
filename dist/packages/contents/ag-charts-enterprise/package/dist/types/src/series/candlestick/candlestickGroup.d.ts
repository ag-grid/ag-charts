import type { AgCandlestickSeriesItemOptions } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { CandlestickNodeDatum } from './candlestickTypes';
export declare enum GroupTags {
    Body = 0,
    LowWick = 1,
    HighWick = 2
}
export declare abstract class CandlestickBaseGroup<TNodeDatum, TStyles> extends _Scene.Group implements _ModuleSupport.QuadtreeCompatibleNode {
    abstract updateDatumStyles(datum: TNodeDatum, activeStyles: TStyles): void;
    abstract updateCoordinates(): void;
    x: number;
    y: number;
    yBottom: number;
    yHigh: number;
    yLow: number;
    width: number;
    height: number;
    distanceSquared(x: number, y: number): number;
    get midPoint(): {
        x: number;
        y: number;
    };
    render(renderCtx: _Scene.RenderContext): void;
}
export declare class CandlestickGroup extends CandlestickBaseGroup<CandlestickNodeDatum, AgCandlestickSeriesItemOptions> {
    constructor();
    updateCoordinates(): void;
    updateDatumStyles(datum: CandlestickNodeDatum, activeStyles: AgCandlestickSeriesItemOptions): void;
}
