import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    zoom: {
        enabled: true,
        buttons: {
            buttons: {
                buttons: [
                    {
                        icon: 'zoom-in',
                        tooltip: 'Decrease Visible Range',
                        value: 'zoom-in',
                        label: 'In',
                        section: 'zoom',
                    },
                    {
                        icon: 'zoom-out',
                        tooltip: 'Increase Visible Range',
                        value: 'zoom-out',
                        label: 'Out',
                        section: 'zoom',
                    },
                    {
                        icon: 'pan-start',
                        tooltip: 'Pan to Start',
                        value: 'pan-start',
                        section: 'pan',
                    },
                    {
                        icon: 'pan-end',
                        tooltip: 'Pan to End',
                        value: 'pan-end',
                        section: 'pan',
                    },
                    {
                        tooltip: 'Undo all Zoom',
                        value: 'reset',
                        label: 'Reset',
                        section: 'reset',
                    },
                ],
            },
        },
    },
    tooltip: {
        enabled: false,
    },
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            interval: {
                minSpacing: 50,
                maxSpacing: 200,
            },
            label: {
                autoRotate: false,
            },
            crosshair: {
                label: {
                    format: `%d %b %Y`,
                },
            },
        },
    ],
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'price',
        },
    ],
};

AgCharts.create(options);
