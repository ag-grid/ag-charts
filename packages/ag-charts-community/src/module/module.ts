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

    register(...modules: Module[]) {
        for (const module of modules) {
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
            if (types.includes(module.type)) {
                yield module as T;
            }
        }
    }
}

export const moduleRegistry = new ModuleRegistry();
