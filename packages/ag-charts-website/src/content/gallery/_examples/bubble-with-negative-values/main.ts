import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Most Populous Cities',
    },
    footnote: {
        text: 'Source: Simple Maps',
    },
    series: [
        {
            type: 'bubble',
            title: 'Most populous cities',
            xKey: 'lon',
            xName: 'Longitude',
            yKey: 'lat',
            yName: 'Latitude',
            sizeKey: 'population',
            sizeName: 'Population',
            labelKey: 'city',
            labelName: 'City',
            size: 5,
            maxSize: 100,
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Longitude',
            },
            min: -180,
            max: 180,
            nice: false,
            crossLines: [
                {
                    type: 'line',
                    value: 0,
                    label: {
                        text: 'North',
                        position: 'top',
                    },
                },
            ],
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Latitude',
            },
            min: -90,
            max: 90,
            nice: false,
            crossLines: [
                {
                    type: 'line',
                    value: 0,
                    label: {
                        text: 'East',
                        position: 'right',
                    },
                },
            ],
        },
    ],
};

AgCharts.create(options);
