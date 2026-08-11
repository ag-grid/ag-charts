import { AllCommunityModule } from 'ag-charts-community';
import type { ModuleDefinition } from 'ag-charts-core';

import { BackgroundRegionsModule } from '../features/background-regions/backgroundRegionsModule';
import { ChordSeriesModule } from '../series/chord/chordModule';
import { OrganizationSeriesModule } from '../series/organization/organizationSeriesModule';
import { PyramidSeriesModule } from '../series/pyramid/pyramidModule';
import { SankeySeriesModule } from '../series/sankey/sankeyModule';
import { SunburstSeriesModule } from '../series/sunburst/sunburstModule';
import { TreemapSeriesModule } from '../series/treemap/treemapModule';
import { AllCartesianModule } from './cartesian';
import { FinancialChartModule } from './financial';
import { AllGaugeModule } from './gauge';
import { AllPolarModule } from './polar';
import { QuadrantChartModule } from './quadrant';
import { AllMapSeriesModule } from './topology';

export const AllEnterpriseModule: ModuleDefinition[] = [
    AllCommunityModule,

    AllCartesianModule,
    AllPolarModule,
    AllMapSeriesModule,
    AllGaugeModule,
    FinancialChartModule,
    QuadrantChartModule,

    BackgroundRegionsModule,

    ChordSeriesModule,
    OrganizationSeriesModule,
    PyramidSeriesModule,
    SankeySeriesModule,
    SunburstSeriesModule,
    TreemapSeriesModule,
].flat();
