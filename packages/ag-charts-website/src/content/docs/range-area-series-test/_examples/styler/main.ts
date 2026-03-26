import {
    AgCartesianChartOptions,
    AgCharts,
    AgRangeAreaSeriesStyle,
    AgRangeAreaSeriesStylerParams,
    ContextMenuModule,
} from 'ag-charts-enterprise';

import { type DatumType, getData } from './data';

function lowAndHigh<T>(p: T): { item: { low: T; high: T } } {
    return { item: { low: p, high: p } };
}

const styler = (params: AgRangeAreaSeriesStylerParams<DatumType, unknown>): AgRangeAreaSeriesStyle | undefined => {
    if (params.yLowKey === 'gain_low')
        return {
            fill: 'cyan',
            ...lowAndHigh({
                lineDash: [4, 4],
                lineDashOffset: 5,
                stroke: 'blue',
                strokeWidth: 2.5,
                marker: {},
            }),
        };
    else if (params.yLowKey === 'loss_low')
        return {
            fill: 'magenta',
            fillOpacity: 0.5,
            ...lowAndHigh({
                marker: {
                    fill: 'indigo',
                    strokeWidth: 2.5,
                    size: 20,
                },
            }),
        };
    return {};
};

const options: AgCartesianChartOptions<DatumType, unknown> = {
    container: document.getElementById('myChart'),
    data: getData(),
    legend: { item: { line: { length: 50 } } },
    series: [
        {
            type: 'range-area',
            xKey: 'month',
            yName: 'Gain',
            yLowKey: 'gain_low',
            yHighKey: 'gain_high',
            fill: 'cyan',
            styler,
        },
        {
            type: 'range-area',
            xKey: 'month',
            yName: 'Loss',
            yLowKey: 'loss_low',
            yHighKey: 'loss_high',
            styler,
            ...lowAndHigh({
                marker: {
                    fill: 'lime', // ignored
                    fillOpacity: 0.5, // not ignored
                },
            }),
        },
    ],
};

AgCharts.create(options);
