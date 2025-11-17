import { AllCommunityModule } from 'ag-charts-community';
import type { ModuleDefinition } from 'ag-charts-core';

import { AllCartesianModule } from './cartesian';
import { FinancialChartModule } from './financial';
import { AllGaugeModule } from './gauge';
import { AllPolarModule } from './polar';
import { AllStandaloneModule } from './standalone';
import { AllMapSeriesModule } from './topology';

export const AllEnterpriseModule: ModuleDefinition[] = [
    AllCommunityModule,
    AllCartesianModule,
    AllPolarModule,
    AllStandaloneModule,
    AllMapSeriesModule,
    AllGaugeModule,
    FinancialChartModule,
].flat();
