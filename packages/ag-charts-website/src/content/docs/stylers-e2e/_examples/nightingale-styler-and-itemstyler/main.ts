import { AgCharts, ContextMenuModule } from 'ag-charts-enterprise';
import {
    AgChartOptions,
    AgRadialSeriesItemStylerParams,
    AgRadialSeriesStyle,
    AgRadialSeriesStylerParams,
} from 'ag-charts-types';

import { type DatumType, getData } from './data';

const styler = (params: AgRadialSeriesStylerParams<DatumType, unknown>): AgRadialSeriesStyle | undefined => {
    if (params.radiusKey === 'sw') {
        return {
            fill: 'cyan',
            lineDash: [7, 2],
            lineDashOffset: 5,
            stroke: 'blue',
            strokeWidth: 7,
            strokeOpacity: 0.5,
        };
    }
    if (params.radiusKey === 'hw')
        return {
            fill: 'hotpink',
            stroke: 'darkmagenta',
            strokeWidth: 2,
        };
    return {};
};

const itemStyler = (params: AgRadialSeriesItemStylerParams<DatumType, unknown>): AgRadialSeriesStyle => {
    if (params.radiusKey === 'sw' && params.datum.quarter === `Q1'22`) {
        return { fill: 'lightskyblue', stroke: 'deepskyblue' };
    }
    if (params.radiusKey === 'hw' && params.datum.quarter === `Q3'23`) {
        return { fill: 'darkkhaki', strokeWidth: 7, strokeOpacity: 1 };
    }
    return {};
};

const options: AgChartOptions<DatumType, unknown> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'sw',
            radiusName: 'Software',
            fill: 'lime', // ignored
            fillOpacity: 0.5, // not ignored
            styler,
            itemStyler,
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'hw',
            stroke: 'CornflowerBlue', // ignored
            strokeOpacity: 0.5, // not ignored
            strokeWidth: 15, // ignored
            styler,
            itemStyler,
        },
    ],
};

AgCharts.create(options);
