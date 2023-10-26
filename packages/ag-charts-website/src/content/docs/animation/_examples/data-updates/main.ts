import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const FAST = 300;
const SLOW = 1000;
let duration = SLOW;

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
        duration,
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'spending',
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

const chart = AgEnterpriseCharts.create(options);
const updatesButton = document.getElementById('animation-data-updates__toggle-updates');
const speedButton = document.getElementById('animation-data-updates__toggle-speed');
let interval: any;
let offset = 0;

function toggleUpdates() {
    toggleUpdatesText();
    toggleInterval()
}

function toggleInterval() {
    if (!interval) {
        interval = setInterval(() => {
            AgEnterpriseCharts.updateDelta(chart, { data: getData(++offset), animation: { duration } });
        }, duration * 2);
    } else {
        clearInterval(interval);
        interval = undefined;
    }
}

function toggleUpdatesText() {
    if (!interval) {
        updatesButton!.textContent = 'Stop Updates';
    } else {
        updatesButton!.textContent = 'Start Updates';
    }
}

function toggleSpeed() {
    if (duration === FAST) {
        duration = SLOW;
        speedButton!.textContent = 'Fast';
    } else {
        duration = FAST;
        speedButton!.textContent = 'Slow';
    }

    toggleInterval();
    toggleInterval();
}
