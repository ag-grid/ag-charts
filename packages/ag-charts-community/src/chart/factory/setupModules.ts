import { ModuleRegistry } from 'ag-charts-core';

import { ExpectedModules } from './expectedModules';

export function setupModules() {
    const moduleToTypeMap = new Map(ExpectedModules.map((m) => [m.name, m.type]));

    for (const m of ModuleRegistry.listModules()) {
        if (m.enterprise && moduleToTypeMap.get(m.name) !== m.type) {
            throw new ReferenceError(`Unexpected enterprise module registered: ${m.name}`);
        }
    }
}
