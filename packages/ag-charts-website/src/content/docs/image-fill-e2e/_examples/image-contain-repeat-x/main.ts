import { AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

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
                url: '${baseWWWUrl}/example-assets/e2e-test-images/parakeet-side-eye.png',
                fit: 'contain',
                repeat: 'repeat-x',
                width: 125,
                height: 315,
            },
        },
    ],
    legend: {
        enabled: true,
    },
    axes: {
        x: {
            type: 'unit-time',
        },
        y: {
            type: 'number',
            title: {
                text: 'Total visitors',
            },
        },
    },
};

AgCharts.create(options);
