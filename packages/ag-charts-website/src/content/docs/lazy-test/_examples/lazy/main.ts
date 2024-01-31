import { AgCartesianChartOptions, AgCharts, AgLineSeriesOptions, AgTimeAxisOptions } from 'ag-charts-enterprise';

import { getCoarseData, getCoarseWithWindowData } from './data';

(window as any).agChartsDebug = 'data-lazy';

const options: any = {
    container: document.getElementById('myChart'),
    // data: getCoarseData(),
    data: ({ axes }: any) => {
        const timeAxis = axes?.find((a: any) => a.type === 'time');

        if (timeAxis) {
            return new Promise((resolve) =>
                setTimeout(() => resolve(getCoarseWithWindowData(timeAxis.min, timeAxis.max)), 500)
            );
        }

        return new Promise((resolve) => setTimeout(() => resolve(getCoarseData()), 500));
    },
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            tick: {
                minSpacing: 50,
                maxSpacing: 200,
            },
        },
    ],
    animation: { enabled: false },
    legend: { enabled: true },
    tooltip: { enabled: false },
    navigator: { enabled: false, min: 0.5, max: 0.55 },
    zoom: {
        enabled: true,
        axes: 'x',
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        enableSelecting: true,
        minVisibleItemsX: 1,
        minVisibleItemsY: 1,
    },
};

const chart = AgCharts.create(options);

function toggleSeriesColor() {
    (options.series![0] as AgLineSeriesOptions).stroke =
        (options.series![0] as AgLineSeriesOptions).stroke === 'red' ? 'blue' : 'red';
    AgCharts.update(chart, options);
}

function changeLazyLoadFunction() {
    options.data = () => {
        return new Promise((resolve) =>
            setTimeout(
                () =>
                    resolve([
                        { time: new Date('2023-04-01 00:00:00'), value: 100 },
                        { time: new Date('2023-04-02 00:00:00'), value: 200 },
                    ]),
                200
            )
        );
    };
    AgCharts.update(chart, options);
}

function changeAxisDomain() {
    (options.axes![1] as AgTimeAxisOptions).min = new Date('2024-02-01 00:00:00');
    (options.axes![1] as AgTimeAxisOptions).max = new Date('2024-02-06 00:00:00');
    AgCharts.update(chart, options);
}
