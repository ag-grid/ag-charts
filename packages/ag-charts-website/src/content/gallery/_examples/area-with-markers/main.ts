import {
    AreaSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import { AgChartOptions, AgCharts, BandHighlightModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AreaSeriesModule,
    BandHighlightModule,
    CategoryAxisModule,
    LegendModule,
    NumberAxisModule,
]);
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
                itemStyler: ({ datum, xKey }) => {
                    const industries = ['Technology', 'Healthcare', 'Energy'];
                    return {
                        size: industries.includes(datum[xKey]) ? 9 : 0,
                    };
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            label: {
                rotation: -90,
            },
            bandHighlight: {
                enabled: true,
            },
            crossLines: [
                {
                    type: 'range',
                    range: ['Technology', 'Technology'],
                    lineDash: [5, 6],
                    strokeOpacity: 0.6,
                    label: {
                        text: 'Tech ^12.8%\n___________',
                    },
                },
                {
                    type: 'range',
                    range: ['Healthcare', 'Healthcare'],
                    lineDash: [5, 6],
                    strokeOpacity: 0.6,
                    label: {
                        text: 'Healthcare ^1.0%\n_______________',
                    },
                },
                {
                    type: 'range',
                    range: ['Energy', 'Energy'],
                    lineDash: [5, 6],
                    strokeOpacity: 0.6,
                    label: {
                        text: 'Energy ^0.5%\n____________',
                    },
                },
            ],
        },
        y: {
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
    },
    legend: {
        position: 'top',
    },
};

AgCharts.create(options);
