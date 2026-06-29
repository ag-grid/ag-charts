import {
    AgChartOptions,
    AgCharts,
    AgRadialSeriesStyle,
    AgRadialSeriesStylerParams,
    ContextMenuModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    legend: { position: 'left' },
    series: [
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'sw',
            angleName: 'Software',
            styler: (params: AgRadialSeriesStylerParams<unknown, unknown>): AgRadialSeriesStyle => {
                switch (params.highlightState) {
                    case 'highlighted-item':
                        return { fill: 'yellow', strokeWidth: 3 };
                    case 'unhighlighted-item':
                        return { fill: 'lightgray' };
                    case 'highlighted-series':
                        return { fill: 'gold', strokeWidth: 3 };
                    case 'unhighlighted-series':
                        return { fillOpacity: 0.2, strokeOpacity: 0.2 };
                    case 'none':
                    default:
                        return {};
                }
            },
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'hw',
            styler: (params: AgRadialSeriesStylerParams<unknown, unknown>): AgRadialSeriesStyle => {
                switch (params.highlightState) {
                    case 'highlighted-item':
                        return { fill: 'lime', strokeWidth: 3 };
                    case 'unhighlighted-item':
                        return { fill: 'lightgray' };
                    case 'highlighted-series':
                        return { fill: 'limegreen', strokeWidth: 3 };
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
