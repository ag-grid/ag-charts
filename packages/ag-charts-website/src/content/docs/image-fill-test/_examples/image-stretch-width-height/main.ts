import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Total Visitors to Tate Galleries',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Modern',
            yName: 'Tate Modern',
            normalizedTo: 100,
            fillOpacity: 1,
            fill: {
                type: 'image',
                url: '${baseWWWUrl}/example-assets/e2e-test-images/parakeet-close-up.png',
                fit: 'stretch',
                width: 400,
                height: 200,
            },
        },
    ],
    legend: {
        enabled: true,
    },
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Total visitors',
            },
        },
    },
};

AgCharts.create(options);
