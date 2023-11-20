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
            fills: [
                '#FF3D00',
                '#FF9100',
                '#FFC400',
                '#FFEA00',
                '#C6FF00',
                '#76FF03',
                '#00E676',
                '#1DE9B6',
                '#00E5FF',
                '#00B0FF',
            ],
            strokes: [
                '#FF6E40',
                '#FFAB40',
                '#FFD740',
                '#FFFF00',
                '#EEFF41',
                '#B2FF59',
                '#69F0AE',
                '#64FFDA',
                '#18FFFF',
                '#40C4FF',
            ],
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
