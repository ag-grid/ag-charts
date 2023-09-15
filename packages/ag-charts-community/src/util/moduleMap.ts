import type { BaseModule, ModuleInstance } from './module';
import type { ModuleContext } from './moduleContext';

interface Module<C extends ModuleContext, I extends ModuleInstance = ModuleInstance> extends BaseModule {
    instanceConstructor: new (ctx: C) => I;
}

export interface ModuleContextInitialiser<C extends ModuleContext> {
    createModuleContext: () => C;
}

export class ModuleMap<M extends Module<C, I>, C extends ModuleContext, I extends ModuleInstance = ModuleInstance> {
    private readonly modules: Record<string, { instance: I }> = {};
    private moduleContext?: C;
    private moduleContextInitialiser: ModuleContextInitialiser<C>;

    constructor(moduleContextInitialiser: ModuleContextInitialiser<C>) {
        this.moduleContextInitialiser = moduleContextInitialiser;
    }

    addModule(module: M) {
        if (this.modules[module.optionsKey] != null) {
            throw new Error('AG Charts - module already initialised: ' + module.optionsKey);
        }

        if (this.moduleContext == null) {
            this.moduleContext = this.moduleContextInitialiser.createModuleContext();
        }

        const moduleInstance = new module.instanceConstructor({
            ...this.moduleContext,
        });
        this.modules[module.optionsKey] = { instance: moduleInstance };

        (this as any)[module.optionsKey] = moduleInstance;
    }

    removeModule(module: M) {
        this.modules[module.optionsKey]?.instance?.destroy();
        delete this.modules[module.optionsKey];
        delete (this as any)[module.optionsKey];
    }

    isModuleEnabled(module: M) {
        return this.modules[module.optionsKey] != null;
    }
}
