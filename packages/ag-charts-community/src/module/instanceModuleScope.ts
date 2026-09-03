import { type ModuleDefinition, ModuleRegistry, type ModuleScope, ModuleType } from 'ag-charts-core';
import type { AgChartModule, AgChartModuleDefinition } from 'ag-charts-types';

const MODULE_TYPES = new Set<string>(Object.values(ModuleType));

// The public module type names only the identifying fields; the runtime objects are full definitions.
function isModuleDefinition(module: unknown): module is ModuleDefinition {
    const def = module as Partial<AgChartModuleDefinition> | null;
    return (
        typeof def === 'object' &&
        def != null &&
        typeof def.type === 'string' &&
        MODULE_TYPES.has(def.type) &&
        typeof def.name === 'string' &&
        typeof def.version === 'string'
    );
}

/** Resolves the scope for the `modules` passed to `AgCharts.create()`, rejecting anything that is not a module. */
export function resolveInstanceModuleScope(modules?: AgChartModule[]): ModuleScope {
    const definitions: ModuleDefinition[] = [];
    for (const module of modules?.flat() ?? []) {
        if (!isModuleDefinition(module)) {
            throw new Error(
                'AG Charts - `modules` must contain modules exported by ag-charts-community or ag-charts-enterprise, ' +
                    `such as LineSeriesModule; received ${JSON.stringify(module)}.`
            );
        }
        definitions.push(module);
    }
    return ModuleRegistry.resolveModuleScope(definitions);
}
