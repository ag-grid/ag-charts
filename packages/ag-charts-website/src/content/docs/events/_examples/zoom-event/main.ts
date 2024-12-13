import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: '2023 Average Temperatures',
    },
    subtitle: {
        text: 'Oxford, UK',
    },
    zoom: {
        enabled: true,
        anchorPointX: 'pointer',
    },
    listeners: {
        zoom: (event) => {
            const percentX = Math.floor(100 / (event.ratioX.end - event.ratioX.start));
            const percentY = Math.floor(100 / (event.ratioY.end - event.ratioY.start));
            options.subtitle!.text = `Zoom: x = ${percentX}%, y = ${percentY}%`;
            chart.update(options);
        },
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            xName: 'Month',
            yKey: 'min',
            yName: 'Min Temperature',
            interpolation: { type: 'smooth' },
        },
        {
            type: 'line',
            xKey: 'month',
            xName: 'Month',
            yKey: 'max',
            yName: 'Max Temperature',
            interpolation: { type: 'smooth' },
        },
    ],
};

const chart = AgCharts.create(options);
