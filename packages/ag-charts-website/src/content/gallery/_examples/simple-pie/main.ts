import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const numFormatter = new Intl.NumberFormat('en-US');

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Apple Pie',
    },
    subtitle: {
        text: 'Easy Apple Pie (Serves 4)',
    },
    footnote: {
        text: 'Bake the pie in the oven for 25 minutes at 180℃',
    },
    series: [
        {
            data: getData(),
            type: 'pie',
            calloutLabelKey: 'ingredient',
            sectorLabelKey: 'weight',
            angleKey: 'weight',
            calloutLabel: {
                offset: 10,
            },
            title: {
                text: 'Recipe',
            },
        },
    ],
    legend: {
        enabled: false,
    },
    formatter: (params) =>
        typeof params.value === 'number' ? `${numFormatter.format(params.value)}g` : String(params.value),
};
AgCharts.create(options);
