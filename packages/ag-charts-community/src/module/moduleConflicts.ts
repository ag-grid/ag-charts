import type { AgChartOptions } from '../options/agChartOptions';

type AgChartOptionsKeys = keyof AgChartOptions;
export const MODULE_CONFLICTS: Map<AgChartOptionsKeys, AgChartOptionsKeys[]> = new Map();
export function registerModuleConflicts(source: AgChartOptionsKeys, targets: AgChartOptionsKeys[]) {
    MODULE_CONFLICTS.set(source, targets);
}
