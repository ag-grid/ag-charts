import {
    type AxisModuleDefinition,
    type AxisPluginModuleDefinition,
    type ChartModuleDefinition,
    type ModuleDefinition,
    ModuleType,
    type ModuleTypeSwitch,
    type PluginModuleDefinition,
    type PresetModuleDefinition,
    type SeriesModuleDefinition,
    type SeriesPluginModuleDefinition,
} from './moduleDefinition';

export type RegistrableModuleDefinition =
    | ModuleDefinition
    | ChartModuleDefinition<any>
    | AxisModuleDefinition<any>
    | SeriesModuleDefinition<any>
    | PresetModuleDefinition<any>
    | PluginModuleDefinition<any>
    | AxisPluginModuleDefinition<any>
    | SeriesPluginModuleDefinition<any>;

/**
 * Opaque cache token returned by {@link ModuleScope.ifRegistryChanged}. A number for the global scope,
 * a string combining the parent and own revisions for a chart scope; callers only store and compare it.
 */
export type RegistryRevision = number | string;

export function isModuleType<T extends ModuleType>(
    moduleType: T,
    definition: ModuleDefinition | undefined
): definition is ModuleTypeSwitch<T> {
    return definition?.type === moduleType;
}

/**
 * An addressable module registry. The global registry is the root scope; a chart created with
 * `params.modules` gets a child scope whose own definitions are consulted first and which falls
 * back to its parent, so instance modules are additive over globally registered ones.
 */
export class ModuleScope {
    private readonly modules = new Map<string, ModuleDefinition>();
    private revision = 0;

    constructor(private readonly parent?: ModuleScope) {}

    private get(moduleName: string): ModuleDefinition | undefined {
        return this.modules.get(moduleName) ?? this.parent?.get(moduleName);
    }

    private registerModuleDefinition(def: ModuleDefinition): void {
        this.modules.set(def.name, def);
        this.revision++;

        if (def.dependencies) {
            for (const dependency of def.dependencies) {
                this.register(dependency);
            }
        }
    }

    register(def: RegistrableModuleDefinition): void {
        // Allow enterprise modules to overwrite community modules def.
        const existingDefinition = this.get(def.name);

        if (!existingDefinition) {
            // New registration case.
            this.registerModuleDefinition(def);
            return;
        }

        if (existingDefinition.version === def.version) {
            // Enterprise module overwriting community module case.
            if (!existingDefinition.enterprise && def.enterprise) {
                this.registerModuleDefinition(def);
            }
            return; // Module already registered with the same version - ignore.
        }

        // Module already registered with a different version - this is a problem with the users NPM dependencies.
        throw new Error(
            [
                `AG Charts - Module '${def.name}' already registered with different version:`,
                `${existingDefinition.version} vs ${def.version}`,
                ``,
                `Check your package.json for conflicting dependencies - depending on your package manager`,
                `one of these commands may help:`,
                `- npm ls ag-charts-community`,
                `- yarn why ag-charts-community`,
            ].join('\n')
        );
    }

    registerModules(definitions: Array<ModuleDefinition | ModuleDefinition[]>): void {
        for (const definition of definitions.flat()) {
            this.register(definition);
        }
    }

    reset(): void {
        this.modules.clear();
        this.revision++;
    }

    /**
     * Invokes `callback` if the registry has changed since the caller's `lastSeen` revision.
     * Returns the current revision so the caller can store it for the next call.
     *
     * Allows downstream caches that derive state from the registry contents (e.g. `ChartTheme`
     * defaults built from `listModulesByType`) to invalidate without subscribing to events or
     * re-scanning the module map on every read.
     */
    ifRegistryChanged(lastSeen: RegistryRevision, callback: () => void): RegistryRevision {
        const current = this.currentRevision();
        if (current !== lastSeen) {
            callback();
        }
        return current;
    }

    private currentRevision(): RegistryRevision {
        if (this.parent == null) return this.revision;
        return `${this.parent.currentRevision()}:${this.revision}`;
    }

    hasModule(moduleName: string): boolean {
        return this.modules.has(moduleName) || (this.parent?.hasModule(moduleName) ?? false);
    }

    *listModules(): Generator<ModuleDefinition> {
        yield* this.modules.values();
        if (this.parent == null) return;
        for (const definition of this.parent.listModules()) {
            if (!this.modules.has(definition.name)) {
                yield definition;
            }
        }
    }

    *listModulesByType<T extends ModuleType>(moduleType: T): Generator<ModuleTypeSwitch<T>> {
        for (const definition of this.listModules()) {
            if (isModuleType(moduleType, definition)) {
                yield definition;
            }
        }
    }

    getAxisModule(moduleName: string): AxisModuleDefinition<any> | undefined {
        const definition = this.get(moduleName);
        if (isModuleType(ModuleType.Axis, definition)) {
            return definition;
        }
    }

    getChartModule(moduleName: string): ChartModuleDefinition<any> {
        const definition = this.get(moduleName);
        if (isModuleType(ModuleType.Chart, definition)) {
            return definition;
        }
        throw new Error(
            `AG Charts - Unknown chart type; Check options are correctly structured and series types are specified`
        );
    }

    getPresetModule(moduleName: string): PresetModuleDefinition<any> | undefined {
        const definition = this.get(moduleName);
        if (isModuleType(ModuleType.Preset, definition)) {
            return definition;
        }
    }

    getSeriesModule(moduleName: string): SeriesModuleDefinition<any> | undefined {
        const definition = this.get(moduleName);
        if (isModuleType(ModuleType.Series, definition)) {
            return definition;
        }
    }
}

export function createModuleScope(parent?: ModuleScope): ModuleScope {
    return new ModuleScope(parent);
}
