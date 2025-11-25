import { ModuleRegistry, NumberAxisModule, UnitTimeAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import { AnimationModule, RangeAreaSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    NumberAxisModule,
    RangeAreaSeriesModule,
    UnitTimeAxisModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Understanding Japan's Seismic Hazard`,
    },
    subtitle: {
        text: `Earthquake Magnitude Range from 1958 to 2023`,
    },
    animation: {
        enabled: true,
        duration: 800,
    },
    tooltip: {
        mode: 'compact',
    },
    series: [
        {
            type: 'range-area',
            xKey: 'year',
            xName: 'Year',
            yLowKey: 'magnitudeLow',
            yHighKey: 'magnitudeHigh',
            yLowName: 'Minimum Magnitude',
            yHighName: 'Maximum Magnitude',
            strokeWidth: 2,
            fillOpacity: 0.5,
            interpolation: {
                type: 'smooth',
            },
            marker: {
                enabled: true,
                size: 6,
            },
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
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
            title: {
                text: 'Year',
            },
            crossLines: [
                {
                    type: 'line',
                    value: new Date(2011, 2, 11),
                    strokeWidth: 2,
                    lineDash: [5, 5],
                    label: {
                        text: '2011 Tōhoku Earthquake',
                    },
                },
                {
                    type: 'line',
                    value: new Date(1995, 0, 17),
                    strokeWidth: 2,
                    lineDash: [5, 5],
                    label: {
                        text: '1995 Kobe Earthquake',
                    },
                },
            ],
        },
        y: {
            type: 'number',
            position: 'left',
            min: 4,
            max: 10,
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
            title: {
                text: 'Magnitude (Richter Scale)',
            },
        },
    },
};

AgCharts.create(options);
