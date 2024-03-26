import { AgCartesianChartOptions, AgChartOptions, AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

import { getData, random } from './data';

// Series type data options
let start = [120, 150, 130, 140, 80];
let variance = 20;
let offset = 0;
let length = 8;
let seed = 1234;

let interval: any;

const barOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'one',
            yName: 'One',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'two',
            yName: 'Two',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'three',
            yName: 'Three',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'four',
            yName: 'Four',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'five',
            yName: 'Five',
            stacked: true,
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'category',
            position: 'bottom',
            label: {
                autoRotate: false,
            },
        },
    ],
};

const lineOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'one',
            yName: 'One',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'two',
            yName: 'Two',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'three',
            yName: 'Three',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'four',
            yName: 'Four',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'five',
            yName: 'Five',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
            label: {
                autoRotate: false,
            },
        },
    ],
};

const areaOptions: AgCartesianChartOptions = {
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'one',
            yName: 'One',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'two',
            yName: 'Two',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'three',
            yName: 'Three',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'four',
            yName: 'Four',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'five',
            yName: 'Five',
            stacked: true,
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
            label: {
                autoRotate: false,
            },
        },
    ],
};

const donutOptions: AgPolarChartOptions = {
    series: [
        {
            type: 'pie',
            title: {
                text: 'One',
            },
            calloutLabelKey: 'year',
            legendItemKey: 'year',
            angleKey: 'one',
            outerRadiusRatio: 0.6,
        },
        {
            type: 'donut',
            title: {
                text: 'Two',
            },
            calloutLabelKey: 'year',
            legendItemKey: 'year',
            angleKey: 'two',
            innerRadiusRatio: 0.7,
            showInLegend: false,
        },
    ],
};

let options: AgCartesianChartOptions | AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    data: getGeneratedData(),
    ...barOptions,
};

// Create chart
const chart = AgCharts.create(options);

// Elements
const tickingButton = document.getElementsByClassName('animation-data-updates__toggle-ticking')[0];
const actionButtons = document.getElementsByClassName('animation-data-updates__action');

if (tickingButton) {
    tickingButton.textContent = 'Start Ticking Updates';
}

function changeSeriesBar() {
    variance = 20;
    offset = 0;
    length = 8;
    seed = 1234;

    options.series = barOptions.series;
    options.axes = barOptions.axes;
    options.data = getGeneratedData();

    AgCharts.update(chart, options);
}

function changeSeriesLine() {
    variance = 4;
    offset = 0;
    length = 30;
    seed = 1234;

    options.series = lineOptions.series;
    options.axes = lineOptions.axes;
    options.data = getGeneratedData();

    AgCharts.update(chart, options);
}

function changeSeriesArea() {
    variance = 20;
    offset = 0;
    length = 30;
    seed = 1234;

    options.series = areaOptions.series;
    options.axes = areaOptions.axes;
    options.data = getGeneratedData();

    AgCharts.update(chart, options);
}

function changeSeriesDonut() {
    variance = 30;
    offset = 0;
    length = 6;
    seed = 1234;

    options.series = donutOptions.series;
    options.axes = donutOptions.axes;
    options.data = getGeneratedData();

    AgCharts.update(chart, options);
}

function toggleTickingUpdates() {
    if (tickingButton) {
        if (!interval) {
            tickingButton.textContent = 'Stop Ticking Updates';
        } else {
            tickingButton.textContent = 'Start Ticking Updates';
        }
    }

    if (actionButtons && actionButtons.length > 0) {
        if (!interval) {
            for (let i = 0; i < actionButtons.length; i++) {
                const item = actionButtons.item(i);
                if (!item) continue;
                item.setAttribute('disabled', 'disabled');
            }
        } else {
            for (let i = 0; i < actionButtons.length; i++) {
                const item = actionButtons.item(i);
                if (!item) continue;
                item.removeAttribute('disabled');
            }
        }
    }

    if (!interval) {
        offset++;
        options.data = getGeneratedData();
        AgCharts.update(chart, options);
        interval = setInterval(() => {
            offset++;
            options.data = getGeneratedData();
            AgCharts.update(chart, options);
        }, 2000);
    } else {
        clearInterval(interval);
        interval = undefined;
    }
}

function add() {
    offset++;
    length++;
    options.data = getGeneratedData();
    AgCharts.update(chart, options);
}

function remove() {
    length = Math.max(0, length - 1);
    options.data = getGeneratedData();
    AgCharts.update(chart, options);
}

function update() {
    seed = Math.floor(random() * 1000);
    options.data = getGeneratedData();
    AgCharts.update(chart, options);
}

function addRemoveUpdate() {
    offset++;
    seed = Math.floor(random() * 1000);
    options.data = getGeneratedData();
    AgCharts.update(chart, options);
}

function getGeneratedData() {
    return getData(start, variance, offset, length, seed);
}
