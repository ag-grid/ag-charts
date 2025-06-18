import { Logger } from 'ag-charts-core';

import {
    type AxisModuleDefinition,
    type ChartModuleDefinition,
    type ModuleDefinition,
    ModuleType,
    type ModuleTypeSwitch,
    type PresetModuleDefinition,
    type SeriesModuleDefinition,
} from '../interfaces/moduleDefinition';

const registeredModules: Map<string, { def: ModuleDefinition; version: string }> = new Map();

export function register(definition: ModuleDefinition, version: string): void {
    // Allow enterprise modules to overwrite community modules definition.
    const { def: existingDefinition, version: existingVersion } = registeredModules.get(definition.name) ?? {};

    if (!existingDefinition) {
        // New registration case.
        registeredModules.set(definition.name, { def: definition, version });
        return;
    }

    if (!existingDefinition.enterprise && definition.enterprise && version === existingVersion) {
        // Enterprise module overwriting community module case.
        registeredModules.set(definition.name, { def: definition, version });
        return;
    }

    // Module already registered with the same version - work out appropriate error handling.
    if (existingVersion === version) {
        // Probably due to duplicate module loading - users should be aware of this because it's not a good idea.
        Logger.warn(
            `AG Charts - Module '${definition.name}' already registered, ignoring (version: ${existingVersion})`
        );
        return;
    }

    // Module already registered with a different version - this is a problem with the users NPM dependencies.
    throw new Error(
        [
            `AG Charts - Module '${definition.name}' already registered with different version: ${existingVersion} vs, ${version}`,
            ``,
            `Check your package.json for conflicting dependencies - depending on your package manager, one of these commands may help:`,
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

export function* listModulesByType<T extends ModuleType>(moduleType: T): Generator<ModuleTypeSwitch<T>> {
    for (const definition of registeredModules.values()) {
        if (isModuleType(moduleType, definition.def)) {
            yield definition.def;
        }
    }
}

export function detectChartDefinition(options: object): ChartModuleDefinition<any> {
    for (const definition of registeredModules.values()) {
        if (isModuleType(ModuleType.Chart, definition.def) && definition.def.detect(options)) {
            return definition.def;
        }
    }
    throw new Error(
        `AG Charts - Unknown chart type; Check options are correctly structured and series types are specified`
    );
}

export function getAxisModule(moduleName: string): AxisModuleDefinition<any> | undefined {
    const definition = registeredModules.get(moduleName);
    if (isModuleType(ModuleType.Axis, definition?.def)) {
        return definition?.def;
    }
}

export function getPresetModule(moduleName: string): PresetModuleDefinition<any> | undefined {
    const definition = registeredModules.get(moduleName);
    if (isModuleType(ModuleType.Preset, definition?.def)) {
        return definition?.def;
    }
}

export function getSeriesModule(moduleName: string): SeriesModuleDefinition<any> | undefined {
    const definition = registeredModules.get(moduleName);
    if (isModuleType(ModuleType.Series, definition?.def)) {
        return definition?.def;
    }
}

function isModuleType<T extends ModuleType>(
    moduleType: T,
    definition: ModuleDefinition | undefined
): definition is ModuleTypeSwitch<T> {
    return definition?.type === moduleType;
}
