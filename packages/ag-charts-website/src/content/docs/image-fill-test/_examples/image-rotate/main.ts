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
            fill: {
                type: 'image',
                url: '${baseWWWUrl}/example-assets/e2e-test-images/parakeet-drinking-water.jpg',
                width: 100,
                height: 150,
                rotation: 90,
            },
        },
    ],
    legend: {
        enabled: true,
    },
    axes: [
        {
            type: 'time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Total visitors',
            },
        },
    ],
};

AgCharts.create(options);
