import type { AxisModule } from './axisModule';
import type { ModuleInstance } from './baseModule';
import type { LegendModule, RootModule, SeriesModule } from './coreModules';
import type { AxisOptionModule } from './optionsModule';
import type { SeriesOptionModule } from './optionsModuleTypes';
export type Module<M extends ModuleInstance = ModuleInstance> = RootModule<M> | AxisModule | AxisOptionModule | LegendModule | SeriesModule<any, any> | SeriesOptionModule;
export declare abstract class BaseModuleInstance {
    protected readonly destroyFns: (() => void)[];
    destroy(): void;
}
declare class ModuleRegistry {
    readonly modules: Module[];
    private readonly dependencies;
    private readonly dependents;
    register(...modules: Module[]): void;
    hasEnterpriseModules(): boolean;
    byType<T extends Module>(...types: Module['type'][]): Generator<T>;
    private registerDependencies;
}
export declare const moduleRegistry: ModuleRegistry;
export {};
