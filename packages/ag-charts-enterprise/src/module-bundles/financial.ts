import { BarSeriesModule, LineSeriesModule, NumberAxisModule, TimeAxisModule } from 'ag-charts-community';
import type { ModuleDefinition } from 'ag-charts-core';

import { OrdinalTimeAxisModule } from '../axes/ordinal/ordinalTimeAxisModule';
import { AnimationModule } from '../features/animation/animationModule';
import { AnnotationsModule } from '../features/annotations/annotationsModule';
import { BandHighlightModule } from '../features/band-highlight/bandHighlightModule';
import { ChartToolbarModule } from '../features/chart-toolbar/chartToolbarModule';
import { ContextMenuModule } from '../features/context-menu/contextMenuModule';
import { CrosshairModule } from '../features/crosshair/crosshairModule';
import { DataSourceModule } from '../features/data-source/dataSourceModule';
import { ErrorBarsModule } from '../features/error-bar/errorBarModule';
import { NavigatorModule } from '../features/navigator/navigatorModule';
import { RangesModule } from '../features/ranges/rangesModule';
import { SyncModule } from '../features/sync/syncModule';
import { ZoomModule } from '../features/zoom/zoomModule';
import { GradientLegendModule } from '../gradient-legend/gradientLegendModule';
import { PriceVolumePresetModule } from '../preset/priceVolumePresetModules';
import { CandlestickSeriesModule } from '../series/candlestick/candlestickModule';
import { OhlcSeriesModule } from '../series/ohlc/ohlcModule';
import { RangeAreaSeriesModule } from '../series/range-area/rangeAreaModule';
import { RangeBarSeriesModule } from '../series/range-bar/rangeBarModule';

export const FinancialChartModule: ModuleDefinition[] = [
    PriceVolumePresetModule,
    BarSeriesModule,
    LineSeriesModule,
    CandlestickSeriesModule,
    OhlcSeriesModule,
    RangeBarSeriesModule,
    RangeAreaSeriesModule,

    AnimationModule,
    AnnotationsModule,
    BandHighlightModule,
    ChartToolbarModule,
    ContextMenuModule,
    CrosshairModule,
    DataSourceModule,
    ErrorBarsModule,
    GradientLegendModule,
    NavigatorModule,
    RangesModule,
    SyncModule,
    ZoomModule,

    OrdinalTimeAxisModule,
    TimeAxisModule,
    NumberAxisModule,
];
