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
                url: 'https://i.guim.co.uk/img/media/8c170a68bfcbf549c6ff476c21bc4f4e3e7241c4/1240_211_4760_2856/master/4760.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=4068949020f4c628fb12d8ddb0c2c947',
                width: 300,
                height: 300,
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
