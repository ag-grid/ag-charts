import type { ModuleDefinition } from 'ag-charts-core';

import { OrdinalTimeAxisModule } from '../axes/ordinal/ordinalTimeAxisModule';
import { AnimationModule } from '../features/animation/animationModule';
import { AnnotationsModule } from '../features/annotations/annotationsModule';
import { BackgroundModule } from '../features/background/backgroundModule';
import { BandHighlightModule } from '../features/band-highlight/bandHighlightModule';
import { ChartToolbarModule } from '../features/chart-toolbar/chartToolbarModule';
import { ContextMenuModule } from '../features/context-menu/contextMenuModule';
import { CrosshairModule } from '../features/crosshair/crosshairModule';
import { DataSourceModule } from '../features/data-source/dataSourceModule';
import { ErrorBarsModule } from '../features/error-bar/errorBarModule';
import { ForegroundModule } from '../features/foreground/foregroundModule';
import { NavigatorModule } from '../features/navigator/navigatorModule';
import { RangesModule } from '../features/ranges/rangesModule';
import { StatusBarModule } from '../features/status-bar/statusBarModule';
import { SyncModule } from '../features/sync/syncModule';
import { ZoomModule } from '../features/zoom/zoomModule';
import { GradientLegendModule } from '../gradient-legend/gradientLegendModule';
import { BoxPlotSeriesModule } from '../series/box-plot';
import { CandlestickSeriesModule } from '../series/candlestick';
import { ConeFunnelSeriesModule } from '../series/cone-funnel';
import { FunnelSeriesModule } from '../series/funnel';
import { HeatmapSeriesModule } from '../series/heatmap';
import { OhlcSeriesModule } from '../series/ohlc';
import { RangeAreaSeriesModule } from '../series/range-area';
import { RangeBarSeriesModule } from '../series/range-bar';
import { WaterfallSeriesModule } from '../series/waterfall';

export const AllCartesianEnterpriseModules: ModuleDefinition[] = [
    OrdinalTimeAxisModule,
    BoxPlotSeriesModule,
    CandlestickSeriesModule,
    ConeFunnelSeriesModule,
    FunnelSeriesModule,
    HeatmapSeriesModule,
    OhlcSeriesModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    WaterfallSeriesModule,
    AnimationModule,
    AnnotationsModule,
    BackgroundModule,
    BandHighlightModule,
    ChartToolbarModule,
    ContextMenuModule,
    CrosshairModule,
    DataSourceModule,
    ErrorBarsModule,
    ForegroundModule,
    GradientLegendModule,
    NavigatorModule,
    RangesModule,
    StatusBarModule,
    SyncModule,
    ZoomModule,
];
