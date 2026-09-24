import {
    CategoryAxisModule as CommunityCategoryAxisModule,
    GroupedCategoryAxisModule as CommunityGroupedCategoryAxisModule,
    LogAxisModule as CommunityLogAxisModule,
    NumberAxisModule as CommunityNumberAxisModule,
    TimeAxisModule as CommunityTimeAxisModule,
    UnitTimeAxisModule as CommunityUnitTimeAxisModule,
} from 'ag-charts-community';
import type { AxisModuleDefinition } from 'ag-charts-core';

import { AxisInteractionModule } from '../../features/axis-interaction/axisInteractionModule';
import { BackgroundRegionsModule } from '../../features/background-regions/backgroundRegionsModule';

// Same name and version as the community definition, so registering it replaces the community one.
// The copy carries no community identity mark, so a chart using it is licensed as enterprise.
function withCartesianFeatures<T extends AxisModuleDefinition<any, any>>(module: T): T {
    return {
        ...module,
        enterprise: true,
        dependencies: [...(module.dependencies ?? []), AxisInteractionModule, BackgroundRegionsModule],
    };
}

export const CategoryAxisModule: typeof CommunityCategoryAxisModule =
    /* #__PURE__ */ withCartesianFeatures(CommunityCategoryAxisModule);
export const GroupedCategoryAxisModule: typeof CommunityGroupedCategoryAxisModule =
    /* #__PURE__ */ withCartesianFeatures(CommunityGroupedCategoryAxisModule);
export const LogAxisModule: typeof CommunityLogAxisModule =
    /* #__PURE__ */ withCartesianFeatures(CommunityLogAxisModule);
export const NumberAxisModule: typeof CommunityNumberAxisModule =
    /* #__PURE__ */ withCartesianFeatures(CommunityNumberAxisModule);
export const TimeAxisModule: typeof CommunityTimeAxisModule =
    /* #__PURE__ */ withCartesianFeatures(CommunityTimeAxisModule);
export const UnitTimeAxisModule: typeof CommunityUnitTimeAxisModule =
    /* #__PURE__ */ withCartesianFeatures(CommunityUnitTimeAxisModule);
