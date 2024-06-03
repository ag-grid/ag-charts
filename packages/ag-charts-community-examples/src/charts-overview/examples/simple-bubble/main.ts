import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData().filter((d) => d.magnitude > 4),
    title: {
        text: 'Worldwide Earthquakes',
        fontSize: 18,
        spacing: 25,
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
            fill: '#41874b',
            stroke: '#41874b',
            fillOpacity: 0.5,
            strokeOpacity: 0.5,
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Depth (m)',
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Magnitude',
            },
        },
    ],
    seriesArea: {
        padding: {
            left: 40,
        },
    },
    tooltip: {
        range: 'exact',
    },
};

const chart = AgCharts.create(options);
