import { BubbleSeriesModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, LineSeriesModule, NumberAxisModule]);
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
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
            title: {
                text: 'Longitude',
            },
            min: -180,
            max: 180,
            nice: false,
            crossLines: [
                {
                    type: 'line',
                    value: 0,
                    label: {
                        text: 'North',
                        position: 'top',
                    },
                },
            ],
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Latitude',
            },
            min: -90,
            max: 90,
            nice: false,
            crossLines: [
                {
                    type: 'line',
                    value: 0,
                    label: {
                        text: 'East',
                        position: 'right',
                    },
                },
            ],
        },
    },
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
