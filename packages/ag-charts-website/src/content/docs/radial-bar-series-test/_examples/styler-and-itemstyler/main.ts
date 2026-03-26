import { AgCharts, ContextMenuModule } from 'ag-charts-enterprise';
import {
    AgChartOptions,
    AgRadialSeriesItemStylerParams,
    AgRadialSeriesStyle,
    AgRadialSeriesStylerParams,
} from 'ag-charts-types';

import { type DatumType, getData } from './data';

const styler = (params: AgRadialSeriesStylerParams<DatumType, unknown>): AgRadialSeriesStyle | undefined => {
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

const itemStyler = (params: AgRadialSeriesItemStylerParams<DatumType, unknown>): AgRadialSeriesStyle => {
    if (params.angleKey === 'sw' && params.datum.quarter === `Q1'22`) {
        return { fill: 'lightskyblue', stroke: 'deepskyblue' };
    }
    if (params.angleKey === 'hw' && params.datum.quarter === `Q3'23`) {
        return { fill: 'darkkhaki', strokeWidth: 1, strokeOpacity: 1 };
    }
    return {};
};

const options: AgChartOptions<DatumType, unknown> = {
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
            itemStyler,
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'hw',
            stroke: 'CornflowerBlue', // ignored
            strokeOpacity: 0.5, // not ignored
            strokeWidth: 15, // ignored
            styler,
            itemStyler,
        },
    ],
};

AgCharts.create(options);
