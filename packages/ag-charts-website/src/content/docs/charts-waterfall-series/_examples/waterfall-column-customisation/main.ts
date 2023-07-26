import { AgChartOptions, AgEnterpriseCharts, AgWaterfallSeriesTooltipRendererParams } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Waterfall Column',
    },
    series: [
        {
            type: 'waterfall-column',
            xKey: 'date',
            xName: 'Date',
            yKey: 'amount',
            yName: 'Amount',
            typeKey: 'datumType',
            positiveItem: {
                label: {
                    enabled: false,
                },
            },
            totalItem: {
                label: {
                    enabled: true,
                    formatter: ({ value }) => `${value.toFixed(0)}`,
                },
                tooltip: {
                    renderer: ({ yValue, itemId }: AgWaterfallSeriesTooltipRendererParams) => ({
                        content: `${itemId === 'subtotal' ? 'Subtotal' : 'Total'}: ${yValue}`,
                    }),
                },
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
