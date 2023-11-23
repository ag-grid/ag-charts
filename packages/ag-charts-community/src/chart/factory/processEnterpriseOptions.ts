import type { AgChartOptions } from '../../options/agChartOptions';
import { Logger } from '../../util/logger';
import { optionsType } from '../mapping/types';
import { getChartType } from './chartTypes';
import { EXPECTED_ENTERPRISE_MODULES } from './expectedEnterpriseModules';

export function removeUsedEnterpriseOptions<T extends AgChartOptions>(options: T) {
    const usedOptions: string[] = [];
    const optionsChartType = getChartType(optionsType(options));
    for (const { type, chartTypes, optionsKey, optionsInnerKey, identifier } of EXPECTED_ENTERPRISE_MODULES) {
        if (optionsChartType !== 'unknown' && !chartTypes.includes(optionsChartType)) continue;

        if (type === 'root' || type === 'legend') {
            const optionValue = options[optionsKey as keyof T] as any;
            if (optionValue != null) {
                if (!optionsInnerKey) {
                    usedOptions.push(optionsKey);
                    delete options[optionsKey as keyof T];
                } else if (optionValue[optionsInnerKey]) {
                    usedOptions.push(`${optionsKey}.${optionsInnerKey}`);
                    delete optionValue[optionsInnerKey];
                }
            }
        } else if (type === 'axis') {
            if ('axes' in options && options.axes?.some((axis) => axis.type === identifier)) {
                usedOptions.push(`axis[type=${identifier}]`);
                options.axes = (options.axes as any).filter((axis: any) => axis.type !== identifier);
            }
        } else if (type === 'axis-option') {
            if ('axes' in options && options.axes?.some((axis) => axis[optionsKey as keyof typeof axis])) {
                usedOptions.push(`axis.${optionsKey}`);
                options.axes.forEach((axis) => {
                    if (axis[optionsKey as keyof typeof axis]) {
                        delete axis[optionsKey as keyof typeof axis];
                    }
                });
            }
        } else if (type === 'series') {
            if (options.series?.some((series) => series.type === identifier)) {
                usedOptions.push(`series[type=${identifier}]`);
                options.series = (options.series as any).filter((series: any) => series.type !== identifier);
            }
        } else if (type === 'series-option') {
            if (options.series?.some((series) => series[optionsKey as keyof typeof series])) {
                usedOptions.push(`series.${optionsKey}`);
                options.series.forEach((series) => {
                    if (series[optionsKey as keyof typeof series]) {
                        delete series[optionsKey as keyof typeof series];
                    }
                });
            }
        }
    }
    if (usedOptions.length > 0) {
        Logger.warnOnce(
            [
                `unable to use these enterprise features as 'ag-charts-enterprise' has not been loaded:`,
                ``,
                ...usedOptions,
                ``,
                'See: https://charts.ag-grid.com/javascript/installation/',
            ].join('\n')
        );
    }
}
