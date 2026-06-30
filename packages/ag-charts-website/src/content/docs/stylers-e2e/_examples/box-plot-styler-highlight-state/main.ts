// @ag-skip-fws
import {
    AgBoxPlotSeriesItemStylerParams,
    AgBoxPlotSeriesStyle,
    AgBoxPlotSeriesStylerParams,
    AgChartOptions,
    AgCharts,
    ContextMenuModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

type StylerCall = { kind: 'styler' | 'itemStyler'; seriesId: string; highlightState: string };
const stylerCalls: StylerCall[] = [];
function recordStyler(kind: StylerCall['kind'], params: { seriesId?: string; highlightState?: string }): void {
    stylerCalls.push({ kind, seriesId: params.seriesId ?? '', highlightState: params.highlightState ?? '' });
}

// itemStyler tracks the per-datum highlight branch independently of the series styler.
const itemStyler = (params: AgBoxPlotSeriesItemStylerParams<unknown, unknown>): AgBoxPlotSeriesStyle => {
    recordStyler('itemStyler', params);
    switch (params.highlightState) {
        case 'highlighted-item':
            return { stroke: 'black', strokeWidth: 3 };
        case 'unhighlighted-item':
            return { strokeOpacity: 0.2 };
        case 'highlighted-series':
            return { stroke: 'white', strokeWidth: 2 };
        case 'unhighlighted-series':
            return { strokeOpacity: 0.1 };
        case 'none':
        default:
            return {};
    }
};

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
            itemStyler,
            styler: (params: AgBoxPlotSeriesStylerParams<unknown, unknown>) => {
                recordStyler('styler', params);
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
            itemStyler,
            styler: (params: AgBoxPlotSeriesStylerParams<unknown, unknown>) => {
                recordStyler('styler', params);
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

// e2e hook: expose styler/itemStyler invocations to stylers.spec.ts
(window as any).agE2E = { popStylerCalls: () => stylerCalls.splice(0) };
