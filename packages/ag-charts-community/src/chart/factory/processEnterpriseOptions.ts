import type { AgChartOptions } from 'ag-charts-types';

import { Logger } from '../../util/logger';
import { isAgGaugeChartOptions, optionsType } from '../mapping/types';
import { chartTypes } from './chartTypes';
import { EXPECTED_ENTERPRISE_MODULES } from './expectedEnterpriseModules';

export function removeUsedEnterpriseOptions<T extends Partial<AgChartOptions>>(options: T, silent?: boolean) {
    let usedOptions: string[] = [];
    const isGaugeChart = isAgGaugeChartOptions(options);
    const type = optionsType(options);
    const optionsChartType = type ? chartTypes.get(type) : 'unknown';
    for (const {
        type,
        chartTypes: moduleChartTypes,
        optionsKey,
        optionsInnerKey,
        identifier,
        community,
    } of EXPECTED_ENTERPRISE_MODULES) {
        if (optionsChartType !== 'unknown' && !moduleChartTypes.includes(optionsChartType)) continue;

        if (type === 'root' || type === 'legend') {
            const optionValue = options[optionsKey as keyof T] as any;
            if (optionValue == null) continue;

            if (!optionsInnerKey) {
                usedOptions.push(optionsKey);
                delete options[optionsKey as keyof T];
            } else if (optionValue[optionsInnerKey]) {
                usedOptions.push(`${optionsKey}.${optionsInnerKey}`);
                delete optionValue[optionsInnerKey];
            }
        } else if (type === 'axis') {
            if (!('axes' in options) || !options.axes?.some((axis) => axis.type === identifier)) continue;

            usedOptions.push(`axis[type=${identifier}]`);
            options.axes = (options.axes as any).filter((axis: any) => axis.type !== identifier);
        } else if (type === 'axis-option') {
            if (!('axes' in options) || !options.axes?.some((axis) => axis[optionsKey as keyof typeof axis])) continue;

            usedOptions.push(`axis.${optionsKey}`);
            options.axes.forEach((axis) => {
                if (axis[optionsKey as keyof typeof axis]) {
                    delete axis[optionsKey as keyof typeof axis];
                }
            });
        } else if (type === 'series') {
            if (community) continue;
            if (!options.series?.some((series) => series.type === identifier)) continue;

            usedOptions.push(`series[type=${identifier}]`);
            options.series = (options.series as any).filter((series: any) => series.type !== identifier);
        } else if (type === 'series-option') {
            if (!options.series?.some((series) => series[optionsKey as keyof typeof series])) continue;

            usedOptions.push(`series.${optionsKey}`);
            options.series.forEach((series) => {
                if (series[optionsKey as keyof typeof series]) {
                    delete series[optionsKey as keyof typeof series];
                }
            });
        }
    }
    if (usedOptions.length && !silent) {
        if (isGaugeChart) {
            usedOptions = ['AgCharts.createGauge'];
        }

        let enterprisePackageName = 'ag-charts-enterprise';
        let enterpriseReferenceUrl = 'https://ag-grid.com/charts/javascript/installation/';

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
