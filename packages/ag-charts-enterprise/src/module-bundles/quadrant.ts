import {
    LogAxisModule,
    NumberAxisModule,
    ScatterSeriesModule,
    TimeAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';
import type { ModuleDefinition } from 'ag-charts-core';
import {
    AnimationModule,
    AnnotationsModule,
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
} from 'ag-charts-enterprise';

import { ScatterQuadrantPresetModule } from '../preset/scatter-quadrant/scatterQuadrantPresetModule';

export const QuadrantChartModule: ModuleDefinition[] = [
    ScatterQuadrantPresetModule,

    // Axes
    NumberAxisModule,
    LogAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,

    // Series
    ScatterSeriesModule,

    // Features
    AnimationModule,
    AnnotationsModule,
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
