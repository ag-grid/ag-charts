import type { AgChartOptions } from '../options/agChartOptions';
import type { ModuleInstance } from './baseModule';
import type { AxisModule, LegendModule, RootModule, SeriesModule } from './coreModules';
import type { AxisOptionModule, SeriesOptionModule } from './optionModules';

export type Module<M extends ModuleInstance = ModuleInstance> =
    | RootModule<M>
    | AxisModule
    | AxisOptionModule
    | LegendModule
    | SeriesModule
    | SeriesOptionModule;

export abstract class BaseModuleInstance {
    protected readonly destroyFns: (() => void)[] = [];

    destroy() {
        for (const destroyFn of this.destroyFns) {
            destroyFn();
        }
    }
}

export const REGISTERED_MODULES: Module[] = [];
export function registerModule(module: Module) {
    const otherModule = REGISTERED_MODULES.find((other) => {
        return (
            module.type === other.type &&
            module.optionsKey === other.optionsKey &&
            module.identifier === other.identifier
        );
    });

    if (otherModule) {
        if (module.packageType === 'enterprise' && otherModule.packageType === 'community') {
            // Replace the community module with an enterprise version
            const index = REGISTERED_MODULES.indexOf(otherModule);
            REGISTERED_MODULES.splice(index, 1, module);
        } else {
            // Skip if the module is already registered
        }
    } else {
        // Simply register the module
        REGISTERED_MODULES.push(module);
    }
}

export function hasRegisteredEnterpriseModules() {
    return REGISTERED_MODULES.some((m) => m.packageType === 'enterprise');
}

export const MODULE_CONFLICTS: Map<keyof AgChartOptions, Array<keyof AgChartOptions>> = new Map();
export function registerModuleConflicts(source: keyof AgChartOptions, targets: Array<keyof AgChartOptions>) {
    MODULE_CONFLICTS.set(source, targets);
}
