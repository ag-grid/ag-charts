import type { BaseModule, ModuleInstance } from './baseModule';
interface Module<I extends ModuleInstance = ModuleInstance, C = {}> extends BaseModule {
    instanceConstructor: new (ctx: C) => I;
}
export declare class ModuleMap<M extends Module<I, C>, I extends ModuleInstance, C = {}> {
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
