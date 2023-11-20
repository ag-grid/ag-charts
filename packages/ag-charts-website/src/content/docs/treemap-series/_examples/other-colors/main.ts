import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'treemap',
            labelKey: 'title',
            sizeKey: 'total',
            colorKey: 'change',
            colorRange: ['rgb(234, 82, 80)', 'rgb(67, 153, 83)'],
            fills: ['#455A64'],
            group: {
                stroke: '#37474F',
            },
            tooltip: {
                renderer: (params) => {
                    const { total, change } = params.datum;
                    if (total != null && change != null) {
                        const changeString = `${change > 0 ? '+' : '-'}£${Math.abs(change).toFixed(1)}bn`;
                        return { content: `£${total.toFixed(1)}bn (${changeString} from 2023)` };
                    } else {
                        return {};
                    }
                },
            },
        },
    ],
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: '2024',
    },
};

AgCharts.create(options);
