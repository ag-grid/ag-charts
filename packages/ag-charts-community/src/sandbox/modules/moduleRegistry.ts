import type { Module, ModuleType } from '../types/moduleTypes';

export class ModuleRegistry {
    private readonly modules = new Map<string, Module>();
    private readonly axisIds = new Set<string>();
    private readonly seriesIds = new Set<string>();

    registerModules(...modules: Module[]) {
        for (const module of modules) {
            if (module.type === 'axis') {
                this.axisIds.add(module.identifier);
            } else if (module.type === 'series') {
                this.seriesIds.add(module.identifier);
            }
            this.modules.set(module.identifier, module);
        }
    }

    getModule(moduleId: string): Module | undefined {
        return this.modules.get(moduleId);
    }

    createInstance(moduleId: string) {
        return this.modules.get(moduleId)?.constructor.createInstance();
    }

    get axisType() {
        return this.axisIds.values();
    }

    get seriesType() {
        return this.seriesIds.values();
    }

    *byType(moduleType: ModuleType): Generator<Module> {
        for (const module of this.modules.values()) {
            if (module.type == moduleType) {
                yield module;
            }
        }
    }
}
