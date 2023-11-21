import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'treemap',
            labelKey: 'title',
            secondaryLabelKey: 'total',
            sizeKey: 'total',
            group: {
                label: {
                    fontSize: 18,
                    spacing: 2,
                },
            },
            tile: {
                label: {
                    fontSize: 24,
                    minimumFontSize: 9,
                    spacing: 8,
                },
                secondaryLabel: {
                    formatter: (params) => `£${params.value.toFixed(1)}bn`,
                },
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
