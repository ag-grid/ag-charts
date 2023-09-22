import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
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
            marker: {
                size: 5,
                maxSize: 100,
            },
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Depth (m)',
            },
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Magnitude',
            },
        },
    ],
    seriesArea: {
        padding: {
            left: 40,
        }
    },
    tooltip: {
        range: 'exact',
    },
};

AgEnterpriseCharts.create(options);
