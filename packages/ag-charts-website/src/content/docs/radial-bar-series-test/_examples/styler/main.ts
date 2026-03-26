import {
    AgChartOptions,
    AgCharts,
    AgRadialSeriesStyle,
    AgRadialSeriesStylerParams,
    ContextMenuModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

const styler = (params: AgRadialSeriesStylerParams<unknown, unknown>): AgRadialSeriesStyle | undefined => {
    if (params.angleKey === 'sw') {
        return {
            fill: 'cyan',
            lineDash: [7, 2],
            lineDashOffset: 5,
            stroke: 'blue',
            strokeWidth: 3,
            strokeOpacity: 0.5,
        };
    }
    if (params.angleKey === 'hw')
        return {
            fill: 'hotpink',
            stroke: 'darkmagenta',
            strokeWidth: 2,
        };
    return {};
};

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
            fill: 'lime', // ignored
            fillOpacity: 0.5, // not ignored
            styler,
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'hw',
            stroke: 'CornflowerBlue', // ignored
            strokeOpacity: 0.5, // not ignored
            strokeWidth: 15, // ignored
            styler,
        },
    ],
};

AgCharts.create(options);
