import { AgCartesianChartOptions, AgCharts, AgTimeAxisThemeOptions, time } from 'ag-charts-community';

const options: AgCartesianChartOptions & { axes: AgTimeAxisThemeOptions[] } = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Monthly average daily temperatures in the UK',
    },
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'temp',
        },
    ],
    axes: [
        {
            type: 'time',
            nice: false,
            position: 'bottom',
            interval: { step: time.month },
            label: {
                format: '%b %Y',
            },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => {
                    return params.value + ' °C';
                },
            },
        },
    ],
    padding: {
        top: 20,
        right: 40,
        bottom: 20,
        left: 20,
    },
    data: [
        {
            date: new Date('01 Jan 2019 00:00:00 GMT'),
            temp: 4.2,
        },
        {
            date: new Date('01 Feb 2019 00:00:00 GMT'),
            temp: 6.9,
        },
        {
            date: new Date('01 Mar 2019 00:00:00 GMT'),
            temp: 7.9,
        },
        {
            date: new Date('01 Apr 2019 00:00:00 GMT'),
            temp: 9.1,
        },
        {
            date: new Date('01 May 2019 00:00:00 GMT'),
            temp: 11.2,
        },
    ],
};

const chart = AgCharts.create(options);

function setOneMonthInterval() {
    options.axes![0].interval!.step = time.month;
    chart.update(options);
}

function setTwoMonthInterval() {
    options.axes![0].interval!.step = time.month.every(2);
    chart.update(options);
}
