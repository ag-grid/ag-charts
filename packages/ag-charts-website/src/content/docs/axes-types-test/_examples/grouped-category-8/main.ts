import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Comparison of Sales, Costs, and Profit Across Previous Years and Origins',
    },
    series: [
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'salary',
            yName: 'Salary',
            stacked: true,
            label: { enabled: true },
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'subcon',
            yName: 'Subcon',
            stacked: true,
            label: { enabled: true },
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'travel',
            yName: 'Travel',
            stacked: true,
            label: { enabled: true },
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'visa',
            yName: 'Visa',
            stacked: true,
            label: { enabled: true },
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'others',
            yName: 'Others',
            stacked: true,
            label: { enabled: true },
        },
    ],
    axes: {
        x: {
            type: 'grouped-category',
        },
    },
};

const chart = AgCharts.create(options);

document.getElementById('myRotation')?.addEventListener('input', (e: any) => {
    options.axes!.x!.label!.rotation = Number(e.target.value);
    chart.update(options);
});
