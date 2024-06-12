import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';

import { getData } from './data';

const minSize = 5;
const maxSize = 100;

function calculateColour(size: number) {
    const colours = [
        '#33cc00',
        '#5cc200',
        '#85b800',
        '#adad00',
        '#d6a300',
        '#ff9900',
        '#ff7300',
        '#ff4d00',
        '#ff2600',
        '#ff0000',
    ];
    const position = (size - minSize) / (maxSize - minSize);
    return colours.find((_, i) => {
        return (i + 1) / colours.length > position;
    });
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData().filter(function (d) {
        return d.magnitude > 4;
    }),
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
            yKey: 'minDistance',
            yName: 'Minimum Distance',
            sizeKey: 'magnitude',
            sizeName: 'Magnitude',
            size: minSize,
            maxSize: maxSize,
            strokeWidth: 0,
            fillOpacity: 0.7,
            strokeOpacity: 0.7,
            itemStyler(params) {
                return { fill: params.highlighted ? params.fill : calculateColour(params.size) };
            },
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
                text: 'Minimum distance (km)',
            },
        },
    ],
    seriesArea: {
        padding: {
            left: 20,
            bottom: 15,
        },
    },
};

const chart = AgCharts.create(options);
