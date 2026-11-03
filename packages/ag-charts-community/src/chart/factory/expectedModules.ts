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
    if (expectedModuleNamesById == null) {
        expectedModuleNamesById = new Map();
        // Internal modules follow the exported ones and share their ids, so the first entry owns an id.
        for (const { moduleId: id, name } of ExpectedModules.values()) {
            if (!expectedModuleNamesById.has(id)) expectedModuleNamesById.set(id, name);
        }
    }
    return expectedModuleNamesById.get(moduleId);
}

/** The modules to report for a missing one: its alternatives that the axis or series types in use name, else itself. */
export function narrowMissingModule(module: ModulePlaceholder, typesInUse: Iterable<unknown>): ModulePlaceholder[] {
    const { moduleId, alternativeModuleIds } = module;
    if (alternativeModuleIds == null) return [module];
    const named = new Set<string>();
    for (const type of typesInUse) {
        const id = typeof type === 'string' ? ExpectedModules.get(type)?.moduleId : undefined;
        if (id != null && (id === moduleId || alternativeModuleIds.includes(id))) named.add(id);
    }
    if (named.size === 0) return [module];
    return Array.from(named, (id) => ({ ...module, moduleId: id, alternativeModuleIds: undefined }));
}
