import { BubbleSeriesModule, NumberAxisModule, ScatterSeriesModule } from 'ag-charts-community';
import type { ModuleDefinition } from 'ag-charts-core';

import { AnimationModule } from '../features/animation/animationModule';
import { AnnotationsModule } from '../features/annotations/annotationsModule';
import { BackgroundRegionsModule } from '../features/background-regions/backgroundRegionsModule';
import { BandHighlightModule } from '../features/band-highlight/bandHighlightModule';
import { ContextMenuModule } from '../features/context-menu/contextMenuModule';
import { CrosshairModule } from '../features/crosshair/crosshairModule';
import { SelectionModule } from '../features/data-selection/dataSelectionModule';
import { DataSourceModule } from '../features/data-source/dataSourceModule';
import { NavigatorModule } from '../features/navigator/navigatorModule';
import { RangesModule } from '../features/ranges/rangesModule';
import { SyncModule } from '../features/sync/syncModule';
import { ZoomModule } from '../features/zoom/zoomModule';
import { GradientLegendModule } from '../gradient-legend/gradientLegendModule';
import { ScatterQuadrantPresetModule } from '../preset/scatter-quadrant/scatterQuadrantPresetModule';

export const QuadrantChartModule: ModuleDefinition[] = [
    ScatterQuadrantPresetModule,

    // Axes
    NumberAxisModule,

    // Series
    BubbleSeriesModule,
    ScatterSeriesModule,

    // Features
    AnimationModule,
    AnnotationsModule,
    BackgroundRegionsModule,
    BandHighlightModule,
    ContextMenuModule,
    CrosshairModule,
    DataSourceModule,
    GradientLegendModule,
    NavigatorModule,
    RangesModule,
    SelectionModule,
    SyncModule,
    ZoomModule,
];
