import type { BaseModule, ModuleInstance } from './baseModule';
import type { ModuleContext } from './moduleContext';

interface Module<I extends ModuleInstance = ModuleInstance, C = ModuleContext> extends BaseModule {
    instanceConstructor: new (ctx: C) => I;
}

export class ModuleMap<M extends Module<I, C>, I extends ModuleInstance, C = ModuleContext> extends Map {
    private moduleMap = new Map<string, I>();

    addModule(module: M, moduleFactory: (module: M) => I) {
        if (this.moduleMap.has(module.optionsKey)) {
            throw new Error(`AG Charts - module already initialised: ${module.optionsKey}`);
        }

        // this.set(module.optionsKey, new module.instanceConstructor(moduleContext));
        this.moduleMap.set(module.optionsKey, moduleFactory(module));
    }

    removeModule(module: M) {
        this.moduleMap.get(module.optionsKey)?.destroy();
        this.moduleMap.delete(module.optionsKey);
    }

    isModuleEnabled(module: M) {
        return this.moduleMap.has(module.optionsKey);
    }

    get modules() {
        return this.moduleMap.values();
    }

    mapValues<T>(callback: (value: I, index: number, array: I[]) => T) {
        return Array.from(this.moduleMap.values()).map(callback);
    }

    destroy() {
        for (const optionsKey of this.moduleMap.keys()) {
            this.removeModule({ optionsKey } as M);
        }
    }
}
