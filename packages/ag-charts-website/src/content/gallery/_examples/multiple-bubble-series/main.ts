import {
    AgCartesianChartOptions,
    AgCharts,
    BubbleSeriesModule,
    ContextMenuModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getCoffeeIndustryData, getFoodIndustryData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'The Food & Coffee Industries',
    },
    subtitle: {
        text: 'Growth Rate Versus Number of Franchises',
    },
    footnote: {
        text: 'Comparative Analysis of UK Food and Coffee Franchises',
    },
    tooltip: {
        mode: 'shared',
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    series: [
        {
            type: 'bubble',
            data: getFoodIndustryData(),
            xKey: 'numberOfFranchises',
            xName: 'Number of Franchises',
            yKey: 'growthRate',
            yName: 'Food Industry',
            sizeKey: 'licenseFee',
            sizeName: 'License Fee',
            labelKey: 'franchiseName',
            labelName: 'Franchise',
            maxSize: 80,
            fillOpacity: 0.75,
            strokeWidth: 2,
            strokeOpacity: 0.9,
            label: {
                enabled: true,
                formatter: (params: any) => {
                    // Only show labels for significant franchises to reduce overlap
                    if (params.datum.numberOfFranchises > 1500 || params.datum.growthRate > 16) {
                        return params.datum.franchiseName;
                    }
                    return '';
                },
            },
            tooltip: {
                renderer: (params: any) => ({
                    heading: params.datum.franchiseName,
                    title: params.yName,
                    data: [
                        {
                            label: 'Franchises',
                            value: params.datum[params.xKey].toLocaleString('en-GB'),
                        },
                        {
                            label: 'Growth Rate',
                            value: `${params.datum[params.yKey]}%`,
                        },
                        {
                            label: 'License Fee',
                            value: `£${params.datum[params.sizeKey].toLocaleString('en-GB')}`,
                        },
                    ],
                }),
            },
        },
        {
            type: 'bubble',
            data: getCoffeeIndustryData(),
            xKey: 'numberOfFranchises',
            xName: 'Number of Franchises',
            yKey: 'growthRate',
            yName: 'Coffee Industry',
            sizeKey: 'licenseFee',
            sizeName: 'License Fee',
            labelKey: 'franchiseName',
            labelName: 'Franchise',
            maxSize: 80,
            fillOpacity: 0.75,
            strokeWidth: 2,
            strokeOpacity: 0.9,
            label: {
                enabled: true,
                formatter: (params: any) => {
                    // Only show labels for significant franchises to reduce overlap
                    if (params.datum.numberOfFranchises > 3000 || params.datum.growthRate > 20) {
                        return params.datum.franchiseName;
                    }
                    return '';
                },
            },
            tooltip: {
                renderer: (params: any) => ({
                    heading: params.datum.franchiseName,
                    title: params.yName,
                    data: [
                        {
                            label: 'Franchises',
                            value: params.datum[params.xKey].toLocaleString('en-GB'),
                        },
                        {
                            label: 'Growth Rate',
                            value: `${params.datum[params.yKey]}%`,
                        },
                        {
                            label: 'License Fee',
                            value: `£${params.datum[params.sizeKey].toLocaleString('en-GB')}`,
                        },
                    ],
                }),
            },
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
            nice: false,
            min: -6000,
            max: 50000,
            title: {
                text: 'Number of Franchises',
            },
            label: {
                formatter: ({ value }) => {
                    if (value === 0) return '0';
                    return new Intl.NumberFormat('en-GB').format(value);
                },
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [3, 3],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            crossLines: [
                {
                    type: 'line',
                    value: 10000,
                    strokeWidth: 1,
                    strokeOpacity: 0.4,
                    lineDash: [4, 4],
                    label: {
                        text: 'Market Threshold',
                        position: 'top',
                        padding: 10,
                    },
                },
            ],
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Franchise Growth Rate (%)',
            },
            nice: false,
            min: 0,
            max: 26,
            label: {
                formatter: ({ value }) => `${value}%`,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [3, 3],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            crossLines: [
                {
                    type: 'line',
                    value: 10,
                    strokeWidth: 1,
                    strokeOpacity: 0.3,
                    lineDash: [4, 4],
                    label: {
                        text: 'Industry Average',
                        position: 'right',
                        padding: 5,
                    },
                },
            ],
        },
    },
    legend: {
        item: {
            marker: {
                size: 12,
                strokeWidth: 0,
            },
        },
    },
};

AgCharts.create(options);
