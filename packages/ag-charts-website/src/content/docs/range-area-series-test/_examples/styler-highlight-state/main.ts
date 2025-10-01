import {
    AgCartesianChartOptions,
    AgCharts,
    AgRangeAreaSeriesStyle,
    AgRangeAreaSeriesStylerParams,
    AgSeriesMarkerStyle,
    AgSeriesMarkerStylerParams,
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
            marker: {
                itemStyler: (params: AgSeriesMarkerStylerParams<DatumType, unknown>): AgSeriesMarkerStyle => {
                    switch (params.highlightState) {
                        case 'highlighted-item':
                            return { fill: 'yellow', size: 35, shape: 'star' };
                        case 'unhighlighted-item':
                            return { fill: 'cyan', size: 20, fillOpacity: 0.2 };
                        default:
                            return {};
                    }
                },
            },
            styler: (params: AgRangeAreaSeriesStylerParams<DatumType, unknown>): AgRangeAreaSeriesStyle => {
                switch (params.highlightState) {
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
            marker: {
                itemStyler: (params: AgSeriesMarkerStylerParams<DatumType, unknown>): AgSeriesMarkerStyle => {
                    switch (params.highlightState) {
                        case 'highlighted-item':
                            return { fill: 'fuchsia', size: 35 };
                        case 'unhighlighted-item':
                            return { fill: 'darkslateblue', size: 20 };
                        default:
                            return {};
                    }
                },
            },
            styler: (params: AgRangeAreaSeriesStylerParams<DatumType, unknown>): AgRangeAreaSeriesStyle => {
                switch (params.highlightState) {
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
