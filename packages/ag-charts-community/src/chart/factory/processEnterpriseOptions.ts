import { Logger, ModuleRegistry, ModuleType, isArray } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { ExpectedModules } from './expectedModules';

export function removeUsedEnterpriseOptions<T extends Partial<AgChartOptions>>(options: T, silent?: boolean) {
    let usedOptions: string[] = [];
    const optsType = options?.series?.[0]?.type;
    const isGaugeChart = (optsType as string) === 'linear-gauge' || (optsType as string) === 'radial-gauge';
    const optionsChartType = optsType ? ModuleRegistry.getSeriesModule(optsType)?.chartType : null;

    for (const module of ExpectedModules) {
        if (!module.enterprise || module.removable === false) continue;
        if (optionsChartType && module.chartType && optionsChartType !== module.chartType) continue;

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

export function removeUnusedEnterpriseOptions<T extends Partial<AgChartOptions>>(options: T) {
    const integratedMode = 'mode' in options && options.mode === 'integrated';
    for (const module of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
        const moduleOptions = options[module.name as keyof AgChartOptions] as { enabled?: boolean };
        const isPresentAndDisabled = moduleOptions != null && moduleOptions.enabled === false;
        const removable =
            !('removable' in module) ||
            module.removable === true ||
            (module.removable === 'standalone-only' && !integratedMode);

        if (isPresentAndDisabled && removable) {
            delete options[module.name as keyof AgChartOptions];
        }
    }
}
