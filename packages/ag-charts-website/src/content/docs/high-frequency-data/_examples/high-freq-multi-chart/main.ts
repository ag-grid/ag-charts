// @ag-skip-fws
import { AgChartOptions, AgCharts, time } from 'ag-charts-community';

const refreshRateInMilliseconds = 50;
const millisecondsOfData = 30 * 1000;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 12, 0, 0);

interface DataPoint {
    time: number;
    system: number;
    user: number;
}

const commonConfig = {
    animation: { enabled: false },
    legend: { enabled: false },
    padding: {
        top: 5,
        right: 5,
        bottom: 5,
        left: 5,
    },
    theme: {
        palette: {
            fills: ['#ec4d3d', '#4facf2'],
            strokes: ['#ec4d3d', '#4facf2'],
        },
        overrides: {
            area: {
                title: {
                    fontSize: 10,
                    spacing: 5,
                },
                series: {
                    fillOpacity: 0.5,
                },
            },
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'time',
            yKey: 'system',
            stacked: true,
            yName: 'System',
        },
        {
            type: 'area',
            xKey: 'time',
            yKey: 'user',
            stacked: true,
            yName: 'User',
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            label: {
                enabled: false,
            },
            tick: {
                interval: time.second.every(10),
                size: 3,
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
            min: 0,
            max: 100,
            tick: {
                size: 3,
            },
        },
    ],
};

function createChart(index: number): [AgChartOptions, any] {
    const options: AgChartOptions = {
        container: document.getElementById('myChart' + index),
        data: getData([], index),
        title: {
            text: 'Host ' + index,
        },
        ...commonConfig,
    };

    return [options, AgCharts.create(options)];
}

function getData(inputData: DataPoint[] = [], hostIndex: number = 1): DataPoint[] {
    const data = [...inputData];
    const dataCount = millisecondsOfData / refreshRateInMilliseconds;

    if (data.length === 0) {
        // Initialize with full history
        let timestamp = START_TIMESTAMP - millisecondsOfData;
        for (let i = 0; i < dataCount; i++) {
            timestamp += refreshRateInMilliseconds;
            const baseSystem = 20 + hostIndex * 3;
            const baseUser = 15 + hostIndex * 2;
            data.push({
                time: timestamp,
                system: baseSystem + Math.random() * 30,
                user: baseUser + Math.random() * 30,
            });
        }
    } else {
        // Update data: remove oldest, add newest
        data.shift();
        const lastTime = data[data.length - 1].time;
        const baseSystem = 20 + hostIndex * 3;
        const baseUser = 15 + hostIndex * 2;
        data.push({
            time: lastTime + refreshRateInMilliseconds,
            system: baseSystem + Math.random() * 30,
            user: baseUser + Math.random() * 30,
        });
    }

    return data;
}

const charts: Array<[AgChartOptions, any, number]> = [];
let intervalId: NodeJS.Timeout | undefined;
let isRunning = false;

function updateChartsData() {
    for (const [opts, chart, hostIndex] of charts) {
        opts.data = getData(opts.data as DataPoint[], hostIndex);
        chart.updateDelta({ data: opts.data }).catch((e: any) => console.error(e));
    }
}

function toggleUpdates() {
    const button = document.getElementById('toggleBtn');
    if (isRunning) {
        if (intervalId !== undefined) {
            clearInterval(intervalId);
            intervalId = undefined;
        }
        isRunning = false;
        if (button) button.textContent = 'Start Updates';
        console.log('Stopped updates');
    } else {
        intervalId = setInterval(updateChartsData, refreshRateInMilliseconds);
        isRunning = true;
        if (button) button.textContent = 'Stop Updates';
        console.log(`Started updates every ${refreshRateInMilliseconds}ms`);
    }
}

for (let i = 1; i <= 10; i++) {
    const [options, chart] = createChart(i);
    charts.push([options, chart, i]);
}
