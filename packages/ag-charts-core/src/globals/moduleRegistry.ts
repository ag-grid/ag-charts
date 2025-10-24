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

interface ModuleState {
    def: ModuleDefinition;
    version: string;
}

const registeredModules: Map<string, ModuleState> = new Map();

export function register(
    def:
        | ModuleDefinition
        | ChartModuleDefinition<any>
        | AxisModuleDefinition<any>
        | SeriesModuleDefinition<any>
        | PresetModuleDefinition<any>
        | PluginModuleDefinition<any>
        | AxisPluginModuleDefinition<any>
        | SeriesPluginModuleDefinition<any>,
    version: string
): void {
    // Allow enterprise modules to overwrite community modules def.
    const { def: existingDefinition, version: existingVersion } = registeredModules.get(def.name) ?? {};

    if (!existingDefinition) {
        // New registration case.
        registeredModules.set(def.name, { def, version });
        return;
    }

    if (existingVersion === version) {
        // Enterprise module overwriting community module case.
        if (!existingDefinition.enterprise && def.enterprise) {
            registeredModules.set(def.name, { def, version });
        }
        return; // Module already registered with the same version - ignore.
    }

    // Module already registered with a different version - this is a problem with the users NPM dependencies.
    throw new Error(
        [
            `AG Charts - Module '${def.name}' already registered with different version:`,
            `${existingVersion} vs ${version}`,
            ``,
            `Check your package.json for conflicting dependencies - depending on your package manager`,
            `one of these commands may help:`,
            `- npm ls ag-charts-community`,
            `- yarn why ag-charts-community`,
        ].join('\n')
    );
}

export function registerMany(definitions: ModuleDefinition[], version: string): void {
    for (const definition of definitions) {
        register(definition, version);
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
        yield definition.def;
    }
}

export function* listModulesByType<T extends ModuleType>(moduleType: T): Generator<ModuleTypeSwitch<T>> {
    for (const definition of registeredModules.values()) {
        if (isModuleType(moduleType, definition.def)) {
            yield definition.def;
        }
    }
}

export function getAxisModule(moduleName: string): AxisModuleDefinition<any> | undefined {
    const definition = registeredModules.get(moduleName);
    if (isModuleType(ModuleType.Axis, definition?.def)) {
        return definition.def;
    }
}

export function getChartModule(moduleName: string): ChartModuleDefinition<any> {
    const definition = registeredModules.get(moduleName);
    if (isModuleType(ModuleType.Chart, definition?.def)) {
        return definition.def;
    }
    throw new Error(
        `AG Charts - Unknown chart type; Check options are correctly structured and series types are specified`
    );
}

export function getPresetModule(moduleName: string): PresetModuleDefinition<any> | undefined {
    const definition = registeredModules.get(moduleName);
    if (isModuleType(ModuleType.Preset, definition?.def)) {
        return definition.def;
    }
}

export function getSeriesModule(moduleName: string): SeriesModuleDefinition<any> | undefined {
    const definition = registeredModules.get(moduleName);
    if (isModuleType(ModuleType.Series, definition?.def)) {
        return definition.def;
    }
}

export function hasEnterpriseModules(): boolean {
    for (const { def } of registeredModules.values()) {
        if (def.enterprise) return true;
    }
    return false;
}

export function isModuleType<T extends ModuleType>(
    moduleType: T,
    definition: ModuleDefinition | undefined
): definition is ModuleTypeSwitch<T> {
    return definition?.type === moduleType;
}
