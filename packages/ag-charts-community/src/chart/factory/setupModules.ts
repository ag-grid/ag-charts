import { type ModuleDefinition, ModuleRegistry } from 'ag-charts-core';

import { ExpectedModules } from './expectedModules';

export const verifiedModules = new Set<string>();

export function setupModules() {
    for (const m of ModuleRegistry.listModules()) {
        if (m.enterprise && !verifyIfModuleExpected(m)) {
            throw new ReferenceError(`Unexpected enterprise module registered: ${m.name}`);
        }
    }

    function verifyIfModuleExpected(module: ModuleDefinition) {
        if (!module.enterprise) {
            throw new Error('AG Charts - internal configuration error, only enterprise modules need verification.');
        }
        for (const s of ExpectedModules) {
            if (s.type === module.type && s.name === module.name) {
                verifiedModules.add(s.name);
                return true;
            }
        }
        return false;
    }
}
