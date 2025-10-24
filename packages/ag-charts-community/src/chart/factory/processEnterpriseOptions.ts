import { Logger, ModuleRegistry, ModuleType, isArray } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { ExpectedModules } from './expectedModules';

export function removeUsedEnterpriseOptions<T extends Partial<AgChartOptions>>(
    chartType: string,
    options: T,
    silent?: boolean
) {
    let usedOptions: string[] = [];
    const optsType: string | undefined = options?.series?.[0]?.type;
    const isGaugeChart = optsType === 'linear-gauge' || optsType === 'radial-gauge';

    for (const module of ExpectedModules) {
        if (!module.enterprise || module.removable === false) continue;
        if (chartType && module.chartType && chartType !== module.chartType) continue;

        switch (module.type) {
            case 'chart':
                break;

            case 'axis':
                if (
                    'axes' in options &&
                    isArray(options.axes) &&
                    options.axes.some((axis) => axis.type === module.name)
                ) {
                    usedOptions.push(`axis[type=${module.name}]`);
                    options.axes = (options.axes as any[]).filter((axis) => axis.type !== module.name);
                }
                break;

            case 'series':
                if (isArray(options.series) && options.series.some((series) => series.type === module.name)) {
                    usedOptions.push(`series[type=${module.name}]`);
                    options.series = (options.series as any[]).filter((series) => series.type !== module.name);
                }
                break;

            case 'plugin':
                const optionsKey = module.name as keyof T;
                if (options[optionsKey] != null) {
                    usedOptions.push(module.name);
                    delete options[optionsKey];
                }
                break;

            case 'axis:plugin':
                if (
                    'axes' in options &&
                    isArray(options.axes) &&
                    options.axes.some((axis) => axis[module.name as keyof typeof axis])
                ) {
                    usedOptions.push(`axis.${module.name}`);
                    for (const axis of options.axes) {
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
                    usedOptions.push(`series.${module.name}`);
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
    if (usedOptions.length && !silent) {
        if (isGaugeChart) {
            usedOptions = ['AgCharts.createGauge'];
        }

        let enterprisePackageName = 'ag-charts-enterprise';
        let enterpriseReferenceUrl = 'https://www.ag-grid.com/charts/javascript/installation/';

        if ((options as any).mode === 'integrated') {
            enterprisePackageName = "ag-grid-charts-enterprise' or 'ag-grid-enterprise/charts-enterprise";
            enterpriseReferenceUrl = 'https://www.ag-grid.com/javascript-data-grid/integrated-charts-installation/';
        }

        Logger.warnOnce(
            [
                `unable to use these enterprise features as '${enterprisePackageName}' has not been loaded:`,
                '',
                ...usedOptions,
                '',
                `See: ${enterpriseReferenceUrl}`,
            ].join('\n')
        );
    }
}

export function removeUnusedEnterpriseOptions<T extends Partial<AgChartOptions>>(chartType: string, options: T) {
    for (const module of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
        if (module.enterprise && module.chartType && module.chartType !== chartType) {
            delete options[module.name as keyof AgChartOptions];
        }
    }
    if ('axes' in options && isArray(options.axes)) {
        for (const module of ModuleRegistry.listModulesByType(ModuleType.AxisPlugin)) {
            if (module.enterprise && module.chartType && module.chartType !== chartType) {
                for (const axis of options.axes) {
                    delete axis[module.name as keyof typeof axis];
                }
            }
        }
    }
    if ('series' in options && isArray(options.series)) {
        for (const module of ModuleRegistry.listModulesByType(ModuleType.SeriesPlugin)) {
            if (module.enterprise && module.chartType && module.chartType !== chartType) {
                for (const series of options.series) {
                    delete series[module.name as Exclude<keyof typeof series, 'type'>];
                }
            }
        }
    }
}
