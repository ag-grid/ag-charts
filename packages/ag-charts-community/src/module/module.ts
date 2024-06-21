import type { AxisModule } from './axisModule';
import type { ModuleInstance } from './baseModule';
import type { LegendModule, RootModule, SeriesModule } from './coreModules';
import type { AxisOptionModule } from './optionsModule';
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

    private readonly dependencies: Map<string, Set<string>> = new Map();
    private readonly dependents: Map<string, Set<string>> = new Map();

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
                }
            } else {
                this.modules.push(module);
            }
        }
    }

    hasEnterpriseModules() {
        return this.modules.some((m) => m.packageType === 'enterprise');
    }

    *byType<T extends Module>(...types: Module['type'][]): Generator<T> {
        const { dependents } = this;

        const yielded = new Set();

        let count = 0;
        const maxCount = 3;

        const modulesByType = this.modules.filter((module) => types.includes(module.type));

        // Iterate through modules yielding those that have no dependencies and repeating while any modules still have
        // un-yielded dependencies. Escape out if circular or missing dependencies.
        do {
            for (const module of modulesByType) {
                if (yielded.has(module.optionsKey) || dependents.has(module.optionsKey)) {
                    continue;
                }

                yield module as T;
                yielded.add(module.optionsKey);

                for (const [key, dependencies] of dependents.entries()) {
                    dependencies.delete(module.optionsKey);
                    if (dependencies.size === 0) {
                        dependents.delete(key);
                    }
                }
            }

            count++;
        } while (yielded.size < modulesByType.length && count < maxCount);

        if (dependents.size > 0) {
            throw new Error(`Could not resolve module dependencies: [${[...dependents.keys()]}]`);
        }
    }

    private registerDependencies(module: Module) {
        if (module.dependencies == null || module.dependencies.length === 0) return;

        for (const key of module.dependencies) {
            const dependencies = this.dependencies.get(key) ?? new Set();
            dependencies.add(module.optionsKey);
            this.dependencies.set(key, dependencies);
        }

        this.dependents.set(module.optionsKey, new Set(module.dependencies));
    }
}

export const moduleRegistry = new ModuleRegistry();
