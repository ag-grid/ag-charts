// @ag-skip-fws
import {
    AgCartesianChartOptions,
    AgCharts,
    AgRangeAreaSeriesStyle,
    AgRangeAreaSeriesStylerParams,
    AgSeriesMarkerStyle,
    AgSeriesMarkerStylerParams,
    ContextMenuModule,
} from 'ag-charts-enterprise';

import { type DatumType, getData } from './data';

type StylerCall = { kind: 'styler' | 'itemStyler'; seriesId: string; highlightState: string };
const stylerCalls: StylerCall[] = [];
function recordStyler(kind: StylerCall['kind'], params: { seriesId?: string; highlightState?: string }): void {
    stylerCalls.push({ kind, seriesId: params.seriesId ?? '', highlightState: params.highlightState ?? '' });
}

function lowAndHigh<T>(p: T): { item: { low: T; high: T } } {
    return { item: { low: p, high: p } };
}

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
                    recordStyler('itemStyler', params);
                    switch (params.highlightState) {
                        case 'highlighted-item':
                            return { size: 35, shape: 'star' /* must have marker.fill 'yellow' */ };
                        case 'unhighlighted-item':
                            return {
                                size: 20,
                                fill: 'teal' /* must override 'blanchedalmonde' */,
                                fillOpacity: 0.2,
                            };
                        default:
                            return {};
                    }
                },
            },
            styler: (params: AgRangeAreaSeriesStylerParams<DatumType, unknown>): AgRangeAreaSeriesStyle => {
                recordStyler('styler', params);
                switch (params.highlightState) {
                    case 'highlighted-item':
                        return lowAndHigh({ marker: { fill: 'yellow' } });
                    case 'unhighlighted-item':
                        return lowAndHigh({ marker: { fill: 'blanchedalmond' } });
                    case 'highlighted-series':
                        return { fill: 'gold', ...lowAndHigh({ strokeWidth: 4 }) };
                    case 'unhighlighted-series':
                        return { fillOpacity: 0.2, ...lowAndHigh({ strokeOpacity: 0.2 }) };
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
                    recordStyler('itemStyler', params);
                    switch (params.highlightState) {
                        case 'highlighted-item':
                            return { size: 35 /* must have marker.fill 'fuchsia' */ };
                        case 'unhighlighted-item':
                            return { fill: 'darkslateblue' /* must override 'cyan'*/, size: 20 };
                        default:
                            return {};
                    }
                },
            },
            styler: (params: AgRangeAreaSeriesStylerParams<DatumType, unknown>): AgRangeAreaSeriesStyle => {
                recordStyler('styler', params);
                switch (params.highlightState) {
                    case 'highlighted-item':
                        return lowAndHigh({ marker: { fill: 'fuchsia' } });
                    case 'unhighlighted-item':
                        return lowAndHigh({ marker: { fill: 'cyan' } });
                    case 'highlighted-series':
                        return { fill: 'limegreen', ...lowAndHigh({ strokeWidth: 4 }) };
                    case 'unhighlighted-series':
                        return { fillOpacity: 0.2, ...lowAndHigh({ strokeOpacity: 0.2 }) };
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
