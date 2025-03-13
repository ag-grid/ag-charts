import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

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
            maxSize: 50,
            tooltip: {
                renderer({ datum, labelKey }) {
                    return {
                        title: datum[labelKey!],
                    };
                },
            },
        },
    ],
    tooltip: {
        pagination: true,
    },
};

AgCharts.create(options);
