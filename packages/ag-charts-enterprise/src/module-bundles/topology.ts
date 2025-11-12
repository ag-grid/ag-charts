import type { ModuleDefinition } from 'ag-charts-core';

import { TopologyChartModule } from '../charts/topologyChartModule';
import { AnimationModule } from '../features/animation/animationModule';
import { BackgroundModule } from '../features/background/backgroundModule';
import { ContextMenuModule } from '../features/context-menu/contextMenuModule';
import { DataSourceModule } from '../features/data-source/dataSourceModule';
import { ForegroundModule } from '../features/foreground/foregroundModule';
import { ZoomModule } from '../features/zoom/zoomModule';
import { GradientLegendModule } from '../gradient-legend/gradientLegendModule';
import { MapLineBackgroundSeriesModule } from '../series/map-line-background/mapLineBackgroundModule';
import { MapLineSeriesModule } from '../series/map-line/mapLineModule';
import { MapMarkerSeriesModule } from '../series/map-marker/mapMarkerModule';
import { MapShapeBackgroundSeriesModule } from '../series/map-shape-background/mapShapeBackgroundModule';
import { MapShapeSeriesModule } from '../series/map-shape/mapShapeModule';

export const AllTopologyEnterpriseModules: ModuleDefinition[] = [
    TopologyChartModule,
    MapLineSeriesModule,
    MapLineBackgroundSeriesModule,
    MapMarkerSeriesModule,
    MapShapeSeriesModule,
    MapShapeBackgroundSeriesModule,
    AnimationModule,
    BackgroundModule,
    ContextMenuModule,
    DataSourceModule,
    ForegroundModule,
    GradientLegendModule,
    ZoomModule,
];
