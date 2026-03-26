import { AgBoxPlotSeriesStylerParams, AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    tooltip: { enabled: false },
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
            styler: (params: AgBoxPlotSeriesStylerParams<unknown, unknown>) => {
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
            type: 'box-plot',
            yName: 'Company 2',
            xKey: 'role',
            minKey: 's2_min',
            q1Key: 's2_q1',
            medianKey: 's2_median',
            q3Key: 's2_q3',
            maxKey: 's2_max',
            styler: (params: AgBoxPlotSeriesStylerParams<unknown, unknown>) => {
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
