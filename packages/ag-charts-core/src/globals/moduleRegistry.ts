import {
    type ChartModuleDefinition,
    type ModuleDefinition,
    ModuleType,
    type SeriesModuleDefinition,
} from '../interfaces/moduleDefinition';

export class ModuleRegistry {
    private static readonly registeredModules: Map<string, ModuleDefinition> = new Map();

    static [Symbol.iterator]() {
        return this.registeredModules.values();
    }

    static register(definition: ModuleDefinition): void {
        // Allow enterprise modules to overwrite community modules definition.
        const existingDefinition = this.registeredModules.get(definition.name);
        if (existingDefinition && (existingDefinition.enterprise || !definition.enterprise)) {
            throw new Error(`AG Charts - Module '${definition.name}' already registered`);
        }
        this.registeredModules.set(definition.name, definition);
    }

    static registerMany(definitions: ModuleDefinition[]): void {
        for (const definition of definitions) {
            this.register(definition);
        }
    }

    static reset(): void {
        this.registeredModules.clear();
    }

    static detectChartDefinition(options: object): ChartModuleDefinition {
        for (const definition of this.registeredModules.values()) {
            if (this.isChartModule(definition) && definition.detect(options)) {
                return definition;
            }
        }
        throw new Error(
            `AG Charts - Unknown chart type; Check options are correctly structured and series types are specified`
        );
    }

    static detectSeriesDefinition(options: { type: string }): SeriesModuleDefinition<any> {
        for (const definition of this.registeredModules.values()) {
            if (this.isSeriesModule(definition) && definition.name === options.type) {
                return definition;
            }
        }
        throw new Error(
            `AG Charts - Unknown series type; Check options are correctly structured and series types are specified`
        );
    }

    private static isChartModule(definition: ModuleDefinition): definition is ChartModuleDefinition {
        return definition.type === ModuleType.Chart;
    }

    private static isSeriesModule(definition: ModuleDefinition): definition is SeriesModuleDefinition<any> {
        return definition.type === ModuleType.Series;
    }
}
