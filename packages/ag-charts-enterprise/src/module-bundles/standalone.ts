import type { ModuleDefinition } from 'ag-charts-core';

import { StandaloneChartModule } from '../charts/standaloneChartModule';
import { AnimationModule } from '../features/animation/animationModule';
import { BackgroundModule } from '../features/background/backgroundModule';
import { ContextMenuModule } from '../features/context-menu/contextMenuModule';
import { DataSourceModule } from '../features/data-source/dataSourceModule';
import { ForegroundModule } from '../features/foreground/foregroundModule';
import { GradientLegendModule } from '../gradient-legend/gradientLegendModule';
import { ChordSeriesModule } from '../series/chord/chordModule';
import { LinearGaugeSeriesModule } from '../series/linear-gauge/linearGaugeModule';
import { PyramidSeriesModule } from '../series/pyramid/pyramidModule';
import { RadialGaugeSeriesModule } from '../series/radial-gauge/radialGaugeModule';
import { SankeySeriesModule } from '../series/sankey/sankeyModule';
import { SunburstSeriesModule } from '../series/sunburst/sunburstModule';
import { TreemapSeriesModule } from '../series/treemap/treemapModule';

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
