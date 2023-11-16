import { AgCartesianChartOptions, AgEnterpriseCharts, AgErrorBarFormatterParams } from 'ag-charts-enterprise';

import { getData, getData2 } from './data';

type Datum = ReturnType<typeof getData>[number];

const highlightStyle = {
    item: { stroke: 'red' },
    series: { dimOpacity: 0.3 },
};

const formatter = (param: AgErrorBarFormatterParams) => {
    const errorBarStyle = { strokeWidth: 3 };
    if (param.highlighted) {
        return { ...errorBarStyle, ...highlightStyle.item };
    } else {
        return errorBarStyle;
    }
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Monthly Average Temperatures with Error Bars (Celsius)',
    },
    series: [
        {
            data: getData(),
            xKey: 'month',
            yKey: 'temperature',
            yName: 'Canada',
            errorBar: {
                yLowerKey: 'temperatureLower',
                yUpperKey: 'temperatureUpper',
                formatter,
            },
            highlightStyle,
        },
        {
            data: getData2(),
            xKey: 'month',
            yKey: 'temperature',
            yName: 'Australia',
            errorBar: {
                yLowerKey: 'temperatureLower',
                yUpperKey: 'temperatureUpper',
                formatter,
            },
            highlightStyle,
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);

function line() {
    if (options.series !== undefined) {
        for (const opt of options.series) {
            opt.type = 'line';
        }
    }
    AgEnterpriseCharts.update(chart, options);
}

function bar() {
    if (options.series !== undefined) {
        for (const opt of options.series) {
            opt.type = 'bar';
        }
    }
    AgEnterpriseCharts.update(chart, options);
}

function resetData() {
    if (options.series !== undefined) {
        options.series[0].data = getData();
        options.series[1].data = getData2();
    }
    AgEnterpriseCharts.update(chart, options);
}

function removeOdds() {
    if (options.series !== undefined) {
        const fn = (_value: Datum, index: number) => {
            return index % 2 === 0;
        };
        options.series[0].data = getData().filter(fn);
        options.series[1].data = getData2().filter(fn);
    }
    AgEnterpriseCharts.update(chart, options);
}

function removeOddsErrors() {
    if (options.series !== undefined) {
        const fn = (value: Datum, index: number) => {
            if (index % 2 === 1) {
                const { month, temperature } = value;
                return { month, temperature };
            } else {
                return value;
            }
        };
        options.series[0].data = getData().map(fn);
        options.series[1].data = getData2().map(fn);
    }
    AgEnterpriseCharts.update(chart, options);
}

function randomDelta(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function randomiseData() {
    if (options.series !== undefined) {
        const fn = (value: Datum, index: number): Datum => {
            const delta = randomDelta(-4, 4);
            return {
                month: value.month,
                temperature: value.temperature + delta,
                temperatureLower: value.temperatureLower + delta,
                temperatureUpper: value.temperatureUpper + delta,
            };
        };
        options.series[0].data = getData().map(fn);
        options.series[1].data = getData2().map(fn);
    }
    AgEnterpriseCharts.update(chart, options);
}

function randomiseErrors() {
    if (options.series !== undefined) {
        const fn = (value: Datum, index: number): Datum => {
            const delta = randomDelta(-2, 2);
            return {
                month: value.month,
                temperature: value.temperature,
                temperatureLower: value.temperatureLower + delta,
                temperatureUpper: value.temperatureUpper + delta,
            };
        };
        options.series[0].data = getData().map(fn);
        options.series[1].data = getData2().map(fn);
    }
    AgEnterpriseCharts.update(chart, options);
}
