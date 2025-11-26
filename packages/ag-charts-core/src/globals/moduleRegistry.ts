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
} from '../interfaces/moduleDefinition';

const registeredModules: Map<string, ModuleDefinition> = new Map();

function registerModuleDefinition(def: ModuleDefinition): void {
    registeredModules.set(def.name, def);

    if (def.dependencies) {
        for (const dependency of def.dependencies) {
            register(dependency);
        }
    }
}

export function register(
    def:
        | ModuleDefinition
        | ChartModuleDefinition<any>
        | AxisModuleDefinition<any>
        | SeriesModuleDefinition<any>
        | PresetModuleDefinition<any>
        | PluginModuleDefinition<any>
        | AxisPluginModuleDefinition<any>
        | SeriesPluginModuleDefinition<any>
): void {
    // Allow enterprise modules to overwrite community modules def.
    const existingDefinition = registeredModules.get(def.name);

    if (!existingDefinition) {
        // New registration case.
        registerModuleDefinition(def);
        return;
    }

    if (existingDefinition.version === def.version) {
        // Enterprise module overwriting community module case.
        if (!existingDefinition.enterprise && def.enterprise) {
            registerModuleDefinition(def);
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

export function registerModules(definitions: Array<ModuleDefinition | ModuleDefinition[]>): void {
    for (const definition of definitions.flat()) {
        register(definition);
    }
}

export function reset(): void {
    registeredModules.clear();
}

export function hasModule(moduleName: string): boolean {
    return registeredModules.has(moduleName);
}

export function* listModules(): Generator<ModuleDefinition> {
    for (const definition of registeredModules.values()) {
        yield definition;
    }
}

export function* listModulesByType<T extends ModuleType>(moduleType: T): Generator<ModuleTypeSwitch<T>> {
    for (const definition of registeredModules.values()) {
        if (isModuleType(moduleType, definition)) {
            yield definition;
        }
    }
}

export function getAxisModule(moduleName: string): AxisModuleDefinition<any> | undefined {
    const definition = registeredModules.get(moduleName);
    if (isModuleType(ModuleType.Axis, definition)) {
        return definition;
    }
}

export function getChartModule(moduleName: string): ChartModuleDefinition<any> {
    const definition = registeredModules.get(moduleName);
    if (isModuleType(ModuleType.Chart, definition)) {
        return definition;
    }
    throw new Error(
        `AG Charts - Unknown chart type; Check options are correctly structured and series types are specified`
    );
}

export function getPresetModule(moduleName: string): PresetModuleDefinition<any> | undefined {
    const definition = registeredModules.get(moduleName);
    if (isModuleType(ModuleType.Preset, definition)) {
        return definition;
    }
}

export function getSeriesModule(moduleName: string): SeriesModuleDefinition<any> | undefined {
    const definition = registeredModules.get(moduleName);
    if (isModuleType(ModuleType.Series, definition)) {
        return definition;
    }
}

export function hasEnterpriseModules(): boolean {
    for (const definition of registeredModules.values()) {
        if (definition.enterprise) return true;
    }
    return false;
}

export function isModuleType<T extends ModuleType>(
    moduleType: T,
    definition: ModuleDefinition | undefined
): definition is ModuleTypeSwitch<T> {
    return definition?.type === moduleType;
}
