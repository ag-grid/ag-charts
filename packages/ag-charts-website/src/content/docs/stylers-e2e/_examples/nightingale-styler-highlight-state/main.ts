// @ag-skip-fws
import {
    AgChartOptions,
    AgCharts,
    AgRadialSeriesItemStylerParams,
    AgRadialSeriesStyle,
    AgRadialSeriesStylerParams,
    ContextMenuModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

type StylerCall = { kind: 'styler' | 'itemStyler'; seriesId: string; highlightState: string; key: string };
const stylerCalls: StylerCall[] = [];
const CATEGORY_KEY = 'quarter';
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
const itemStyler = (params: AgRadialSeriesItemStylerParams<unknown, unknown>): AgRadialSeriesStyle => {
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
    series: [
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'sw',
            radiusName: 'Software',
            itemStyler,
            styler: (params: AgRadialSeriesStylerParams<unknown, unknown>): AgRadialSeriesStyle => {
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
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'hw',
            itemStyler,
            styler: (params: AgRadialSeriesStylerParams<unknown, unknown>): AgRadialSeriesStyle => {
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
