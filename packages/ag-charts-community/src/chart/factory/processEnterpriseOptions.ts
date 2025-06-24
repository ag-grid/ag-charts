import { Logger, isArray } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { LegendModule, RootModule } from '../../module/coreModules';
import { moduleRegistry } from '../../module/module';
import { chartTypes } from './chartTypes';
import { EXPECTED_ENTERPRISE_MODULES } from './expectedEnterpriseModules';

export function removeUsedEnterpriseOptions<T extends Partial<AgChartOptions>>(options: T, silent?: boolean) {
    let usedOptions: string[] = [];
    const optsType = options?.series?.[0]?.type;
    const isGaugeChart = (optsType as string) === 'linear-gauge' || (optsType as string) === 'radial-gauge';
    const optionsChartType = optsType ? chartTypes.get(optsType) : 'unknown';
    for (const module of EXPECTED_ENTERPRISE_MODULES) {
        if (optionsChartType !== 'unknown' && !module.chartTypes.includes(optionsChartType)) continue;

        if (module.type === 'root' || module.type === 'legend') {
            const optionValue = options[module.optionsKey as keyof T] as any;
            if (optionValue == null) continue;

            if (!module.optionsInnerKey) {
                usedOptions.push(module.optionsKey);
                delete options[module.optionsKey as keyof T];
            } else if (optionValue[module.optionsInnerKey]) {
                usedOptions.push(`${module.optionsKey}.${module.optionsInnerKey}`);
                delete optionValue[module.optionsInnerKey];
            }
        } else if (module.type === 'axis') {
            if (
                !('axes' in options) ||
                !isArray(options.axes as unknown) ||
                !options.axes?.some((axis) => axis.type === module.identifier)
            ) {
                continue;
            }

            usedOptions.push(`axis[type=${module.identifier}]`);
            options.axes = (options.axes as any).filter((axis: any) => axis.type !== module.identifier);
        } else if (module.type === 'axis-option') {
            if (
                !('axes' in options) ||
                !isArray(options.axes as unknown) ||
                !options.axes?.some((axis) => axis[module.optionsKey as keyof typeof axis])
            ) {
                continue;
            }

            usedOptions.push(`axis.${module.optionsKey}`);
            options.axes.forEach((axis) => {
                if (axis[module.optionsKey as keyof typeof axis]) {
                    delete axis[module.optionsKey as keyof typeof axis];
                }
            });
        } else if (module.type === 'series') {
            if (module.community) continue;
            if (
                !isArray(options.series as unknown) ||
                !options.series?.some((series) => series.type === module.identifier)
            ) {
                continue;
            }

            usedOptions.push(`series[type=${module.identifier}]`);
            options.series = (options.series as any).filter((series: any) => series.type !== module.identifier);
        } else if (module.type === 'series-option') {
            if (
                !isArray(options.series as unknown) ||
                !options.series?.some((series) => series[module.optionsKey as keyof typeof series])
            ) {
                continue;
            }

            usedOptions.push(`series.${module.optionsKey}`);
            options.series.forEach((series) => {
                type SeriesModuleKey = Exclude<keyof typeof series, 'type'>;
                if (series[module.optionsKey as SeriesModuleKey]) {
                    delete series[module.optionsKey as SeriesModuleKey];
                }
            });
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
    for (const module of moduleRegistry.byType<RootModule | LegendModule>('root', 'legend')) {
        const moduleOptions = options[module.optionsKey as keyof AgChartOptions] as { enabled?: boolean };
        const isPresentAndDisabled = moduleOptions != null && moduleOptions.enabled === false;
        const removable =
            !('removable' in module) ||
            module.removable === true ||
            (module.removable === 'standalone-only' && !integratedMode);

        if (isPresentAndDisabled && removable) {
            delete options[module.optionsKey as keyof AgChartOptions];
        }
    }
}
