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
                url: 'https://warehouse1.indicia.org.uk/upload/16/32/23/o_1fg4ef1kejkhqbcul11tkt9nnb.jpg',
                fit: 'cover',
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
