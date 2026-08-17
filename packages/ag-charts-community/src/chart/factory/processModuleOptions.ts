import {
    type AxisPluginModuleDefinition,
    Debug,
    type Logger,
    ModuleRegistry,
    ModuleType,
    type PlainObject,
    type PluginModuleDefinition,
    type SeriesPluginModuleDefinition,
    deepClone,
    deepFreeze,
    groupBy,
    isArray,
    isDefined,
    isObject,
    unique,
} from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { ChartTheme } from '../themes/chartTheme';
import { ExpectedModules, type ModulePlaceholder } from './expectedModules';

const SkippedModules = new Set<string>(['foreground']);

let sanitizedThemeCache = new WeakMap<ChartTheme, ChartTheme>();
let sanitizedThemeCacheRevision = -1;
const sanitizedThemeCacheDebug = Debug.create(true, 'perf', 'theme');

export function sanitizeThemeModules(theme: ChartTheme): ChartTheme {
    sanitizedThemeCacheRevision = ModuleRegistry.ifRegistryChanged(sanitizedThemeCacheRevision, () => {
        sanitizedThemeCache = new WeakMap();
    });
    const cached = sanitizedThemeCache.get(theme);
    if (cached !== undefined) {
        sanitizedThemeCacheDebug('[CACHE] SanitizedTheme', 'hit');
        return cached;
    }

    sanitizedThemeCacheDebug('[CACHE] SanitizedTheme', 'miss');
    const result = sanitizeThemeModulesUncached(theme);
    sanitizedThemeCache.set(theme, result);
    return result;
}

/** Test-only: drop all cached entries so cases start from a known cold state. */
export function __clearSanitizedThemeCacheForTests() {
    sanitizedThemeCache = new WeakMap();
    sanitizedThemeCacheRevision = -1;
}

function sanitizeThemeModulesUncached(theme: ChartTheme): ChartTheme {
    const missingModules = new Map<string, Set<string>>();

    // Keys already covered by at least one registered axis-plugin module. A missing
    // module must not prune a theme key that a *different* registered module also owns
    // (e.g. `CrossLinesModule` absent should not prune `crossLines` when
    // `PolarCrossLinesModule` — which shares `optionsKey: 'crossLines'` — is present).
    const coveredAxisPluginKeys = new Set<string>(
        [...ModuleRegistry.listModulesByType(ModuleType.AxisPlugin)].map((m) => m.optionsKey ?? m.name)
    );

    for (const [name, { type, optionsKey }] of ExpectedModules) {
        if (ModuleRegistry.hasModule(name)) continue;

        // For axis-plugin modules, store the optionsKey that would be pruned from
        // theme axis configs. Skip if another registered module already covers that key.
        const pruneKey = type === ModuleType.AxisPlugin ? (optionsKey ?? name) : name;
        if (type === ModuleType.AxisPlugin && coveredAxisPluginKeys.has(pruneKey)) continue;

        if (missingModules.has(type)) {
            missingModules.get(type)!.add(pruneKey);
        } else {
            missingModules.set(type, new Set<string>([pruneKey]));
        }
    }

    if (missingModules.size === 0) return theme;

    function prunePlugins(target?: PlainObject) {
        const missingPlugins = missingModules.get(ModuleType.Plugin);
        if (!isObject(target) || !missingPlugins) return;
        for (const pluginName of missingPlugins) {
            if (pluginName in target && target[pluginName].enabled !== true) {
                delete target[pluginName];
            }
        }
    }

    function pruneSeriesPlugins(target?: PlainObject) {
        const missingSeriesPlugins = missingModules.get(ModuleType.SeriesPlugin);
        if (!isObject(target) || !missingSeriesPlugins) return;
        for (const pluginName of missingSeriesPlugins) {
            if (pluginName in target) {
                delete target[pluginName];
            }
        }
    }

    function pruneAxisPlugins(target?: PlainObject) {
        const missingAxisPlugins = missingModules.get(ModuleType.AxisPlugin);
        if (!isObject(target) || !missingAxisPlugins) return;
        for (const pluginName of missingAxisPlugins) {
            if (pluginName in target && target[pluginName].enabled !== true) {
                delete target[pluginName];
            }
        }
    }

    function pruneAxes(axes?: PlainObject) {
        if (!isObject(axes)) return;
        for (const axisName of Object.keys(axes)) {
            if (missingModules.get(ModuleType.Axis)?.has(axisName)) {
                delete axes[axisName];
                continue;
            }
            pruneAxisPlugins(axes[axisName] as PlainObject);
        }
    }

    function pruneSeriesEntry(entry?: PlainObject) {
        if (!isObject(entry)) return;
        pruneAxes(entry.axes as PlainObject);
        prunePlugins(entry);
        pruneSeriesPlugins(entry.series as PlainObject);
    }

    const config = deepClone(theme.config);
    const overrides = deepClone(theme.overrides);
    const presets = deepClone(theme.presets);

    for (const seriesType of Object.keys(config)) {
        if (missingModules.get(ModuleType.Series)?.has(seriesType)) {
            delete config[seriesType];
            continue;
        }
        pruneSeriesEntry(config[seriesType]);
    }

    if (isObject(overrides)) {
        const overridesObj = overrides as PlainObject;
        if (isObject(overridesObj.common)) {
            pruneAxes(overridesObj.common.axes);
            prunePlugins(overridesObj.common);
        }
        for (const seriesType of Object.keys(overridesObj)) {
            if (seriesType === 'common') continue;
            if (missingModules.get(ModuleType.Series)?.has(seriesType)) {
                delete overridesObj[seriesType];
                continue;
            }
            pruneSeriesEntry(overridesObj[seriesType] as PlainObject);
        }
    }

    if (isObject(presets)) {
        const presetsObj = presets as PlainObject;
        for (const presetName of Object.keys(presetsObj)) {
            if (
                missingModules.get(ModuleType.Preset)?.has(presetName) ||
                missingModules.get(ModuleType.Series)?.has(presetName)
            ) {
                delete presetsObj[presetName];
                continue;
            }
            prunePlugins(presetsObj[presetName] as PlainObject);
            pruneAxes(presetsObj[presetName]?.axes);
        }
    }

    return Object.create(theme, {
        config: { value: deepFreeze(config), enumerable: true },
        overrides: { value: isObject(overrides) ? deepFreeze(overrides) : overrides, enumerable: true },
        presets: { value: isObject(presets) ? deepFreeze(presets) : presets, enumerable: true },
    });
}

