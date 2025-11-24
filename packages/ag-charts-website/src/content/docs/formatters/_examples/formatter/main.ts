import {
    BubbleSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, LegendModule, NumberAxisModule, TimeAxisModule]);
const magnitudeFormatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
});

const deathsFormatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
});

const yearFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
});

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Earthquakes in the 21st Century',
    },
    series: [
        {
            type: 'bubble',
            title: 'Earthquakes',
            xKey: 'date',
            xName: 'Date',
            yKey: 'magnitude',
            yName: 'Magnitude',
            sizeKey: 'deaths',
            sizeName: 'Deaths',
            labelKey: 'location',
            labelName: 'Location',
            size: 5,
            maxSize: 100,
            label: {
                enabled: true,
                placement: 'right',
            },
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'time',
            title: {
                text: 'Date',
            },
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Magnitude',
            },
        },
    },
    formatter: {
        x: (params) => {
            if (params.type !== 'date') return;
            const formatter = params.unit === 'year' ? yearFormatter : dateFormatter;
            return formatter.format(params.value);
        },
        y: (params) => {
            if (params.type !== 'number') return;
            return `${magnitudeFormatter.format(params.value)} Mw`;
        },
        size: (params) => {
            if (params.type !== 'number') return;
            return deathsFormatter.format(params.value);
        },
        label: (params) => {
            if (params.source === 'series-label') return params.datum.flag;
        },
    },
};

AgCharts.create(options);
