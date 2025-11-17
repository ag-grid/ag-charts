import { Logger, ModuleRegistry, ModuleType, enterpriseRegistry, isArray, isObject } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { ExpectedModules, type ModulePlaceholder } from './expectedModules';

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
    options: T,
    silent?: boolean
) {
    const missingModules: ModulePlaceholder[] = [];

    for (const module of ExpectedModules) {
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
    if (missingModules.length && !silent) {
        let enterprisePackageName = 'ag-charts-enterprise';
        let enterpriseReferenceUrl = 'https://www.ag-grid.com/charts/javascript/installation/';

        if ((options as any).mode === 'integrated') {
            enterprisePackageName = "ag-grid-charts-enterprise' or 'ag-grid-enterprise/charts-enterprise";
            enterpriseReferenceUrl = 'https://www.ag-grid.com/javascript-data-grid/integrated-charts-installation/';
        }

        const messages: string[] = [];
        const missingOptions = missingModules.reduce<{ enterprise: string[]; community: string[] }>(
            (data, module) => {
                data[module.enterprise ? 'enterprise' : 'community'].push(mapModuleName(module));
                return data;
            },
            { enterprise: [], community: [] }
        );

        const optsType: string | undefined = options?.series?.[0]?.type;
        if (optsType === 'linear-gauge' || optsType === 'radial-gauge') {
            missingOptions.enterprise = ['AgCharts.createGauge'];
        }

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
}

export function removeIncompatibleModuleOptions<T extends Partial<AgChartOptions>>(chartType: string, options: T) {
    for (const module of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
        if (module.chartType && module.chartType !== chartType) {
            delete options[module.name as keyof AgChartOptions];
        }
    }
    if ('axes' in options && isObject(options.axes)) {
        for (const module of ModuleRegistry.listModulesByType(ModuleType.AxisPlugin)) {
            if (module.chartType && module.chartType !== chartType) {
                for (const axis of Object.values(options.axes)) {
                    delete axis[module.name as keyof typeof axis];
                }
            }
        }
    }
    if ('series' in options && isArray(options.series)) {
        for (const module of ModuleRegistry.listModulesByType(ModuleType.SeriesPlugin)) {
            if (module.chartType && module.chartType !== chartType) {
                for (const series of options.series) {
                    delete series[module.name as Exclude<keyof typeof series, 'type'>];
                }
            }
        }
    }
}
