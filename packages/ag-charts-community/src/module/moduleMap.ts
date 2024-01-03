import { isString } from '../util/type-guards';
import type { BaseModule, ModuleInstance } from './baseModule';
import type { ModuleContext } from './moduleContext';

interface Module<I extends ModuleInstance = ModuleInstance, C = ModuleContext> extends BaseModule {
    instanceConstructor: new (ctx: C) => I;
}

export class ModuleMap<M extends Module<I, C>, I extends ModuleInstance, C = ModuleContext> {
    private moduleMap = new Map<string, I>();

    addModule(module: M, moduleFactory: (module: M) => I) {
        if (this.moduleMap.has(module.optionsKey)) {
            throw new Error(`AG Charts - module already initialised: ${module.optionsKey}`);
        }
        this.moduleMap.set(module.optionsKey, moduleFactory(module));
    }

    removeModule(module: M | string) {
        const moduleKey = isString(module) ? module : module.optionsKey;
        this.moduleMap.get(moduleKey)?.destroy();
        this.moduleMap.delete(moduleKey);
    }

    isModuleEnabled(module: M | string) {
        return this.moduleMap.has(isString(module) ? module : module.optionsKey);
    }

    getModule(module: M | string) {
        return this.moduleMap.get(isString(module) ? module : module.optionsKey);
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
