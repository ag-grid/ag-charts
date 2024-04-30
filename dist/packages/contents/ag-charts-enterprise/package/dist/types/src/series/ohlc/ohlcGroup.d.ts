import type { AgOhlcSeriesItemOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { CandlestickBaseGroup } from '../candlestick/candlestickGroup';
import type { OhlcNodeDatum } from './ohlcTypes';
export declare enum GroupTags {
    Body = 0,
    Open = 1,
    Close = 2
}
export declare class OhlcGroup extends CandlestickBaseGroup<OhlcNodeDatum, _ModuleSupport.DeepRequired<AgOhlcSeriesItemOptions>> {
    constructor();
    updateCoordinates(): void;
    updateDatumStyles(_datum: OhlcNodeDatum, activeStyles: _ModuleSupport.DeepRequired<AgOhlcSeriesItemOptions>): void;
}
