import type { AgCartesianChartOptions, AgZoomOnDataChangeStrategy } from 'ag-charts-enterprise';
import { AgCharts } from 'ag-charts-enterprise';

import { getData, getDataPointAtEnd, getDataPointAtMiddle, getDataPointAtStart } from './data';

let data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Zoom Data Change Strategies',
    },
    subtitle: {
        text: 'Zoom in, then add data to see the strategy in action',
    },
    data,
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'price',
            marker: { enabled: true },
        },
    ],
    axes: {
        x: {
            type: 'time',
        },
        y: {
            type: 'number',
            title: { text: 'Price' },
        },
    },
    zoom: {
        enabled: true,
        onDataChange: {
            strategy: 'preserveDomain',
        },
    },
    navigator: {
        enabled: true,
        miniChart: {
            enabled: true,
        },
    },
};

const chart = AgCharts.create(options);

function setStrategy(strategy: AgZoomOnDataChangeStrategy) {
    options.zoom!.onDataChange = { strategy };
    chart.update(options);
}

function addDataAtStart() {
    const newPoint = getDataPointAtStart(data);
    data = [newPoint, ...data];
    options.data = data;
    chart.update(options);
}

function addDataAtMiddle() {
    const newPoint = getDataPointAtMiddle(data);
    const middleIndex = Math.floor(data.length / 2);
    data = [...data.slice(0, middleIndex), newPoint, ...data.slice(middleIndex)];
    options.data = data;
    chart.update(options);
}

function addDataAtEnd() {
    const newPoint = getDataPointAtEnd(data);
    data = [...data, newPoint];
    options.data = data;
    chart.update(options);
}

function resetData() {
    data = getData();
    options.data = data;
    chart.update(options);
}
