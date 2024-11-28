import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Olympic Medal Counts by Region, Country, and City',
    },
    data: getData(),
    axes: [
        {
            type: 'grouped-category',
            position: 'bottom',
            label: {},
            depthOptions: [
                { tick: { enabled: false } },
                { label: { fontWeight: 'bold' } },
                { label: { fontSize: 10 } },
            ],
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'gold',
            yName: 'Gold',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'silver',
            yName: 'Silver',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'bronze',
            yName: 'Bronze',
        },
    ],
};

const chart = AgCharts.create(options);

document.getElementById('myRotation')?.addEventListener('input', (e: any) => {
    options.axes![0].label!.rotation = Number(e.target.value);
    chart.update(options);
});
