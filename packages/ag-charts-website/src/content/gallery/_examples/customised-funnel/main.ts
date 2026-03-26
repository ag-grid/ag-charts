import {
    AgChartOptions,
    AgCharts,
    CategoryAxisModule,
    ContextMenuModule,
    FunnelSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, FunnelSeriesModule, NumberAxisModule]);
const data = getData();

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Enterprise Sales Pipeline Performance',
    },
    subtitle: {
        text: 'Q2 2024 vs Q1 2024 | Quarterly Comparison',
    },
    series: [
        {
            type: 'funnel',
            stageKey: 'stage',
            valueKey: 'q2_2024',
            direction: 'horizontal',
            dropOff: {
                fillOpacity: 0.3,
            },
            spacingRatio: 0.02,
            strokeWidth: 2,
            strokeOpacity: 0.3,
            itemStyler: ({ datum }) => {
                const performance = datum.q2_2024 / datum.target;

                return {
                    fillOpacity: performance >= 1 ? 0.95 : 0.75,
                };
            },
            stageLabel: {
                placement: 'before',
            },
            label: {
                enabled: true,
                formatter: ({ datum }) => {
                    const achievement = ((datum.q2_2024 / datum.target) * 100).toFixed(0);
                    return `${datum.q2_2024.toLocaleString()}\n${achievement}% of target`;
                },
            },
            tooltip: {
                enabled: true,
                position: {
                    placement: ['top-right', 'bottom-right', 'top-left', 'bottom-left'],
                },
                renderer: ({ datum }) => {
                    const { q2_2024, target } = datum;
                    const targetAchievement = ((q2_2024 / target) * 100).toFixed(1);
                    const conversionRate = data[0].q2_2024 > 0 ? ((q2_2024 / data[0].q2_2024) * 100).toFixed(1) : '0';

                    return {
                        title: datum.description,
                        data: [
                            {
                                label: 'Target Achievement',
                                value: `${targetAchievement}% of ${target.toLocaleString()}`,
                            },
                            { label: 'Overall Conversion', value: `${conversionRate}%` },
                        ],
                    };
                },
            },
        },
    ],
};

AgCharts.create(options);
