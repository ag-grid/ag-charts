import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Subscription Revenue By Industry',
    },
    subtitle: {
        text: 'Q4 Net New Subscription Revenue In Millions',
    },
    theme: {
        overrides: {
            area: {
                series: {
                    strokeWidth: 2,
                    tooltip: {
                        renderer: ({ datum, xKey, yKey }: AgCartesianSeriesTooltipRendererParams) => {
                            return {
                                content: `${datum[xKey]}: $${Math.round(datum[yKey] / 1000000)}M`,
                            };
                        },
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'industry',
            yKey: 'targetRevenue',
            yName: 'Target',
        },
        {
            type: 'area',
            xKey: 'industry',
            yKey: 'actualRevenue',
            yName: 'Actual',
            marker: {
                shape: 'circle',
                formatter: ({ datum, xKey }) => {
                    const industries = ['Technology', 'Healthcare', 'Energy'];
                    return {
                        size: industries.includes(datum[xKey]) ? 9 : 0,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            label: {
                autoRotate: false,
                rotation: -90,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 'Technology',
                    lineDash: [5, 6],
                    strokeOpacity: 0.6,
                    label: {
                        text: 'Tech ^12.8%\n___________',
                    },
                },
                {
                    type: 'line',
                    value: 'Healthcare',
                    lineDash: [5, 6],
                    strokeOpacity: 0.6,
                    label: {
                        text: 'Healthcare ^1.0%\n_______________',
                    },
                },
                {
                    type: 'line',
                    value: 'Energy',
                    lineDash: [5, 6],
                    strokeOpacity: 0.6,
                    label: {
                        text: 'Energy ^0.5%\n____________',
                    },
                },
            ],
        },
        {
            type: 'number',
            position: 'left',
            gridLine: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
            crosshair: {
                enabled: false,
            },
        },
    ],
    legend: {
        position: 'top',
    },
};

AgCharts.create(options);
