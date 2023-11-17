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
            tooltip: {
                renderer: (params) => {
                    const { total } = params.datum;
                    if (total != null) {
                        return { content: `£${total.toFixed(1)}bn` };
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
