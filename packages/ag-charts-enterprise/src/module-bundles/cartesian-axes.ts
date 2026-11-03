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

/** @deprecated v14.3.0 Register `AllEnterpriseModule`, or the individual modules you need. */
export const AllCartesianAxesModule: ModuleDefinition[] = [
    NumberAxisModule,
    LogAxisModule,
    TimeAxisModule,
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    UnitTimeAxisModule,
    OrdinalTimeAxisModule,
];
