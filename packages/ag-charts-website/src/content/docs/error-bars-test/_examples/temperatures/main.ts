import { AgCartesianChartOptions, AgChart, AgErrorBarFormatterParams } from 'ag-charts-enterprise';

import { getData, getData2 } from './data';

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

const chart = AgChart.create(options);

function line() {
    if (options.series !== undefined) {
        for (const opt of options.series) {
            opt.type = 'line';
        }
    }
    AgChart.update(chart, options);
}

function bar() {
    if (options.series !== undefined) {
        for (const opt of options.series) {
            opt.type = 'bar';
        }
    }
    AgChart.update(chart, options);
}
