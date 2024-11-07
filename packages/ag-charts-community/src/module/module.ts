import type { AxisModule } from './axisModule';
import type { AxisOptionModule } from './axisOptionModule';
import type { ModuleInstance } from './baseModule';
import type { LegendModule, RootModule, SeriesModule } from './coreModules';
import type { SeriesOptionModule } from './optionsModuleTypes';

export type Module<M extends ModuleInstance = ModuleInstance> =
    | RootModule<M>
    | AxisModule
    | AxisOptionModule
    | LegendModule
    | SeriesModule<any, any>
    | SeriesOptionModule;

export abstract class BaseModuleInstance {
    protected readonly destroyFns: (() => void)[] = [];

    destroy() {
        for (const destroyFn of this.destroyFns) {
            destroyFn();
        }
    }
}

export class ModuleRegistry {
    readonly modules: Module[] = [];

    private readonly dependencies: Map<string, string[]> = new Map();
    private readonly modulesByOptionKey: Map<string, Module> = new Map();

    register(...modules: Module[]) {
        for (const module of modules) {
            this.registerDependencies(module);

            const otherModule = this.modules.find(
                (other) =>
                    module.type === other.type &&
                    module.optionsKey === other.optionsKey &&
                    module.identifier === other.identifier
            );

            if (otherModule) {
                if (module.packageType === 'enterprise' && otherModule.packageType === 'community') {
                    // Replace the community module with an enterprise version
                    const index = this.modules.indexOf(otherModule);
                    this.modules.splice(index, 1, module);
                    this.modulesByOptionKey.set(module.optionsKey, module);
                }
            } else {
                this.modules.push(module);
                this.modulesByOptionKey.set(module.optionsKey, module);
            }
        }
    }

    hasEnterpriseModules() {
        return this.modules.some((m) => m.packageType === 'enterprise');
    }

    *byType<T extends Module>(...types: Module['type'][]): Generator<T> {
        const yielded = new Set();

        const modulesByType = this.modules.filter((module) => types.includes(module.type));

        const calculateDependencies = (module: string): string[] => {
            const deps = this.dependencies.get(module);
            return deps?.flatMap(calculateDependencies).concat(deps) ?? [];
        };

        const unresolvable = [];

        // Iterate through modules yielding those that have no dependencies and repeating while any modules still have
        // un-yielded dependencies. Escape out if circular or missing dependencies.
        for (const module of modulesByType) {
            if (yielded.has(module.optionsKey)) continue;

            for (const dependency of calculateDependencies(module.optionsKey)) {
                if (yielded.has(dependency)) continue;
                const dependencyModule = this.modulesByOptionKey.get(dependency);
                if (!dependencyModule) {
                    unresolvable.push(dependency);
                    continue;
                }

                if (!types.includes(dependencyModule.type)) continue;

                yield dependencyModule as T;
                yielded.add(dependency);
            }

            yield module as T;
            yielded.add(module.optionsKey);
        }

        if (unresolvable.length > 0) {
            throw new Error(`Could not resolve module dependencies: ${unresolvable}`);
        }
    }

    private registerDependencies(module: Module) {
        if (module.dependencies == null || module.dependencies.length === 0) return;

        this.dependencies.set(module.optionsKey, module.dependencies);
    }
}

export const moduleRegistry = new ModuleRegistry();
