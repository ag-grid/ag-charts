import {
    type ChartModuleDefinition,
    type ModuleDefinition,
    ModuleType,
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

export function detectChartDefinition(options: object): ChartModuleDefinition {
    for (const definition of registeredModules.values()) {
        if (isChartModule(definition) && definition.detect(options)) {
            return definition;
        }
    }
    throw new Error(
        `AG Charts - Unknown chart type; Check options are correctly structured and series types are specified`
    );
}

export function detectSeriesDefinition(options: { type: string }): SeriesModuleDefinition<any> {
    for (const definition of registeredModules.values()) {
        if (isSeriesModule(definition) && definition.name === options.type) {
            return definition;
        }
    }
    throw new Error(
        `AG Charts - Unknown series type; Check options are correctly structured and series types are specified`
    );
}

function isChartModule(definition: ModuleDefinition): definition is ChartModuleDefinition {
    return definition.type === ModuleType.Chart;
}

function isSeriesModule(definition: ModuleDefinition): definition is SeriesModuleDefinition<any> {
    return definition.type === ModuleType.Series;
}

// function isFeatureModule(definition: ModuleDefinition): definition is FeatureModuleDefinition {
//     return definition.type === ModuleType.Feature;
// }
