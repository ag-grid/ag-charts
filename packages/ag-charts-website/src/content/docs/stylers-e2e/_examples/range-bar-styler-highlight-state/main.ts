// @ag-skip-fws
import {
    AgCartesianChartOptions,
    AgCharts,
    AgRangeBarSeriesItemStylerParams,
    AgRangeBarSeriesStyle,
    AgRangeBarSeriesStylerParams,
    ContextMenuModule,
} from 'ag-charts-enterprise';

import { type DatumType, getData } from './data';

type StylerCall = { kind: 'styler' | 'itemStyler'; seriesId: string; highlightState: string; key: string };
const stylerCalls: StylerCall[] = [];
const CATEGORY_KEY = 'month';
function recordStyler(
    kind: StylerCall['kind'],
    params: { seriesId?: string; highlightState?: string; datum?: unknown }
): void {
    // node identity is series + category value; the datum shape is example-specific
    const datum = params.datum as Record<string, unknown> | undefined;
    stylerCalls.push({
        kind,
        seriesId: params.seriesId ?? '',
        highlightState: params.highlightState ?? '',
        key: String(datum?.[CATEGORY_KEY] ?? ''),
    });
}

// itemStyler tracks the per-datum highlight branch independently of the series styler.
const itemStyler = (params: AgRangeBarSeriesItemStylerParams<DatumType, unknown>): AgRangeBarSeriesStyle => {
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

const options: AgCartesianChartOptions<DatumType, unknown> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'range-bar',
            xKey: 'month',
            yName: 'Gain',
            yLowKey: 'gain_low',
            yHighKey: 'gain_high',
            itemStyler,
            styler: (params: AgRangeBarSeriesStylerParams<DatumType, unknown>): AgRangeBarSeriesStyle => {
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
            type: 'range-bar',
            xKey: 'month',
            yName: 'Loss',
            yLowKey: 'loss_low',
            yHighKey: 'loss_high',
            itemStyler,
            styler: (params: AgRangeBarSeriesStylerParams<DatumType, unknown>): AgRangeBarSeriesStyle => {
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
