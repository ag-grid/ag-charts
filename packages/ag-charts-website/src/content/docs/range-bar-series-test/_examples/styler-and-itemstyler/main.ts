import {
    AgCartesianChartOptions,
    AgCharts,
    AgRangeBarSeriesItemStylerParams,
    AgRangeBarSeriesStyle,
    AgRangeBarSeriesStylerParams,
} from 'ag-charts-enterprise';

import { type DatumType, getData } from './data';

const styler = (params: AgRangeBarSeriesStylerParams<DatumType, never>): AgRangeBarSeriesStyle | undefined => {
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
            cornerRadius: 15,
        };
    return {};
};

const itemStyler = (params: AgRangeBarSeriesItemStylerParams<DatumType, never>): AgRangeBarSeriesStyle => {
    if (params.datum[params.xKey] === 'February') {
        if (params.yLowKey === 'gain_low') {
            return { fill: 'gold', cornerRadius: 0 };
        } else {
            return { fill: 'grey', cornerRadius: 0 };
        }
    }
    return {};
};

const options: AgCartesianChartOptions<DatumType, never> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'range-bar',
            xKey: 'month',
            yName: 'Gain',
            yLowKey: 'gain_low',
            yHighKey: 'gain_high',
            fill: 'lime', // ignored
            cornerRadius: 45, // ignored only for February
            itemStyler,
            styler,
        },
        {
            type: 'range-bar',
            xKey: 'month',
            yName: 'Loss',
            yLowKey: 'loss_low',
            yHighKey: 'loss_high',
            fill: 'olive', // ignored
            stroke: 'navy', // not ignored
            strokeWidth: 3, // not ignored
            itemStyler,
            styler,
        },
    ],
};

AgCharts.create(options);
