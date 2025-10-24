import type { ModuleDefinition } from 'ag-charts-core';

import { StandaloneChartModule } from '../charts/standaloneChartModule';
import { AnimationModule } from '../features/animation/animationModule';
import { BackgroundModule } from '../features/background/backgroundModule';
import { ContextMenuModule } from '../features/context-menu/contextMenuModule';
import { DataSourceModule } from '../features/data-source/dataSourceModule';
import { ForegroundModule } from '../features/foreground/foregroundModule';
import { GradientLegendModule } from '../gradient-legend/gradientLegendModule';
import { ChordSeriesModule } from '../series/chord';
import { LinearGaugeSeriesModule } from '../series/linear-gauge/linearGaugeModule';
import { PyramidSeriesModule } from '../series/pyramid';
import { RadialGaugeSeriesModule } from '../series/radial-gauge/radialGaugeModule';
import { SankeySeriesModule } from '../series/sankey';
import { SunburstSeriesModule } from '../series/sunburst';
import { TreemapSeriesModule } from '../series/treemap';

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