/** What `processModuleOptions` wrote to the console, and the full set of modules it dropped for it. */
export interface ProcessModuleOptionsReport {
    message: string;
    missingModules: ModulePlaceholder[];
}

export function processModuleOptions<T extends Partial<AgChartOptions>>(
    chartType: string | undefined,
    options: T,
    additionalMissingModules: ModulePlaceholder[],
    logger: Logger
): ProcessModuleOptionsReport | undefined {
    const missingModules = unique(removeUnregisteredModuleOptions(chartType, options).concat(additionalMissingModules));

    if (!missingModules.length) return undefined;

    const installationReferenceUrl = ModuleRegistry.isIntegrated()
        ? 'https://www.ag-grid.com/data-grid/integrated-charts-installation/'
        : 'https://www.ag-grid.com/charts/r/module-registry/';

    const missingOptions = groupBy(missingModules, (module) => (module.enterprise ? 'enterprise' : 'community'));

    let message: string;
    if (ModuleRegistry.isUmd()) {
        message = umdMissingModulesMessage(missingOptions.enterprise ?? []);
        logger.warnOnce(message);
    } else {
        message = bundlerMissingModulesMessage(missingModules, missingOptions, installationReferenceUrl);
        logger.errorOnce(message);
    }

    return { message, missingModules };
}

function umdMissingModulesMessage(enterpriseModules: ModulePlaceholder[]): string {
    const installationUrl = ModuleRegistry.isIntegrated()
        ? 'https://www.ag-grid.com/data-grid/integrated-charts-installation/'
        : 'https://www.ag-grid.com/charts/javascript/installation/';
    const enterpriseOptions = enterpriseModules.map((module) => module.name).join('\n');
    return [
        `unable to use these enterprise features as 'ag-charts-enterprise' has not been loaded:`,
        '',
        enterpriseOptions,
        '',
        `See ${installationUrl} for more details.`,
    ].join('\n');
}

function bundlerMissingModulesMessage(
    missingModules: ModulePlaceholder[],
    missingOptions: Partial<Record<'enterprise' | 'community', ModulePlaceholder[]>>,
    installationReferenceUrl: string
): string {
    const packageName = ModuleRegistry.isEnterprise() || missingOptions.enterprise?.length ? 'enterprise' : 'community';
    return [
        'required modules are not registered. Check if you have registered the modules:',
        '',
        createRegistrySnippet(missingModules.map(formatMissingModuleName), packageName),
        '',
        `See ${installationReferenceUrl} for more details.`,
    ].join('\n');
}

function formatMissingModuleName(module: ModulePlaceholder): string {
    return module.moduleId ?? module.name;
}

function formatImportItem(name: string) {
    return `    ${name},`;
}

function formatImports(imports: string[], packageName: string) {
    return imports.length
        ? `import {\n${imports.map(formatImportItem).join('\n')}\n} from 'ag-charts-${packageName}';`
        : null;
}

function createRegistrySnippet(moduleNames: string[], packageName: string): string {
    const imports = formatImports(['ModuleRegistry'].concat(moduleNames), packageName);
    const moduleList = moduleNames.map(formatImportItem).join('\n');
    return `${imports}\n\nModuleRegistry.registerModules([\n${moduleList}\n]);`;
}

