import { AgChartOptions, AgCharts, time } from 'ag-charts-community';

var lastTime = new Date('07 Jan 2020 13:25:00 GMT').getTime();
var data: { time: Date; voltage: number }[] = [];

function getData() {
    data.shift();

    while (data.length < 20) {
        data.push({
            time: new Date((lastTime += 1000)),
            voltage: 1.1 + Math.random() / 2,
        });
    }

    return data;
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            xKey: 'time',
            yKey: 'voltage',
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            tick: {
                interval: time.second.every(5),
            },
            label: {
                format: '%H:%M:%S',
            },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                format: '#{.2f}V',
            },
        },
    ],
    title: {
        text: 'Core Voltage',
    },
};

const chart = AgCharts.create(options);
var updating = false;

function startUpdates() {
    if (updating) {
        return;
    }

    updating = true;
    update();
    setInterval(update, 500);
}

function update() {
    options.data = getData();
    AgCharts.update(chart, options);
}

if (typeof window !== 'undefined') {
    // Attach external event handlers to window so they can be called from index.html
    (window as any).startUpdates = startUpdates;
}
