import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type { AgCartesianChartOptions, AgErrorBarItemStylerParams } from 'ag-charts-types';

import type { DataType } from './data';
import { getData, getData2 } from './data';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const highlight = {
    highlightedItem: { stroke: 'red' },
    unhighlightedSeries: { opacity: 0.3 },
};

const selection = {
    selectedItem: { stroke: 'steelblue', strokeWidth: 3, lineDash: [2, 1] },
};

const itemStyler = (param: AgErrorBarItemStylerParams<DataType>) => {
    const errorBarStyle: { stroke?: string; strokeWidth?: number } = { stroke: undefined, strokeWidth: 1 };
    if (param.selectionState == 'selected') {
        errorBarStyle.strokeWidth = 3;
        errorBarStyle.stroke = 'steelblue';
    }
    if (param.highlightState === 'highlighted-item') {
        return { ...errorBarStyle, stroke: 'red' };
    } else {
        return errorBarStyle;
    }
};

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    selection: {
        enabled: true,
        enableClick: true,
        enableDrag: true,
    },
    theme: {
        baseTheme: 'ag-default',
        palette: {
            fills: [
                '#f3622d33',
                '#fba71b33',
                '#57b75733',
                '#41a9c933',
                '#4258c933',
                '#9a42c833',
                '#c8416433',
                '#88888833',
            ],
            strokes: ['#aa4520', '#b07513', '#3d803d', '#2d768d', '#2e3e8d', '#6c2e8c', '#8c2d46', '#5f5f5f'],
        },
        overrides: {
            line: {
                series: {
                    marker: {
                        size: 20,
                    },
                },
            },
        },
    },
    title: {
        text: 'Monthly Average Temperatures with Error Bars (Celsius)',
    },
    series: [
        {
            type: 'line',
            data: getData(),
            xKey: 'month',
            yKey: 'temperature',
            yName: 'Canada',
            errorBar: {
                yLowerKey: 'temperatureLower',
                yUpperKey: 'temperatureUpper',
                itemStyler,
            },
            highlight,
            selection,
        },
        {
            type: 'line',
            data: getData2(),
            xKey: 'month',
            yKey: 'temperature',
            yName: 'Australia',
            errorBar: {
                yLowerKey: 'temperatureLower',
                yUpperKey: 'temperatureUpper',
                itemStyler,
            },
            highlight,
            selection,
        },
    ],
};

const chart = AgCharts.create(options);

export function line() {
    if (options.series !== undefined) {
        for (const opt of options.series) {
            opt.type = 'line';
        }
    }
    chart.update(options);
}

export function bar() {
    if (options.series !== undefined) {
        for (const opt of options.series) {
            opt.type = 'bar';
        }
    }
    chart.update(options);
}
