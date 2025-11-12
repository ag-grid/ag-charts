import type { ModuleDefinition } from 'ag-charts-core';

import { AngleCategoryAxisModule } from '../axes/angle-category/angleCategoryAxisModule';
import { AngleNumberAxisModule } from '../axes/angle-number/angleNumberAxisModule';
import { RadiusCategoryAxisModule } from '../axes/radius-category/radiusCategoryAxisModule';
import { RadiusNumberAxisModule } from '../axes/radius-number/radiusNumberAxisModule';
import { AnimationModule } from '../features/animation/animationModule';
import { BackgroundModule } from '../features/background/backgroundModule';
import { ContextMenuModule } from '../features/context-menu/contextMenuModule';
import { DataSourceModule } from '../features/data-source/dataSourceModule';
import { ForegroundModule } from '../features/foreground/foregroundModule';
import { GradientLegendModule } from '../gradient-legend/gradientLegendModule';
import { NightingaleSeriesModule } from '../series/nightingale/nightingaleModule';
import { RadarAreaSeriesModule } from '../series/radar-area/radarAreaModule';
import { RadarLineSeriesModule } from '../series/radar-line/radarLineModule';
import { RadialBarSeriesModule } from '../series/radial-bar/radialBarModule';
import { RadialColumnSeriesModule } from '../series/radial-column/radialColumnModule';

export const AllPolarEnterpriseModules: ModuleDefinition[] = [
    AngleNumberAxisModule,
    AngleCategoryAxisModule,
    RadiusNumberAxisModule,
    RadiusCategoryAxisModule,
    NightingaleSeriesModule,
    RadarAreaSeriesModule,
    RadarLineSeriesModule,
    RadialBarSeriesModule,
    RadialColumnSeriesModule,
    AnimationModule,
    BackgroundModule,
    ContextMenuModule,
    DataSourceModule,
    ForegroundModule,
    GradientLegendModule,
];
