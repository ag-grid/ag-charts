import { ModuleType } from 'ag-charts-core';

import { expectedModuleTable } from './expectedModules.generated';
import type { ModulePlaceholder } from './modulePlaceholder';

export type { ModulePlaceholder } from './modulePlaceholder';

/** Every module a chart could need, keyed by registry name, so that a community bundle can report the ones it lacks. */
export const ExpectedModules = new Map<string, ModulePlaceholder>(expectedModuleTable.map((m) => [m.name, m]));

export function getSeriesExpectedChartType(seriesName: string): string | undefined {
    const expectedModule = ExpectedModules.get(seriesName);
    return expectedModule?.type === ModuleType.Series ? expectedModule.chartType : undefined;
}

let expectedModuleNamesById: Map<string, string> | undefined;

/** Resolves an exported module id such as `'LineSeriesModule'` to its registry name, if it is a known module. */
export function findExpectedModuleName(moduleId: string): string | undefined {
    expectedModuleNamesById ??= new Map(Array.from(ExpectedModules.values(), (m) => [m.moduleId, m.name]));
    return expectedModuleNamesById.get(moduleId);
}
