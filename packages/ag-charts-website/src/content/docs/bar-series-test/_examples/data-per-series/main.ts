import { AgCartesianChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    series: [
        {
            type: 'bar',
            xKey: 'product',
            yKey: 'value',
            yName: 'iPad - Retail',
            data: [
                { product: 'Air', value: 400 },
                { product: 'Pro', value: 280 },
            ],
            stackGroup: 'ipad',
        },
        {
            type: 'bar',
            xKey: 'product',
            yKey: 'value',
            yName: 'iPad - Student',
            data: [
                { product: 'Air', value: 140 },
                { product: 'Pro', value: 90 },
            ],
            stackGroup: 'ipad',
        },
        {
            type: 'bar',
            xKey: 'product',
            yKey: 'value',
            yName: 'MacBook - Retail',
            data: [
                { product: 'Air', value: 205 },
                { product: 'Pro 15"', value: 195 },
                { product: 'Pro 16"', value: 500 },
            ],
            stackGroup: 'macbook',
        },
        {
            type: 'bar',
            xKey: 'product',
            yKey: 'value',
            yName: 'MacBook - Student',
            data: [
                { product: 'Air', value: 20 },
                { product: 'Pro 16"', value: 50 },
            ],
            stackGroup: 'macbook',
        },
    ],
};

const chart = AgCharts.create(options);