export function removeUnregisteredModuleOptions<T extends Partial<AgChartOptions>>(
    chartType: string | undefined,
    options: T
): ModulePlaceholder[] {
    const missingModules = new Map<string, ModulePlaceholder>();
    const optionsAxes = 'axes' in options && isObject(options.axes) ? options.axes : {};
    const axisTypesInOptions = new Set<string>(
        Object.values(optionsAxes)
            .map((axis) => axis?.type)
            .filter(isDefined)
    );
    const seriesTypesInOptions = new Set<string>(options.series?.map((series) => series.type).filter(isDefined));

    function addMissingModule(module: ModulePlaceholder) {
        missingModules.set(module.name, module);
    }

    for (const module of ExpectedModules.values()) {
        if (ModuleRegistry.hasModule(module.name)) continue;
        if (SkippedModules.has(module.name)) continue;
        // Ignore modules that don't match the current chart type
        if (chartType && module.chartType && chartType !== module.chartType) continue;

        switch (module.type) {
            case 'chart':
                // Chart modules should automatically register as dependencies, so we don't need to warn here.
                break;

            case 'axis':
                if (axisTypesInOptions.has(module.name)) {
                    for (const key of Object.keys(optionsAxes)) {
                        if (optionsAxes?.[key].type === module.name) {
                            delete optionsAxes[key];
                        }
                    }
                    addMissingModule(module);
                }
                break;

            case 'series':
                if (seriesTypesInOptions.has(module.name)) {
                    options.series = (options.series as any[]).filter((series) => series.type !== module.name);
                    addMissingModule(module);
                }
                break;

            case 'plugin':
                const optionsKey = module.name as keyof T;
                const pluginValue = options[optionsKey];
                if (isObject(pluginValue)) {
                    if (pluginValue.enabled !== false) {
                        addMissingModule(module);
                    }
                    delete options[optionsKey];
                }
                break;

            case 'axis:plugin':
                for (const axis of Object.values(optionsAxes)) {
                    const axisModuleKey = (module.optionsKey ?? module.name) as keyof typeof axis;
                    if (axis?.[axisModuleKey]) {
                        if (axis[axisModuleKey].enabled !== false) {
                            addMissingModule(module);
                        }
                        delete axis[axisModuleKey];
                    }
                }
                break;

            case 'series:plugin':
                for (const series of options.series ?? []) {
                    type SeriesModuleKey = Exclude<keyof typeof series, 'type'>;
                    if (series[module.name as SeriesModuleKey]) {
                        delete series[module.name as SeriesModuleKey];
                        addMissingModule(module);
                    }
                }
                break;
        }
    }

    // If a series type matches an expected module but isn't registered, treat it as a missing module instead of an
    // unknown series type to surface a clearer warning to the user.
    for (const seriesType of seriesTypesInOptions) {
        const expectedSeriesModule = ExpectedModules.get(seriesType);
        if (
            expectedSeriesModule?.type === ModuleType.Series &&
            !ModuleRegistry.hasModule(expectedSeriesModule.name) &&
            !missingModules.has(expectedSeriesModule.name)
        ) {
            options.series = (options.series as any[]).filter((series) => series.type !== expectedSeriesModule.name);
            addMissingModule(expectedSeriesModule);
        }
    }
    return Array.from(missingModules.values());
}

export function removeIncompatibleModuleOptions<T extends Partial<AgChartOptions>>(
    chartType: string | undefined,
    options: T
): string[] {
    const hasAxesOptions = 'axes' in options && isObject(options.axes);
    const hasSeriesOptions = 'series' in options && isArray(options.series);
    const matchChartType = (
        module: AxisPluginModuleDefinition<any> | SeriesPluginModuleDefinition<any> | PluginModuleDefinition<any>
    ) => chartType == null || !module.chartType || module.chartType === chartType;
    const incompatibleModules: string[] = [];

    // Axis-plugin modules can share an `optionsKey` (e.g. `CrossLinesModule` and `PolarCrossLinesModule`
    // both expose `axis.crossLines`). Only strip an option key if no compatible axis-plugin module
    // claims it for the current chartType.
    const supportedAxisPluginKeys = new Set<string>();
    for (const module of ModuleRegistry.listModulesByType(ModuleType.AxisPlugin)) {
        if (matchChartType(module)) {
            supportedAxisPluginKeys.add(module.optionsKey ?? module.name);
        }
    }

    for (const module of ModuleRegistry.listModules()) {
        if (ModuleRegistry.isModuleType(ModuleType.Plugin, module)) {
            if (!matchChartType(module)) {
                delete options[module.name as keyof AgChartOptions];
                incompatibleModules.push(module.name);
            }
        } else if (ModuleRegistry.isModuleType(ModuleType.AxisPlugin, module)) {
            if (hasAxesOptions && !matchChartType(module)) {
                const optionsKey = module.optionsKey ?? module.name;
                if (supportedAxisPluginKeys.has(optionsKey)) continue;
                for (const axis of Object.values(options.axes as object)) {
                    delete axis[optionsKey as keyof typeof axis];
                }
                incompatibleModules.push(module.name);
            }
        } else if (ModuleRegistry.isModuleType(ModuleType.SeriesPlugin, module)) {
            if (hasSeriesOptions && !matchChartType(module)) {
                for (const series of options.series as object[]) {
                    delete series[module.name as Exclude<keyof typeof series, 'type'>];
                }
                incompatibleModules.push(module.name);
            }
        }
    }

    return incompatibleModules;
}
