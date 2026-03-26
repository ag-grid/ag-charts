import { AllCartesianAxesModule as AllCommunityCartesianAxesModule } from 'ag-charts-community';
import type { ModuleDefinition } from 'ag-charts-core';

import { OrdinalTimeAxisModule } from '../axes/ordinal/ordinalTimeAxisModule';

export const AllCartesianAxesModule: ModuleDefinition[] = [
    AllCommunityCartesianAxesModule,
    OrdinalTimeAxisModule,
].flat();
