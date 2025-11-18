import type { ModuleDefinition } from 'ag-charts-core';

import { CategoryAxisModule } from '../module/axis-modules/categoryAxisModule';
import { GroupedCategoryAxisModule } from '../module/axis-modules/groupedCategoryAxisModule';
import { LogAxisModule } from '../module/axis-modules/logAxisModule';
import { NumberAxisModule } from '../module/axis-modules/numberAxisModule';
import { TimeAxisModule } from '../module/axis-modules/timeAxisModule';
import { UnitTimeAxisModule } from '../module/axis-modules/unitTimeAxisModule';

export const AllCartesianAxesModule: ModuleDefinition[] = [
    NumberAxisModule,
    LogAxisModule,
    TimeAxisModule,
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    UnitTimeAxisModule,
];
