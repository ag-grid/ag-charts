import { Logger, ModuleRegistry, joinFormatted } from 'ag-charts-core';

import { getUnusedExpectedModules, verifyIfModuleExpected } from './expectedModules';

export function setupModules() {
    for (const m of ModuleRegistry.listModules()) {
        if (m.enterprise && !verifyIfModuleExpected(m)) {
            throw new ReferenceError(`Unexpected enterprise module registered: ${m.name}`);
        }
    }

    if (ModuleRegistry.hasEnterpriseModules()) {
        const expectedButUnused = getUnusedExpectedModules();
        if (expectedButUnused.size > 0) {
            Logger.errorOnce('Enterprise modules expected but not registered: ', joinFormatted([...expectedButUnused]));
        }
    }
}
