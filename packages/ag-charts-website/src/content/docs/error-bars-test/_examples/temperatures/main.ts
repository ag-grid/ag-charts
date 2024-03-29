import { AgCartesianChartOptions, AgCharts, AgErrorBarFormatterParams } from 'ag-charts-enterprise';

import { getData, getData2 } from './data';

interface Datum {
    month: string;
    temperature: number;
    temperatureLower?: number;
    temperatureUpper?: number;
}

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

const chart = AgCharts.create(options);

function line() {
    if (options.series !== undefined) {
        for (const opt of options.series) {
            opt.type = 'line';
        }
    }
    AgCharts.update(chart, options);
}

function bar() {
    if (options.series !== undefined) {
        for (const opt of options.series) {
            opt.type = 'bar';
        }
    }
    AgCharts.update(chart, options);
}

function resetData() {
    if (options.series !== undefined) {
        options.series[0].data = getData();
        options.series[1].data = getData2();
    }
    AgCharts.update(chart, options);
}

function removeOdds() {
    if (options.series !== undefined) {
        const fn = (_value: Datum, index: number): boolean => {
            return index % 2 === 0;
        };
        options.series[0].data = getData().filter(fn);
        options.series[1].data = getData2().filter(fn);
    }
    AgCharts.update(chart, options);
}

function removeOddsErrors() {
    if (options.series !== undefined) {
        const fn = (value: Datum, index: number): Datum => {
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
    AgCharts.update(chart, options);
}

function randomDelta(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function randomiseData() {
    if (options.series !== undefined) {
        const fn = (value: Datum): Datum => {
            const delta = randomDelta(-4, 4);
            const { month, temperature, temperatureLower, temperatureUpper } = value;
            if (temperatureLower === undefined || temperatureUpper === undefined) {
                return {
                    month,
                    temperature: temperature + delta,
                };
            } else {
                return {
                    month,
                    temperature: temperature + delta,
                    temperatureLower: temperatureLower + delta,
                    temperatureUpper: temperatureUpper + delta,
                };
            }
        };
        options.series[0].data = options.series[0].data?.map(fn);
        options.series[1].data = options.series[1].data?.map(fn);
    }
    AgCharts.update(chart, options);
}

function randomiseErrors() {
    if (options.series !== undefined) {
        const fn = (value: Datum): Datum => {
            const { month, temperature, temperatureLower, temperatureUpper } = value;
            if (temperatureLower === undefined || temperatureUpper === undefined) {
                return { month, temperature };
            }
            return {
                month,
                temperature,
                temperatureLower: value.temperature - randomDelta(0, 2.5),
                temperatureUpper: value.temperature + randomDelta(0, 2.5),
            };
        };
        options.series[0].data = options.series[0].data?.map(fn);
        options.series[1].data = options.series[1].data?.map(fn);
    }
    AgCharts.update(chart, options);
}
