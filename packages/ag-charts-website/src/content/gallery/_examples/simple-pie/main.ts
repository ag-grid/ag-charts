import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const numFormatter = new Intl.NumberFormat('en-US');

const options: AgChartOptions = {
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
            sectorLabel: {
                formatter: ({ datum, sectorLabelKey = 'weight' }) => {
                    return `${numFormatter.format(datum[sectorLabelKey])}g`;
                },
            },
            tooltip: {
                renderer: ({ datum, angleKey, calloutLabelKey = 'ingredient' }) => ({
                    title: `${datum[calloutLabelKey]}`,
                    content: `${datum[angleKey]}g`,
                }),
            },
            title: {
                text: 'Recipe',
            },
        },
    ],
    legend: {
        enabled: false,
    },
};
AgCharts.create(options);
