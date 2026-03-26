import {
    AgBoxPlotSeriesStyle,
    AgBoxPlotSeriesStylerParams,
    AgChartOptions,
    AgCharts,
    ContextMenuModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

const styler = (params: AgBoxPlotSeriesStylerParams<unknown, unknown>): AgBoxPlotSeriesStyle | undefined => {
    if (params.yName === 'Company 1')
        return {
            fill: 'cyan',
            lineDash: [7, 2],
            lineDashOffset: 5,
            stroke: 'blue',
            strokeWidth: 7,
            strokeOpacity: 0.5,
            whisker: {
                lineDash: [3, 3],
                lineDashOffset: 5,
                stroke: 'navy',
                strokeWidth: 3,
                strokeOpacity: 1,
            },
        };
    else if (params.yName === 'Company 2')
        return {
            fill: 'magenta',
            fillOpacity: 0.5,
            cornerRadius: 15,
            cap: { lengthRatio: 1 },
        };
    return {};
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'box-plot',
            yName: 'Company 1',
            xKey: 'role',
            minKey: 's1_min',
            q1Key: 's1_q1',
            medianKey: 's1_median',
            q3Key: 's1_q3',
            maxKey: 's1_max',
            styler,
        },
        {
            type: 'box-plot',
            yName: 'Company 2',
            xKey: 'role',
            minKey: 's2_min',
            q1Key: 's2_q1',
            medianKey: 's2_median',
            q3Key: 's2_q3',
            maxKey: 's2_max',
            styler,
        },
    ],
};

AgCharts.create(options);
