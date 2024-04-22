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

class ModuleRegistry {
    readonly modules: Module[] = [];

    private readonly dependencies: Set<string> = new Set();
    private readonly dependents: Set<string> = new Set();

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
        for (const module of this.modules) {
            if (types.includes(module.type) && this.dependencies.has(module.optionsKey)) {
                yield module as T;
            }
        }

        for (const module of this.modules) {
            if (
                types.includes(module.type) &&
                !this.dependencies.has(module.optionsKey) &&
                !this.dependents.has(module.optionsKey)
            ) {
                yield module as T;
            }
        }

        for (const module of this.modules) {
            if (types.includes(module.type) && this.dependents.has(module.optionsKey)) {
                yield module as T;
            }
        }
    }

    private registerDependencies(module: Module) {
        if (module.dependencies == null || module.dependencies.length === 0) return;

        if (this.dependencies.has(module.optionsKey)) {
            throw new Error(
                `Module [${module.optionsKey}] can not both be depended upon by any module and have dependencies of [${module.dependencies}].`
            );
        }

        for (const dep of module.dependencies) {
            if (this.dependents.has(dep)) {
                throw new Error(
                    `Module [${dep}] can not both be depended upon by any module and have dependencies of [${module.optionsKey}].`
                );
            }
            this.dependencies.add(dep);
        }

        this.dependents.add(module.optionsKey);
    }
}

export const moduleRegistry = new ModuleRegistry();
