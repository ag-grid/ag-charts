import type { BaseModule, ModuleInstance } from './baseModule';

interface Module<C, I extends ModuleInstance = ModuleInstance> extends BaseModule {
    instanceConstructor: new (ctx: C) => I;
}

export interface ModuleContextInitialiser<C> {
    createModuleContext: () => C;
}

export class ModuleMap<M extends Module<C, I>, C, I extends ModuleInstance = ModuleInstance> {
    private readonly modules: Record<string, { instance: I }> = {};
    private moduleContext?: C;
    private parent: ModuleContextInitialiser<C>;

    constructor(parent: ModuleContextInitialiser<C>) {
        this.parent = parent;
    }

    destroy() {
        for (const [key, module] of Object.entries(this.modules)) {
            module.instance.destroy();
            delete this.modules[key];
            delete (this.parent as any)[key];
        }
    }

    addModule(module: M) {
        if (this.modules[module.optionsKey] != null) {
            throw new Error('AG Charts - module already initialised: ' + module.optionsKey);
        }

        if (module.optionsKey in this.parent) {
            throw new Error(`AG Charts - class already has option key '${module.optionsKey}'`);
        }

        if (this.moduleContext == null) {
            this.moduleContext = this.parent.createModuleContext();
        }

        const moduleInstance = new module.instanceConstructor({
            ...this.moduleContext,
        });
        this.modules[module.optionsKey] = { instance: moduleInstance };

        (this.parent as any)[module.optionsKey] = moduleInstance;
    }

    removeModule(module: M) {
        this.modules[module.optionsKey]?.instance?.destroy();
        delete this.modules[module.optionsKey];
        delete (this.parent as any)[module.optionsKey];
    }

    isModuleEnabled(module: M) {
        return this.modules[module.optionsKey] != null;
    }
}
