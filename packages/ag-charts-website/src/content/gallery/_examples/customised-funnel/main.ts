import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const data = getData();

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Enterprise Sales Pipeline Performance',
    },
    subtitle: {
        text: 'Q2 2024 vs Q1 2024 | Quarterly Comparison',
        spacing: 20,
    },
    series: [
        {
            type: 'funnel',
            stageKey: 'stage',
            valueKey: 'q2_2024',
            direction: 'horizontal',
            dropOff: {
                enabled: true,
                fillOpacity: 0.3,
            },
            spacingRatio: 0.02,
            strokeWidth: 2,
            strokeOpacity: 0.3,
            fillOpacity: 0.95,
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
                    const { q2_2024, q1_2024, target } = datum;
                    const growth = (((q2_2024 - q1_2024) / q1_2024) * 100).toFixed(1);
                    const targetAchievement = ((q2_2024 / target) * 100).toFixed(1);
                    const conversionRate = data[0].q2_2024 > 0 ? ((q2_2024 / data[0].q2_2024) * 100).toFixed(1) : '0';

                    return {
                        title: datum.description,
                        data: [
                            {
                                label: 'Q2 vs Q1 2024',
                                value: `${q2_2024.toLocaleString()} vs ${q1_2024.toLocaleString()}`,
                            },
                            { label: 'QoQ Growth', value: `${Number(growth) >= 0 ? '+' : ''}${growth}%` },
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
