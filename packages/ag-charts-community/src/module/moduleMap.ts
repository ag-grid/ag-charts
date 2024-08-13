import { isString } from '../util/type-guards';
import type { BaseModule, ModuleInstance } from './baseModule';

interface Module<I extends ModuleInstance = ModuleInstance, C = {}> extends BaseModule {
    moduleFactory: (ctx: C) => I;
}

export class ModuleMap<M extends Module<I, C>, I extends ModuleInstance, C = {}> {
    protected moduleMap = new Map<string, { module: M; moduleInstance: I }>();

    *modules() {
        // const sequencedModules = ['toolbar', 'navigator'];
        for (const m of this.moduleMap.values()) {
            if (m.module.dependencies) {
                console.log(m);
            }
            yield m.moduleInstance;
        }
    }

    addModule(module: M, moduleFactory: (module: M) => I) {
        if (this.moduleMap.has(module.optionsKey)) {
            throw new Error(`AG Charts - module already initialised: ${module.optionsKey}`);
        }
        this.moduleMap.set(module.optionsKey, { module, moduleInstance: moduleFactory(module) });
    }

    removeModule(module: M | string) {
        const moduleKey = isString(module) ? module : module.optionsKey;
        this.moduleMap.get(moduleKey)?.moduleInstance.destroy();
        this.moduleMap.delete(moduleKey);
    }

    getModule<R>(module: M | string): R | undefined;
    getModule(module: M | string) {
        return this.moduleMap.get(isString(module) ? module : module.optionsKey)?.moduleInstance;
    }

    isEnabled(module: M | string) {
        return this.moduleMap.has(isString(module) ? module : module.optionsKey);
    }

    mapModules<T>(callback: (value: I, index: number) => T) {
        return Array.from(this.moduleMap.values(), (m, i) => callback(m.moduleInstance, i));
    }

    destroy() {
        for (const moduleKey of this.moduleMap.keys()) {
            this.moduleMap.get(moduleKey)?.moduleInstance.destroy();
        }
        this.moduleMap.clear();
    }
}
