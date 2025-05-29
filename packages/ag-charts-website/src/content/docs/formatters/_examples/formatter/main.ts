import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Most Populous Cities',
    },
    footnote: {
        text: 'Source: Simple Maps',
    },
    series: [
        {
            type: 'bubble',
            title: 'Most populous cities',
            xKey: 'lon',
            xName: 'Longitude',
            yKey: 'lat',
            yName: 'Latitude',
            sizeKey: 'population',
            sizeName: 'Population',
            labelKey: 'city',
            labelName: 'City',
            size: 5,
            maxSize: 100,
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            min: -180,
            max: 180,
            interval: { step: 60 },
            nice: false,
        },
        {
            position: 'left',
            type: 'number',
            min: -90,
            max: 90,
            interval: { step: 45 },
            nice: false,
        },
    ],
    formatter: {
        x: (params) => {
            if (params.type !== 'number') return;
            const degrees = Math.trunc(params.value);
            const orientation = degrees > 0 ? 'E' : degrees < 0 ? 'W' : '';
            return `${Math.abs(degrees)}° ${orientation}`;
        },
        y: (params) => {
            if (params.type !== 'number') return;
            const degrees = Math.trunc(params.value);
            const orientation = degrees > 0 ? 'N' : degrees < 0 ? 'S' : '';
            return `${Math.abs(degrees)}° ${orientation}`;
        },
        size: (params) => {
            if (params.type !== 'number') return;
            return params.value.toLocaleString('en-US', { style: 'decimal', maximumFractionDigits: 0 });
        },
    },
};

AgCharts.create(options);
