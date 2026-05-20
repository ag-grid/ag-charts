import type { ModuleInstance } from 'ag-charts-core';

export class ModuleMap<T extends ModuleInstance = ModuleInstance> {
    protected moduleMap = new Map<string, T>();
    private _version = 0;

    /**
     * Monotonic counter incremented whenever a module is added or removed. Consumers can cache
     * derived state keyed on the value and refresh when it changes — avoiding repeated map lookups
     * without needing per-module invalidation hooks.
     */
    get version(): number {
        return this._version;
    }

    modules() {
        return this.moduleMap.values();
    }

    addModule(moduleName: string, moduleInstance: T) {
        if (this.moduleMap.has(moduleName)) {
            throw new Error(`AG Charts - module already initialised: ${moduleName}`);
        }
        this.moduleMap.set(moduleName, moduleInstance);
        this._version++;
    }

    removeModule(moduleName: string) {
        if (!this.moduleMap.has(moduleName)) return;
        this.moduleMap.get(moduleName)?.destroy?.();
        this.moduleMap.delete(moduleName);
        this._version++;
    }

    getModule<R = T>(moduleName: string): R | undefined {
        return this.moduleMap.get(moduleName) as R | undefined;
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
