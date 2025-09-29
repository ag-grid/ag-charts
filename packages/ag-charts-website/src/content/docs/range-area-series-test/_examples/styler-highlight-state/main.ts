import {
    AgCartesianChartOptions,
    AgCharts,
    AgRangeAreaSeriesStyle,
    AgRangeAreaSeriesStylerParams,
} from 'ag-charts-enterprise';

import { type DatumType, getData } from './data';

const options: AgCartesianChartOptions<DatumType, unknown> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'range-area',
            xKey: 'month',
            yName: 'Gain',
            yLowKey: 'gain_low',
            yHighKey: 'gain_high',
            marker: {},
            styler: (params: AgRangeAreaSeriesStylerParams<DatumType, unknown>): AgRangeAreaSeriesStyle => {
                switch (params.highlightState) {
                    case 'highlighted-item':
                        return { marker: { fill: 'yellow', size: 35, shape: 'star' } };
                    case 'unhighlighted-item':
                        return { marker: { fill: 'cyan', size: 20, fillOpacity: 0.2 } };
                    case 'highlighted-series':
                        return { fill: 'gold', strokeWidth: 4 };
                    case 'unhighlighted-series':
                        return { fillOpacity: 0.2, strokeOpacity: 0.2 };
                    case 'none':
                    default:
                        return {};
                }
            },
        },
        {
            type: 'range-area',
            xKey: 'month',
            yName: 'Loss',
            yLowKey: 'loss_low',
            yHighKey: 'loss_high',
            marker: {},
            styler: (params: AgRangeAreaSeriesStylerParams<DatumType, unknown>): AgRangeAreaSeriesStyle => {
                switch (params.highlightState) {
                    case 'highlighted-item':
                        return { marker: { fill: 'fuschia', size: 35 } };
                    case 'unhighlighted-item':
                        return { marker: { fill: 'darkslateblue', size: 20 } };
                    case 'highlighted-series':
                        return { fill: 'limegreen', strokeWidth: 4 };
                    case 'unhighlighted-series':
                        return { fillOpacity: 0.2, strokeOpacity: 0.2 };
                    case 'none':
                    default:
                        return {};
                }
            },
        },
    ],
};

AgCharts.create(options);
