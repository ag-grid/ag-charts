import {
    AgCartesianChartOptions,
    AgCharts,
    AgRangeBarSeriesStyle,
    AgRangeBarSeriesStylerParams,
    ContextMenuModule,
} from 'ag-charts-enterprise';

import { type DatumType, getData } from './data';

const styler = (params: AgRangeBarSeriesStylerParams<DatumType, unknown>): AgRangeBarSeriesStyle | undefined => {
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

const options: AgCartesianChartOptions<DatumType, unknown> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'range-bar',
            xKey: 'month',
            yName: 'Gain',
            yLowKey: 'gain_low',
            yHighKey: 'gain_high',
            styler,
            grouped: false,
        },
        {
            type: 'range-bar',
            xKey: 'month',
            yName: 'Loss',
            yLowKey: 'loss_low',
            yHighKey: 'loss_high',
            styler,
        },
    ],
};

AgCharts.create(options);
