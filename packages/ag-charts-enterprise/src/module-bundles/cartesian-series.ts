import { AllCartesianSeriesModule as AllCommunityCartesianSeriesModule } from 'ag-charts-community';
import type { ModuleDefinition } from 'ag-charts-core';

import { BoxPlotSeriesModule } from '../series/box-plot/boxPlotModule';
import { CandlestickSeriesModule } from '../series/candlestick/candlestickModule';
import { ConeFunnelSeriesModule } from '../series/cone-funnel/coneFunnelModule';
import { FunnelSeriesModule } from '../series/funnel/funnelModule';
import { HeatmapSeriesModule } from '../series/heatmap/heatmapModule';
import { OhlcSeriesModule } from '../series/ohlc/ohlcModule';
import { RangeAreaSeriesModule } from '../series/range-area/rangeAreaModule';
import { RangeBarSeriesModule } from '../series/range-bar/rangeBarModule';
import { WaterfallSeriesModule } from '../series/waterfall/waterfallModule';

export const AllCartesianSeriesModule: ModuleDefinition[] = [
    AllCommunityCartesianSeriesModule,
    BoxPlotSeriesModule,
    CandlestickSeriesModule,
    ConeFunnelSeriesModule,
    FunnelSeriesModule,
    HeatmapSeriesModule,
    OhlcSeriesModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    WaterfallSeriesModule,
].flat();
