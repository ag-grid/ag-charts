import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Monthly Sales' },
    data: [
        { month: 'Jan', sales: 50, purchases: 60 },
        { month: 'Feb', sales: 75, purchases: 70 },
        { month: 'Mar', sales: undefined, purchases: 90 },
        { month: 'Apr', sales: undefined, purchases: undefined },
        { month: 'May', sales: 45, purchases: 100 },
        { month: 'Jun', sales: 80, purchases: 60 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sales',
            yName: 'Sales',
            tooltip: {
                renderer: (params) => {
                    return `<div class="ag-charts-tooltip-content">
                        <b>${params.datum.month}</b>: ${params.datum.sales} units sold
                    </div>`;
                },
            },
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'purchases',
            yName: 'Purchases',
        },
    ],
};

AgCharts.create(options);
