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
        return this.detectDefinition(ModuleType.Chart, options) as ChartModuleDefinition;
    }

    static detectSeriesDefinition(options: object): SeriesModuleDefinition {
        return this.detectDefinition(ModuleType.Series, options) as SeriesModuleDefinition;
    }

    private static detectDefinition(moduleType: ModuleType, options: object): ModuleDefinition {
        for (const definition of this.registeredModules.values()) {
            if (definition.type === moduleType && definition.detect(options)) {
                return definition;
            }
        }
        throw new Error(
            `AG Charts - Unknown ${moduleType} type; Check options are correctly structured and series types are specified`
        );
    }
}
