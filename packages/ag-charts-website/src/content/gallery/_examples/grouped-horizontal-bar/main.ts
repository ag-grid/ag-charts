import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import { AgChartOptions, AgCharts, BandHighlightModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    BandHighlightModule,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    NumberAxisModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Changes in Prison Population',
    },
    footnote: {
        text: "Source: Ministry of Justice, HM Prison Service, and HM's Prison and Probation Service",
        fontStyle: 'italic',
    },
    legend: {
        position: {
            placement: 'right-top',
            floating: true,
        },
        border: {
            enabled: true,
            strokeWidth: 1,
        },
        cornerRadius: 20,
        padding: 16,
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'month',
            yKey: 'menDelta',
            yName: 'Male',
            cornerRadius: 20,
            strokeWidth: 1,
            label: {
                enabled: true,
            },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'month',
            yKey: 'womenDelta',
            yName: 'Female',
            cornerRadius: 20,
            strokeWidth: 1,
            label: {
                enabled: true,
            },
        },
    ],
    axes: {
        y: {
            type: 'category',
            position: 'left',
            line: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
            paddingInner: 0.2,
            bandHighlight: {
                enabled: true,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 'Jul',
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: '→ JUL',
                        position: 'inside-right',
                    },
                },
                {
                    type: 'range',
                    range: ['Aug', 'Aug'],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: '→ AUG',
                        position: 'inside-right',
                    },
                },
                {
                    type: 'range',
                    range: ['Sep', 'Sep'],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: '→ SEP',
                        position: 'inside-right',
                    },
                },
                {
                    type: 'range',
                    range: ['Oct', 'Oct'],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: '→ OCT',
                        position: 'inside-right',
                    },
                },
                {
                    type: 'range',
                    range: ['Nov', 'Nov'],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: 'NOV ←',
                        position: 'inside-left',
                    },
                },
                {
                    type: 'range',
                    range: ['Dec', 'Dec'],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: 'DEC ←',
                        position: 'inside-left',
                    },
                },
            ],
        },
        x: {
            type: 'number',
            position: 'bottom',
            nice: false,
            min: -300,
            max: 500,
            title: {
                text: 'Change in Population',
            },
            label: {
                enabled: true,
                formatter: (params: { value: number }) => `${params.value > 0 ? '+' : ''}${params.value}`,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
    },
};

AgCharts.create(options);
