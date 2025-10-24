import type { ModuleDefinition } from 'ag-charts-core';

import { TopologyChartModule } from '../charts/topologyChartModule';
import { AnimationModule } from '../features/animation/animationModule';
import { BackgroundModule } from '../features/background/backgroundModule';
import { ContextMenuModule } from '../features/context-menu/contextMenuModule';
import { DataSourceModule } from '../features/data-source/dataSourceModule';
import { ForegroundModule } from '../features/foreground/foregroundModule';
import { ZoomModule } from '../features/zoom/zoomModule';
import { GradientLegendModule } from '../gradient-legend/gradientLegendModule';
import { MapLineSeriesModule } from '../series/map-line';
import { MapLineBackgroundSeriesModule } from '../series/map-line-background';
import { MapMarkerSeriesModule } from '../series/map-marker';
import { MapShapeSeriesModule } from '../series/map-shape';
import { MapShapeBackgroundSeriesModule } from '../series/map-shape-background';

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
