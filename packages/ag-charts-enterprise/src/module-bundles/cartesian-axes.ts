import type { ModuleDefinition } from 'ag-charts-core';

import {
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    LogAxisModule,
    NumberAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
} from '../axes/cartesian/cartesianAxisModules';
import { InsetNumberAxisModule } from '../axes/inset-number/insetNumberAxisModule';
import { OrdinalTimeAxisModule } from '../axes/ordinal/ordinalTimeAxisModule';

export const AllCartesianAxesModule: ModuleDefinition[] = [
    NumberAxisModule,
    LogAxisModule,
    TimeAxisModule,
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    UnitTimeAxisModule,
    OrdinalTimeAxisModule,
    InsetNumberAxisModule,
];
