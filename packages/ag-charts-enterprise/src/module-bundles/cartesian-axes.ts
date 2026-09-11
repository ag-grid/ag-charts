import type { ModuleDefinition } from 'ag-charts-core';

import {
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    LogAxisModule,
    NumberAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
} from '../axes/cartesian/cartesianAxisModules';
import { OrdinalTimeAxisModule } from '../axes/ordinal/ordinalTimeAxisModule';

export const AllCartesianAxesModule: ModuleDefinition[] = [
    NumberAxisModule,
    LogAxisModule,
    TimeAxisModule,
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    UnitTimeAxisModule,
    OrdinalTimeAxisModule,
];
