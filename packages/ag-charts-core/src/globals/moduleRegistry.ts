import {
    type AxisModuleDefinition,
    type ChartModuleDefinition,
    type ModuleDefinition,
    ModuleType,
    type ModuleTypeSwitch,
    type PresetModuleDefinition,
    type SeriesModuleDefinition,
} from '../interfaces/moduleDefinition';

const registeredModules: Map<string, ModuleDefinition> = new Map();

export function register(definition: ModuleDefinition): void {
    // Allow enterprise modules to overwrite community modules definition.
    const existingDefinition = registeredModules.get(definition.name);
    if (existingDefinition && (existingDefinition.enterprise || !definition.enterprise)) {
        throw new Error(`AG Charts - Module '${definition.name}' already registered`);
    }
    registeredModules.set(definition.name, definition);
}

export function registerMany(definitions: ModuleDefinition[]): void {
    for (const definition of definitions) {
        register(definition);
    }
}

export function reset(): void {
    registeredModules.clear();
}

export function hasModule(moduleName: string): boolean {
    return registeredModules.has(moduleName);
}

export function* listModulesByType<T extends ModuleType>(moduleType: T): Generator<ModuleTypeSwitch<T>> {
    for (const definition of registeredModules.values()) {
        if (isModuleType(moduleType, definition)) {
            yield definition;
        }
    }
}

export function detectChartDefinition(options: object): ChartModuleDefinition<any> {
    for (const definition of registeredModules.values()) {
        if (isModuleType(ModuleType.Chart, definition) && definition.detect(options)) {
            return definition;
        }
    }
    throw new Error(
        `AG Charts - Unknown chart type; Check options are correctly structured and series types are specified`
    );
}

export function getAxisModule(moduleName: string): AxisModuleDefinition<any> | undefined {
    const definition = registeredModules.get(moduleName);
    if (isModuleType(ModuleType.Axis, definition)) {
        return definition;
    }
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

function isModuleType<T extends ModuleType>(
    moduleType: T,
    definition: ModuleDefinition | undefined
): definition is ModuleTypeSwitch<T> {
    return definition?.type === moduleType;
}
