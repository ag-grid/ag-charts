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
            totals: [
                { totalType: 'subtotal', index: 4, axisLabel: 'Subtotal 1' },
                { totalType: 'subtotal', index: 9, axisLabel: 'Subtotal 2' },
                { totalType: 'total', index: 10, axisLabel: 'Total' },
            ],
            item: {
                positive: {
                    label: {
                        enabled: false,
                    },
                },
                total: {
                    name: 'Total / Subtotal',
                    fill: '#EE6666',
                    stroke: '#EE6666',
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
        },
    ],
};

AgEnterpriseCharts.create(options);
