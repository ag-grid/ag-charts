import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData, random } from './data';

const FAST = 300;
const SLOW = 1000;

// Series type data options
let start = [120, 150, 130, 140, 80];
let variance = 20;
let offset = 0;
let length = 8;
let seed = 1234;
let duration = SLOW;

let interval: any;

function barOptions(): AgChartOptions {
    return {
        container: document.getElementById('myChart'),
        animation: {
            enabled: true,
            duration,
        },
        data: getGeneratedData(),
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
                type: 'number',
                position: 'bottom',
                nice: false,
                label: {
                    autoRotate: false,
                },
            },
        ],
    };
}

function lineOptions(): AgChartOptions {
    return {
        container: document.getElementById('myChart'),
        animation: {
            enabled: true,
            duration,
        },
        data: getGeneratedData(),
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
}

function areaOptions(): AgChartOptions {
    return {
        container: document.getElementById('myChart'),
        animation: {
            enabled: true,
            duration,
        },
        data: getGeneratedData(),
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
}

function pieOptions(): AgChartOptions {
    return {
        container: document.getElementById('myChart'),
        animation: {
            enabled: true,
            duration,
        },
        data: getGeneratedData(),
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
                innerRadiusRatio: 0.3,
            },
            {
                type: 'pie',
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
}

// Create chart
const options = barOptions();
const chart = AgEnterpriseCharts.create(options);

// Elements
const tickingButton = document.getElementById('animation-data-updates__toggle-ticking');
const speedButton = document.getElementById('animation-data-updates__toggle-speed');
const actionButtons = document.getElementsByClassName('animation-data-updates__action');

// User-facing actions
function changeSeriesBar() {
    variance = 20;
    offset = 0;
    length = 8;
    seed = 1234;

    AgEnterpriseCharts.update(chart, barOptions());
}

function changeSeriesLine() {
    variance = 4;
    offset = 0;
    length = 30;
    seed = 1234;

    AgEnterpriseCharts.update(chart, lineOptions());
}

function changeSeriesArea() {
    variance = 20;
    offset = 0;
    length = 30;
    seed = 1234;

    AgEnterpriseCharts.update(chart, areaOptions());
}

function changeSeriesPie() {
    variance = 30;
    offset = 0;
    length = 6;
    seed = 1234;

    AgEnterpriseCharts.update(chart, pieOptions());
}

function toggleTickingUpdates() {
    toggleUpdatesText();
    toggleActionButtons();
    toggleInterval();
}

function toggleSpeed() {
    if (duration === FAST) {
        duration = SLOW;
        speedButton!.textContent = 'Set Speed: Fast';
    } else {
        duration = FAST;
        speedButton!.textContent = 'Set Speed: Slow';
    }

    toggleInterval();
    toggleInterval();
}

function add() {
    offset++;
    length++;
    updateChart();
}

function remove() {
    length--;
    updateChart();
}

function update() {
    seed = Math.floor(random() * 1000);
    updateChart();
}

function addRemoveUpdate() {
    offset++;
    seed = Math.floor(random() * 1000);
    updateChart();
}

// Private functions
function toggleInterval() {
    if (!interval) {
        interval = setInterval(() => {
            offset++;
            updateChart();
        }, duration * 2);
    } else {
        clearInterval(interval);
        interval = undefined;
    }
}

function toggleUpdatesText() {
    if (!interval) {
        tickingButton!.textContent = 'Stop Ticking Updates';
    } else {
        tickingButton!.textContent = 'Start Ticking Updates';
    }
}

function toggleActionButtons() {
    if (!interval) {
        for (let i = 0; i < actionButtons.length; i++) {
            actionButtons.item(i)?.setAttribute('disabled', 'disabled');
        }
    } else {
        for (let i = 0; i < actionButtons.length; i++) {
            actionButtons.item(i)?.removeAttribute('disabled');
        }
    }
}

function updateChart() {
    AgEnterpriseCharts.updateDelta(chart, { data: getGeneratedData(), animation: { duration } });
}

function getGeneratedData() {
    return getData(start, variance, offset, length, seed);
}
