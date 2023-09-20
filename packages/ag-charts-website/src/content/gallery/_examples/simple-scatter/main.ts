import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Height vs Weight for Major League Baseball Players',
    },
    footnote: {
        text: 'Source: Statistics Online Computational Resource',
    },
    series: [
        {
            type: 'scatter',
            xKey: 'weight',
            yKey: 'height',
            marker: {
                size: 12,
            },
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Weight (Pounds)',
            },
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Height (Inches)',
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
