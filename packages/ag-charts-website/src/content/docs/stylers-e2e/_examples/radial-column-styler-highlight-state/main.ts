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
    series: [
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'sw',
            radiusName: 'Software',
            styler: (params: AgRadialSeriesStylerParams<unknown, unknown>): AgRadialSeriesStyle => {
                switch (params.highlightState) {
                    case 'highlighted-item':
                        return { fill: 'yellow', strokeWidth: 4 };
                    case 'unhighlighted-item':
                        return { fill: 'lightgray' };
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
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'hw',
            styler: (params: AgRadialSeriesStylerParams<unknown, unknown>): AgRadialSeriesStyle => {
                switch (params.highlightState) {
                    case 'highlighted-item':
                        return { fill: 'lime', strokeWidth: 4 };
                    case 'unhighlighted-item':
                        return { fill: 'lightgray' };
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
