import { ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    AngleCategoryAxisModule,
    AnimationModule,
    NightingaleSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AngleCategoryAxisModule,
    AnimationModule,
    NightingaleSeriesModule,
    RadiusNumberAxisModule,
]);
const data = getData();
const totalRevenue = data.reduce((sum, d) => sum + d.hardware, 0);
const avgRevenue = totalRevenue / data.length;

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    title: {
        text: 'Monthly Hardware Revenue Performance',
    },
    subtitle: {
        text: `2024 Distribution - $${totalRevenue.toFixed(1)}M Total Revenue`,
    },
    animation: {
        enabled: true,
        duration: 800,
    },
    series: [
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
            fillOpacity: 0.85,
            cornerRadius: 4,
            itemStyler: (params) => {
                const value = params.datum[params.radiusKey!];
                if (value >= avgRevenue * 1.2) {
                    return { fillOpacity: 1 };
                } else if (value < avgRevenue * 0.8) {
                    return { fillOpacity: 0.6 };
                }
                return undefined;
            },
            tooltip: {
                renderer: (params: any) => {
                    const monthValue = params.datum[params.radiusKey!];
                    const percentage = ((monthValue / totalRevenue) * 100).toFixed(1);
                    const variance = (((monthValue - avgRevenue) / avgRevenue) * 100).toFixed(0);
                    const varianceNum = parseFloat(variance);

                    return {
                        heading: 'Performance',
                        title: `${params.datum.quarter} 2024`,
                        data: [
                            { label: 'Revenue', value: `$${monthValue.toFixed(2)}M` },
                            { label: 'Monthly Share', value: `${percentage}%` },
                            { label: 'vs Average', value: `${varianceNum > 0 ? '+' : ''}${variance}%` },
                        ],
                    };
                },
            },
        },
    ],
    axes: {
        radius: {
            type: 'radius-number',
            label: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: avgRevenue,
                    strokeWidth: 2,
                    strokeOpacity: 0.5,
                    lineDash: [4, 4],
                    label: {
                        text: 'Avg',
                    },
                },
            ],
        },
        angle: {
            type: 'angle-category',
            gridLine: {
                enabled: true,
                style: [{ strokeWidth: 0.5 }],
            },
            label: {
                spacing: 0,
            },
            line: {
                enabled: false,
            },
        },
    },
};

AgCharts.create(options);
