import { AgChart, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Vehicle Weight Distribution',
    },
    subtitle: {
        text: 'USA 1987',
    },
    footnote: {
        text: 'Source: UCI',
    },
    series: [
        {
            type: 'histogram',
            xKey: 'curb-weight',
            xName: 'Curb weight',
            bins: [
                [0, 2000],
                [2000, 3000],
                [3000, 4000],
            ],
            areaPlot: true,
            tooltip: {
                renderer: (params) => {
                    const paramsMax = params.datum.domain[1];
                    const sizeName = paramsMax === 2000 ? 'small' : paramsMax === 3000 ? 'medium' : 'large';

                    return {
                        content:
                            '<b>' +
                            params.datum.frequency +
                            '</b> vehicles in the <b>' +
                            sizeName +
                            '</b> category by <b>' +
                            params.xName!.toLowerCase() +
                            '</b>',
                    };
                },
            },
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Curb weight (pounds)',
            },
        },
        {
            position: 'left',
            type: 'number',
            label: {
                formatter: () => {
                    return '';
                },
            },
        },
    ],
};

AgChart.create(options);
