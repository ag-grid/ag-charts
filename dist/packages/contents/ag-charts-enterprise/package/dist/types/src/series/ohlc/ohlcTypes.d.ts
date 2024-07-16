import type { LineDashOptions, StrokeOptions } from 'ag-charts-community';
import type { CandlestickNodeBaseDatum } from '../candlestick/candlestickTypes';
export interface OhlcNodeDatum extends CandlestickNodeBaseDatum, StrokeOptions, LineDashOptions {
}
