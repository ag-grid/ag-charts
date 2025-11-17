import type { ModuleDefinition } from 'ag-charts-core';

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
import { AllCartesianAxesModule } from './cartesian-axes';
import { AllCartesianSeriesModule } from './cartesian-series';

export const AllCartesianModule: ModuleDefinition[] = [
    AllCartesianAxesModule,
    AllCartesianSeriesModule,

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
].flat();
