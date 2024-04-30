import type { BaseModule, ModuleInstance } from './baseModule';
import type { ModuleContext } from './moduleContext';
interface Module<I extends ModuleInstance = ModuleInstance, C = ModuleContext> extends BaseModule {
    instanceConstructor: new (ctx: C) => I;
}
export declare class ModuleMap<M extends Module<I, C>, I extends ModuleInstance, C = ModuleContext> {
    protected moduleMap: Map<string, {
        module: M;
        moduleInstance: I;
    }>;
    modules(): Generator<I, void, unknown>;
    addModule(module: M, moduleFactory: (module: M) => I): void;
    removeModule(module: M | string): void;
    getModule<R>(module: M | string): R | undefined;
    isEnabled(module: M | string): boolean;
    mapModules<T>(callback: (value: I, index: number) => T): T[];
    destroy(): void;
}
export {};
