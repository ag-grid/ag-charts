import type { ModuleType, OptionsContribution } from 'ag-charts-core';

import type { ChartType } from '../chartType';

/** What community knows about a module it may not have registered: enough to report and strip its options. */
export interface ModulePlaceholder {
    type: `${ModuleType}` | ModuleType;
    name: string;
    moduleId: string;
    chartType?: ChartType;
    enterprise?: boolean;
    optionsKey?: string;
    axisTypes?: readonly string[];
    seriesTypes?: readonly string[];
    /** Option locations the module owns when they differ from the ones its type implies. */
    contributes?: readonly OptionsContribution[];
    /** The public API this module is reached through, named in the missing-module warning in place of `name`. */
    apiName?: string;
}
