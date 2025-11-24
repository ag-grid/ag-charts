import {
    type AxisPluginModuleDefinition,
    Logger,
    ModuleRegistry,
    ModuleType,
    type PlainObject,
    type PluginModuleDefinition,
    type SeriesPluginModuleDefinition,
    deepClone,
    deepFreeze,
    enterpriseRegistry,
    isArray,
    isObject,
} from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { ChartTheme } from '../themes/chartTheme';
import { ExpectedModules, type ModulePlaceholder } from './expectedModules';

export function sanitizeThemeModules(theme: ChartTheme): ChartTheme {
    const registeredModules = new Set<string>();
    let hasEnterpriseModules = false;

    for (const module of ModuleRegistry.listModules()) {
        registeredModules.add(module.name);
        hasEnterpriseModules ||= Boolean(module.enterprise);
    }

    const missingModules = new Map<string, ModulePlaceholder>();
    for (const [name, module] of ExpectedModules) {
        if ((!hasEnterpriseModules && module.enterprise) || !registeredModules.has(name)) {
            missingModules.set(name, module);
        }
    }

    if (missingModules.size === 0) return theme;

    const missingModulesByType = new Map<string, Set<string>>();
    for (const missing of missingModules.values()) {
        if (missingModulesByType.has(missing.type)) {
            missingModulesByType.get(missing.type)!.add(missing.name);
        } else {
            missingModulesByType.set(missing.type, new Set<string>([missing.name]));
        }
    }

    const prunePlugins = (target?: PlainObject) => {
        const missingPlugins = missingModulesByType.get(ModuleType.Plugin);
        if (!isObject(target) || !missingPlugins) return;
        for (const pluginName of missingPlugins) {
            if (pluginName in target) {
                delete target[pluginName];
            }
        }
    };

    const pruneSeriesPlugins = (target?: PlainObject) => {
        const missingSeriesPlugins = missingModulesByType.get(ModuleType.SeriesPlugin);
        if (!isObject(target) || !missingSeriesPlugins) return;
        for (const pluginName of missingSeriesPlugins) {
            if (pluginName in target) {
                delete target[pluginName];
            }
        }
    };

    const pruneAxisPlugins = (target?: PlainObject) => {
        const missingAxisPlugins = missingModulesByType.get(ModuleType.AxisPlugin);
        if (!isObject(target) || !missingAxisPlugins) return;
        for (const pluginName of missingAxisPlugins) {
            if (pluginName in target) {
                delete target[pluginName];
            }
        }
    };

    const pruneAxes = (axes?: PlainObject) => {
        if (!isObject(axes)) return;
        for (const axisName of Object.keys(axes)) {
            if (missingModulesByType.get(ModuleType.Axis)?.has(axisName)) {
                delete axes[axisName];
                continue;
            }
            pruneAxisPlugins(axes[axisName] as PlainObject);
        }
    };

    const pruneSeriesEntry = (entry?: PlainObject) => {
        if (!isObject(entry)) return;
        pruneAxes(entry.axes as PlainObject);
        prunePlugins(entry);
        pruneSeriesPlugins(entry.series as PlainObject);
    };

    const config = deepClone(theme.config);
    const overrides = deepClone(theme.overrides);
    const presets = deepClone(theme.presets);

    for (const seriesType of Object.keys(config)) {
        if (missingModulesByType.get(ModuleType.Series)?.has(seriesType)) {
            delete config[seriesType];
            continue;
        }
        pruneSeriesEntry(config[seriesType]);
    }

    if (isObject(overrides)) {
        const overridesObj = overrides as PlainObject;
        if (isObject(overridesObj.common)) {
            pruneAxes((overridesObj.common as any).axes);
            prunePlugins(overridesObj.common);
        }
        for (const seriesType of Object.keys(overridesObj)) {
            if (seriesType === 'common') continue;
            if (missingModulesByType.get(ModuleType.Series)?.has(seriesType)) {
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
                missingModulesByType.get(ModuleType.Preset)?.has(presetName) ||
                missingModulesByType.get(ModuleType.Series)?.has(presetName)
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

export function processModuleOptions<T extends Partial<AgChartOptions>>(chartType: string, options: T) {
    const initialSeriesType = options.series?.[0]?.type as string | undefined;
    removeIncompatibleModuleOptions(chartType, options);
    const missingModules = removeUnregisteredModuleOptions(chartType, options);

    if (!missingModules.length) return;

    let enterprisePackageName = 'ag-charts-enterprise';
    let enterpriseReferenceUrl = 'https://www.ag-grid.com/charts/javascript/installation/';

    if ((options as any).mode === 'integrated') {
        enterprisePackageName = "ag-grid-charts-enterprise' or 'ag-grid-enterprise/charts-enterprise";
        enterpriseReferenceUrl = 'https://www.ag-grid.com/javascript-data-grid/integrated-charts-installation/';
    }

    const missingOptions = missingModules.reduce<{ enterprise: string[]; community: string[] }>(
        (data, module) => {
            data[module.enterprise ? 'enterprise' : 'community'].push(mapModuleName(module));
            return data;
        },
        { enterprise: [], community: [] }
    );

    if (initialSeriesType === 'linear-gauge' || initialSeriesType === 'radial-gauge') {
        missingOptions.enterprise = ['AgCharts.createGauge'];
    }

    const messages: string[] = [];

    if (missingOptions.enterprise.length) {
        messages.push(
            [
                `unable to use these enterprise features as '${enterprisePackageName}' has not been loaded:`,
                '',
                ...missingOptions.enterprise,
                '',
                `See: ${enterpriseReferenceUrl}`,
            ].join('\n')
        );
    }

    if (missingOptions.community.length) {
        messages.push(
            [
                `unable to use these features as the required community modules have not been registered:`,
                '',
                ...missingOptions.community,
                '',
                `Call ModuleRegistry.registerModules([...]) with the necessary modules before creating the chart.`,
            ].join('\n')
        );
    }

    if (messages.length) {
        Logger.warnOnce(messages.join('\n\n'));
    }
}

function mapModuleName(module: ModulePlaceholder): string {
    switch (module.type) {
        case 'axis':
            return `axis[type=${module.name}]`;

        case 'series':
            return `series[type=${module.name}]`;

        case 'axis:plugin':
            return `axis.${module.name}`;

        case 'series:plugin':
            return `series.${module.name}`;

        case 'plugin':
        default:
            return module.name;
    }
}

export function removeUnregisteredModuleOptions<T extends Partial<AgChartOptions>>(
    chartType: string,
    options: T
): ModulePlaceholder[] {
    const missingModules: ModulePlaceholder[] = [];

    for (const module of ExpectedModules.values()) {
        if (ModuleRegistry.hasModule(module.name)) continue;
        if (chartType && module.chartType && chartType !== module.chartType) continue;
        if (module.name === 'foreground' && enterpriseRegistry.createForeground != null) continue;

        switch (module.type) {
            case 'chart':
                break;

            case 'axis':
                if (
                    'axes' in options &&
                    isObject(options.axes) &&
                    Object.values(options.axes).some((series) => series.type === module.name)
                ) {
                    missingModules.push(module);
                    for (const key of Object.keys(options.axes)) {
                        if (options.axes[key].type === module.name) {
                            delete options.axes[key];
                        }
                    }
                }
                break;

            case 'series':
                if (isArray(options.series) && options.series.some((series) => series.type === module.name)) {
                    missingModules.push(module);
                    options.series = (options.series as any[]).filter((series) => series.type !== module.name);
                }
                break;

            case 'plugin':
                const optionsKey = module.name as keyof T;
                if (options[optionsKey] != null) {
                    missingModules.push(module);
                    delete options[optionsKey];
                }
                break;

            case 'axis:plugin':
                if (
                    'axes' in options &&
                    isObject(options.axes) &&
                    Object.values(options.axes).some((axis) => axis[module.name as keyof typeof axis])
                ) {
                    missingModules.push(module);
                    for (const axis of Object.values(options.axes)) {
                        if (axis[module.name as keyof typeof axis]) {
                            delete axis[module.name as keyof typeof axis];
                        }
                    }
                }
                break;

            case 'series:plugin':
                if (
                    isArray(options.series as unknown) &&
                    options.series?.some((series) => series[module.name as keyof typeof series])
                ) {
                    missingModules.push(module);
                    for (const series of options.series) {
                        type SeriesModuleKey = Exclude<keyof typeof series, 'type'>;
                        if (series[module.name as SeriesModuleKey]) {
                            delete series[module.name as SeriesModuleKey];
                        }
                    }
                }
                break;
        }
    }
    return missingModules;
}

export function removeIncompatibleModuleOptions<T extends Partial<AgChartOptions>>(
    chartType: string,
    options: T
): string[] {
    const hasAxesOptions = 'axes' in options && isObject(options.axes);
    const hasSeriesOptions = 'series' in options && isArray(options.series);
    const matchChartType = (
        module: AxisPluginModuleDefinition<any> | SeriesPluginModuleDefinition<any> | PluginModuleDefinition<any>
    ) => !module.chartType || module.chartType === chartType;
    const incompatibleModules: string[] = [];

    for (const module of ModuleRegistry.listModules()) {
        if (ModuleRegistry.isModuleType(ModuleType.Plugin, module)) {
            if (!matchChartType(module)) {
                delete options[module.name as keyof AgChartOptions];
                incompatibleModules.push(module.name);
            }
        } else if (ModuleRegistry.isModuleType(ModuleType.AxisPlugin, module)) {
            if (hasAxesOptions && !matchChartType(module)) {
                for (const axis of Object.values(options.axes as object)) {
                    delete axis[module.name as keyof typeof axis];
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
