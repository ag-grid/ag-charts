/* eslint-disable sonarjs/no-collapsible-if */
import type { Module } from '../../module-support';
import type { AgChartOptions } from '../../options/chart/chartBuilderOptions';
import { Logger } from '../../util/logger';
import { optionsType } from '../mapping/types';
import { getChartType } from './chartTypes';

type EnterpriseModuleStub = Pick<Module<any>, 'type' | 'identifier' | 'optionsKey' | 'chartTypes'> & {
    useCount?: number;
    optionsInnerKey?: string;
};

const EXPECTED_ENTERPRISE_MODULES: EnterpriseModuleStub[] = [
    { type: 'root', optionsKey: 'animation', chartTypes: ['cartesian', 'polar', 'hierarchy'] },
    {
        type: 'root',
        optionsKey: 'background',
        chartTypes: ['cartesian', 'polar', 'hierarchy'],
        optionsInnerKey: 'image',
    },
    { type: 'root', optionsKey: 'contextMenu', chartTypes: ['cartesian', 'polar', 'hierarchy'] },
    { type: 'root', optionsKey: 'zoom', chartTypes: ['cartesian'] },
    {
        type: 'legend',
        optionsKey: 'gradientLegend',
        chartTypes: ['cartesian', 'polar', 'hierarchy'],
        identifier: 'gradient',
    },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'angle-category' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'angle-number' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'radius-category' },
    { type: 'axis', optionsKey: 'axes[]', chartTypes: ['polar'], identifier: 'radius-number' },
    { type: 'axis-option', optionsKey: 'crosshair', chartTypes: ['cartesian'] },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'box-plot' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'bullet' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'heatmap' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'nightingale' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radar-area' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radar-line' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radial-bar' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['polar'], identifier: 'radial-column' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'range-area' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'range-bar' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['hierarchy'], identifier: 'sunburst' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['hierarchy'], identifier: 'treemap' },
    { type: 'series', optionsKey: 'series[]', chartTypes: ['cartesian'], identifier: 'waterfall' },
    { type: 'series-option', optionsKey: 'errorBar', chartTypes: ['cartesian'], identifier: 'error-bars' },
];

export function verifyIfModuleExpected(module: Module<any>) {
    if (module.packageType !== 'enterprise') {
        throw new Error('AG Charts - internal configuration error, only enterprise modules need verification.');
    }

    const stub = EXPECTED_ENTERPRISE_MODULES.find((s) => {
        return (
            s.type === module.type &&
            s.optionsKey === module.optionsKey &&
            s.identifier === module.identifier &&
            module.chartTypes.every((t) => s.chartTypes.includes(t))
        );
    });

    if (stub) {
        stub.useCount ??= 0;
        stub.useCount++;
    }

    return stub != null;
}

export function getUnusedExpectedModules() {
    return EXPECTED_ENTERPRISE_MODULES.filter(({ useCount }) => useCount == null || useCount === 0);
}

export function removeUsedEnterpriseOptions<T extends AgChartOptions>(options: T) {
    const usedOptions: string[] = [];
    const optionsChartType = getChartType(optionsType(options));
    for (const { type, chartTypes, optionsKey, optionsInnerKey, identifier } of EXPECTED_ENTERPRISE_MODULES) {
        if (!chartTypes.includes(optionsChartType)) continue;

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
    for (const enterpriseOption of usedOptions) {
        Logger.warnOnce(
            [
                `AG Charts: unable to use ${enterpriseOption} as package 'ag-charts-enterprise' has not been imported.`,
                'Check that you have imported the package:',
                '',
                '    import "ag-charts-enterprise";',
                '',
                'For more info see: https://www.ag-grid.com/ag-charts/javascript/quick-start/',
            ].join('\n')
        );
    }

    return usedOptions;
}
