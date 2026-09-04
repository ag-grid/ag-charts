import { LRUCache } from '../structures/lruCache';
import type {
    AxisModuleDefinition,
    ChartModuleDefinition,
    ModuleDefinition,
    ModuleType,
    ModuleTypeSwitch,
    PresetModuleDefinition,
    SeriesModuleDefinition,
} from './moduleDefinition';
import { ModuleScope, type RegistrableModuleDefinition, type RegistryRevision, createModuleScope } from './moduleScope';
import { clearRegistryModes } from './registryMode';

export { RegistryMode, clearRegistryModes, isEnterprise, isIntegrated, isUmd, setRegistryMode } from './registryMode';
export { ModuleScope, type RegistryRevision, isModuleType } from './moduleScope';

const globalScope = createModuleScope();

/**
 * Scopes built for `AgCharts.create(options, { modules })` calls, keyed by module set so charts passing
 * the same modules share one scope and therefore one set of derived caches. Eviction only costs that
 * sharing: a chart keeps its own reference, so an evicted scope stays valid.
 */
const instanceScopes = new LRUCache<ModuleScope>(32);
const instanceScopeKeys = new WeakMap<ModuleScope, string>();

function instanceScopeKey(definitions: ModuleDefinition[]): string {
    return definitions
        .map((def) => `${def.name}@${def.version}${def.enterprise ? ':enterprise' : ''}`)
        .sort((a, b) => a.localeCompare(b))
        .join(',');
}

/**
 * Returns the scope a chart created with the given instance `modules` should resolve against: the
 * global scope when they add nothing to it, otherwise a child scope holding them over the global registry.
 */
export function resolveModuleScope(modules?: Array<ModuleDefinition | ModuleDefinition[]>): ModuleScope {
    const definitions = modules?.flat() ?? [];
    if (definitions.length === 0) return globalScope;

    const key = instanceScopeKey(definitions);
    let scope = instanceScopes.get(key);
    if (scope == null) {
        const child = createModuleScope(globalScope);
        child.registerModules(definitions);
        scope = child.hasOwnModules ? child : globalScope;
        instanceScopes.set(key, scope);
        if (scope !== globalScope) {
            instanceScopeKeys.set(scope, key);
        }
    }
    return scope;
}

/** Whether `scope` is the global registry rather than a chart's own module scope. */
export function isGlobalScope(scope: ModuleScope): boolean {
    return scope === globalScope;
}

/** A stable identity for `scope`'s module set, empty for the global scope. */
export function getModuleScopeKey(scope: ModuleScope): string {
    return instanceScopeKeys.get(scope) ?? '';
}

/**
 * Invokes `callback` if the registry has changed since the caller's `lastSeen` revision.
 * Returns the current revision so the caller can store it for the next call.
 */
export function ifRegistryChanged(lastSeen: RegistryRevision, callback: () => void): RegistryRevision {
    return globalScope.ifRegistryChanged(lastSeen, callback);
}

export function register(def: RegistrableModuleDefinition): void {
    globalScope.register(def);
}

export function registerModules(definitions: Array<ModuleDefinition | ModuleDefinition[]>): void {
    globalScope.registerModules(definitions);
}

export function reset(): void {
    clearRegistryModes();
    globalScope.reset();
    instanceScopes.clear();
}

export function hasModule(moduleName: string): boolean {
    return globalScope.hasModule(moduleName);
}

export function listModules(): Generator<ModuleDefinition> {
    return globalScope.listModules();
}

export function listModulesByType<T extends ModuleType>(moduleType: T): Generator<ModuleTypeSwitch<T>> {
    return globalScope.listModulesByType(moduleType);
}

export function getAxisModule(moduleName: string): AxisModuleDefinition<any> | undefined {
    return globalScope.getAxisModule(moduleName);
}

export function getChartModule(moduleName: string): ChartModuleDefinition<any> {
    return globalScope.getChartModule(moduleName);
}

export function getPresetModule(moduleName: string): PresetModuleDefinition<any> | undefined {
    return globalScope.getPresetModule(moduleName);
}

export function getSeriesModule(moduleName: string): SeriesModuleDefinition<any> | undefined {
    return globalScope.getSeriesModule(moduleName);
}
