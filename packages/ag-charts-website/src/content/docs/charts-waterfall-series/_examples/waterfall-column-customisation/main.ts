import { AgChartOptions, AgEnterpriseCharts, AgWaterfallSeriesTooltipRendererParams } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: 'All values in £ billions',
    },
    series: [
        {
            type: 'waterfall-column',
            xKey: 'source',
            xName: 'Source',
            yKey: 'amount',
            yName: 'Amount',
            totals: [
                { totalType: 'subtotal', index: 4, axisLabel: 'Total \nRevenue' },
                { totalType: 'subtotal', index: 10, axisLabel: 'Total \nExpenditure' },
                { totalType: 'total', index: 10, axisLabel: 'Borrowing' },
            ],
            item: {
                positive: {
                    label: {
                        enabled: false,
                    },
                },
                total: {
                    formatter: ({ itemId }) => {
                        const color = itemId === 'subtotal' ? `#FAC858` : '#EE6666';
                        return {
                            fill: color,
                            stroke: color,
                        };
                    },
                    name: 'Total / Subtotal',
                    label: {
                        enabled: true,
                        fontWeight: 'bold',
                        formatter: ({ value, itemId }) => {
                            const val =
                                itemId === 'total'
                                    ? `£${Math.abs(value)}bn`
                                    : `${value > 0 ? '+' : '-'}£${Math.abs(value)}bn`;
                            return val;
                        },
                    },
                    tooltip: {
                        renderer: ({ yValue, itemId }: AgWaterfallSeriesTooltipRendererParams) => ({
                            content: `${
                                itemId === 'subtotal' ? (yValue > 0 ? 'Revenue' : 'Expenditure') : 'Total'
                            }: ${yValue}`,
                        }),
                    },
                },
            },
        },
    ],
    axes: [
        {
            position: 'left',
            type: 'number',
            tick: { values: [0], color: 'black', width: 2 },
            line: { width: 0 },
            gridStyle: [{ stroke: 'black', lineDash: [0] }],
        },
        { position: 'bottom', type: 'category', line: { width: 0 } },
    ],
};

AgEnterpriseCharts.create(options);
