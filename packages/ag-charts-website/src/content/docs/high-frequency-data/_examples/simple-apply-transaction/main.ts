import { AgChartInstance, AgChartOptions, AgCharts } from 'ag-charts-community';

const data: any[] = [];
const startTime = Date.now();

// Generate initial data
for (let i = 0; i < 20; i++) {
    data.push({
        time: startTime + i * 1000,
        value: Math.random() * 50 + 25,
    });
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            stroke: '#5090DC',
            marker: {
                enabled: false,
            },
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            label: {
                format: '%H:%M:%S',
            },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: ({ value }) => value.toFixed(0),
            },
        },
    ],
};

const chart: AgChartInstance = AgCharts.create(options);

let isRunning = false;
let intervalId: number | undefined;
let updateCount = 0;

function updateChart() {
    const newDataPoint = {
        time: Date.now(),
        value: Math.random() * 50 + 25,
    };

    // Add new point
    data.push(newDataPoint);

    // Remove old points to maintain window of 20 items
    const itemsToRemove = [];
    while (data.length > 20) {
        itemsToRemove.push(data[0]);
        data.shift();
    }

    chart.applyTransaction({
        add: [newDataPoint],
        remove: itemsToRemove,
    });

    updateCount++;
    updateCounter();
}

function updateCounter() {
    const counterElement = document.getElementById('updateCounter');
    if (counterElement) {
        counterElement.textContent = updateCount.toString();
    }
}

function startUpdates() {
    if (isRunning) return;
    isRunning = true;
    updateButton();
    intervalId = window.setInterval(updateChart, 500);
}

function stopUpdates() {
    if (!isRunning) return;
    isRunning = false;
    updateButton();
    if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
    }
}

function toggleUpdates() {
    if (isRunning) {
        stopUpdates();
    } else {
        startUpdates();
    }
}

function updateButton() {
    const button = document.getElementById('toggleButton');
    if (button) {
        button.textContent = isRunning ? 'Stop' : 'Start';
    }
}
