import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'U.S. GDP Growth',
    },
    subtitle: {
        text: 'Quarterly, Seasonally Adjusted Annual Rate, 2019–2021',
    },
    footnote: {
        text: '−28.1% (Q2 2020), peak +35.2% (Q3 2020)',
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'value',
            yName: 'SAAR %',
            strokeWidth: 2,
            interpolation: {
                type: 'smooth',
            },
            fillOpacity: 0.2,
            segmentation: {
                key: 'y',
                segments: [
                    {
                        stop: 0,
                        fill: 'red',
                        stroke: 'red',
                    },
                ],
            },
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'SAAR %',
            },
        },
    },
};

AgCharts.create(options);
