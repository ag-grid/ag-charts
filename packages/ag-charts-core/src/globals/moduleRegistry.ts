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
        if (definition.type === moduleType) {
            yield definition as ModuleTypeSwitch<T>;
        }
    }
}

export function detectChartDefinition(options: object): ChartModuleDefinition<any> {
    for (const definition of registeredModules.values()) {
        if (isChartModule(definition) && definition.detect(options)) {
            return definition;
        }
    }
    throw new Error(
        `AG Charts - Unknown chart type; Check options are correctly structured and series types are specified`
    );
}

export function getAxisModule(moduleName: string): AxisModuleDefinition<any> | undefined {
    const definition = registeredModules.get(moduleName);
    if (isAxisModule(definition)) {
        return definition;
    }
}

export function getPresetModule(moduleName: string): PresetModuleDefinition<any> | undefined {
    const definition = registeredModules.get(moduleName);
    if (isPresetModule(definition)) {
        return definition;
    }
}

export function getSeriesModule(moduleName: string): SeriesModuleDefinition<any> | undefined {
    const definition = registeredModules.get(moduleName);
    if (isSeriesModule(definition)) {
        return definition;
    }
}

function isAxisModule(definition?: ModuleDefinition): definition is AxisModuleDefinition<any> {
    return definition?.type === ModuleType.Axis;
}

function isChartModule(definition?: ModuleDefinition): definition is ChartModuleDefinition<any> {
    return definition?.type === ModuleType.Chart;
}

function isPresetModule(definition?: ModuleDefinition): definition is PresetModuleDefinition<any> {
    return definition?.type === ModuleType.Preset;
}

function isSeriesModule(definition?: ModuleDefinition): definition is SeriesModuleDefinition<any> {
    return definition?.type === ModuleType.Series;
}
