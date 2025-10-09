import { type ModuleInstance } from 'ag-charts-core';

export class ModuleMap<T extends ModuleInstance = ModuleInstance> {
    protected moduleMap = new Map<string, T>();

    modules() {
        return this.moduleMap.values();
    }

    addModule(moduleName: string, moduleInstance: T) {
        if (this.moduleMap.has(moduleName)) {
            throw new Error(`AG Charts - module already initialised: ${moduleName}`);
        }
        this.moduleMap.set(moduleName, moduleInstance);
    }

    removeModule(moduleName: string) {
        this.moduleMap.get(moduleName)?.destroy?.();
        this.moduleMap.delete(moduleName);
    }

    getModule(moduleName: string) {
        return this.moduleMap.get(moduleName);
    }

    isEnabled(moduleName: string) {
        return this.moduleMap.has(moduleName);
    }

    mapModules<R>(callback: (value: T, index: number) => R) {
        return Array.from(this.moduleMap.values(), callback);
    }

    destroy() {
        for (const moduleInstance of this.moduleMap.values()) {
            // TODO: make sure we don't have "fake" plugins/modules with no module instance
            moduleInstance?.destroy?.();
        }
        this.moduleMap.clear();
    }
}
