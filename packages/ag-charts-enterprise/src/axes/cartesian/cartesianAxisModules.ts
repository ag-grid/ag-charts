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

// Same name and version as the community definition, so registering it replaces the community one.
// The copy carries no community identity mark, so a chart using it is licensed as enterprise.
function withAxisInteraction<T extends AxisModuleDefinition<any, any>>(module: T): T {
    return {
        ...module,
        enterprise: true,
        dependencies: [...(module.dependencies ?? []), AxisInteractionModule],
    };
}

export const CategoryAxisModule = /* #__PURE__ */ withAxisInteraction(CommunityCategoryAxisModule);
export const GroupedCategoryAxisModule = /* #__PURE__ */ withAxisInteraction(CommunityGroupedCategoryAxisModule);
export const LogAxisModule = /* #__PURE__ */ withAxisInteraction(CommunityLogAxisModule);
export const NumberAxisModule = /* #__PURE__ */ withAxisInteraction(CommunityNumberAxisModule);
export const TimeAxisModule = /* #__PURE__ */ withAxisInteraction(CommunityTimeAxisModule);
export const UnitTimeAxisModule = /* #__PURE__ */ withAxisInteraction(CommunityUnitTimeAxisModule);
