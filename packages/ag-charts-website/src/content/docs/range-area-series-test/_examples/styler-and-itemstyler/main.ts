import {
    type AgCartesianChartOptions,
    AgCharts,
    type AgRangeAreaSeriesStyle,
    type AgRangeAreaSeriesStylerParams,
    type AgSeriesMarkerStyle,
    type AgSeriesMarkerStylerParams,
} from 'ag-charts-enterprise';

import { type DatumType, getData } from './data';

const styler = (params: AgRangeAreaSeriesStylerParams<DatumType, unknown>): AgRangeAreaSeriesStyle | undefined => {
    if (params.yLowKey === 'gain_low')
        return {
            fill: 'cyan',
            lineDash: [3, 3],
            lineDashOffset: 5,
            stroke: 'blue',
            strokeWidth: 7,
        };
    else if (params.yLowKey === 'loss_low')
        return {
            fill: 'magenta',
            fillOpacity: 0.5,
            stroke: 'springgreen',
            marker: {
                fill: 'indigo',
                strokeWidth: 2.5,
                size: 20,
            },
        };
    return {};
};

const itemStyler = (params: AgSeriesMarkerStylerParams<DatumType, unknown>): AgSeriesMarkerStyle => {
    if (params.datum.month === 'February') {
        if (params.seriesId === 'gain-series') {
            return { fill: 'gold' };
        } else {
            return { fill: 'grey' };
        }
    }
    return {};
};

const options: AgCartesianChartOptions<DatumType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    legend: { item: { line: { length: 50 } } },
    series: [
        {
            type: 'range-area',
            id: 'gain-series',
            xKey: 'month',
            yName: 'Gain',
            yLowKey: 'gain_low',
            yHighKey: 'gain_high',
            fill: 'lime', // ignored
            marker: {
                size: 15,
                itemStyler,
            },
            styler,
        },
        {
            type: 'range-area',
            id: 'loss-series',
            xKey: 'month',
            yName: 'Loss',
            yLowKey: 'loss_low',
            yHighKey: 'loss_high',
            fill: 'olive', // ignored
            stroke: 'navy', // not ignored
            strokeWidth: 3, // not ignored
            marker: {
                fill: 'lime', // ignored
                fillOpacity: 0.5, // not ignored
                itemStyler,
            },
            styler,
        },
    ],
};

AgCharts.create(options);
