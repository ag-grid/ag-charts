import { BarSeriesModule, LineSeriesModule } from 'ag-charts-community';
import type { ModuleDefinition } from 'ag-charts-core';

import { PriceVolumePresetModule } from '../preset/priceVolumePresetModules';
import { CandlestickSeriesModule } from '../series/candlestick/candlestickModule';
import { OhlcSeriesModule } from '../series/ohlc/ohlcModule';
import { RangeBarSeriesModule } from '../series/range-bar/rangeBarModule';

export const FinancialChartModule: ModuleDefinition[] = [
    PriceVolumePresetModule,
    BarSeriesModule,
    LineSeriesModule,
    CandlestickSeriesModule,
    OhlcSeriesModule,
    RangeBarSeriesModule,
];
