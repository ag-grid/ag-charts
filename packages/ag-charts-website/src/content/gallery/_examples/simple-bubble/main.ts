import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData().filter(function (d) {
        return d.magnitude > 4;
    }),
    title: {
        text: 'Worldwide Earthquakes',
    },
    footnote: {
        text: 'Source: US Geological Survey',
    },
    series: [
        {
            type: 'bubble',
            xKey: 'depth',
            xName: 'Depth',
            yKey: 'magnitude',
            yName: 'Magnitude',
            sizeKey: 'minDistance',
            sizeName: 'Minimum Distance',
            size: 5,
            maxSize: 100,
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Depth (m)',
            },
            nice: false,
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Magnitude',
            },
            nice: false,
        },
    },
    seriesArea: {
        padding: {
            left: 40,
        },
    },
    tooltip: {
        range: 'exact',
    },
};

AgCharts.create(options);
