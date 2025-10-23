import type { ModuleDefinition } from 'ag-charts-core';

import { StandaloneChartModule } from '../charts/standaloneChartModule';
import { PyramidSeriesModule } from '../series/pyramid';
import { LinearGaugeSeriesModule } from '../series/linear-gauge/linearGaugeModule';
import { RadialGaugeSeriesModule } from '../series/radial-gauge/radialGaugeModule';
import { SunburstSeriesModule } from '../series/sunburst';
import { TreemapSeriesModule } from '../series/treemap';
import { ChordSeriesModule } from '../series/chord';
import { SankeySeriesModule } from '../series/sankey';
import { AnimationModule } from '../features/animation/animationModule';
import { BackgroundModule } from '../features/background/backgroundModule';
import { ContextMenuModule } from '../features/context-menu/contextMenuModule';
import { DataSourceModule } from '../features/data-source/dataSourceModule';
import { ForegroundModule } from '../features/foreground/foregroundModule';
import { GradientLegendModule } from '../gradient-legend/gradientLegendModule';

export const AllStandaloneEnterpriseModules: ModuleDefinition[] = [
    StandaloneChartModule,
    PyramidSeriesModule,
    LinearGaugeSeriesModule,
    RadialGaugeSeriesModule,
    SunburstSeriesModule,
    TreemapSeriesModule,
    ChordSeriesModule,
    SankeySeriesModule,
    AnimationModule,
    BackgroundModule,
    ContextMenuModule,
    DataSourceModule,
    ForegroundModule,
    GradientLegendModule,
];
