// @ag-skip-fws
import {
    AgCharts,
    AgPolarChartOptions,
    AgRadarLineSeriesStyle,
    AgRadarLineSeriesStylerParams,
    AgRadarSeriesItemStylerParams,
    AgSeriesMarkerStyle,
    ContextMenuModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

type StylerCall = { kind: 'styler' | 'itemStyler'; seriesId: string; highlightState: string; key: string };
const stylerCalls: StylerCall[] = [];
const CATEGORY_KEY = 'trait';
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

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'radar-line',
            angleKey: 'trait',
            radiusKey: 'healer',
            marker: {
                size: 10,
                itemStyler: (params: AgRadarSeriesItemStylerParams): AgSeriesMarkerStyle | undefined => {
                    recordStyler('itemStyler', params);
                    if (params.highlightState === 'highlighted-item') {
                        return { fill: 'cyan', strokeWidth: 4 };
                    }
                    if (params.highlightState === 'unhighlighted-item') {
                        return { fill: 'lightgray' };
                    }
                    if (params.highlightState === 'highlighted-series') {
                        return { fill: 'royalblue', strokeWidth: 2, size: 12 };
                    }
                    if (params.highlightState === 'unhighlighted-series') {
                        return { fillOpacity: 0.2 };
                    }
                },
            },
            styler: (params: AgRadarLineSeriesStylerParams): AgRadarLineSeriesStyle => {
                recordStyler('styler', params);
                if (params.highlightState === 'highlighted-item') {
                    return { marker: { size: 15 } };
                }
                if (params.highlightState === 'highlighted-series') {
                    return { stroke: 'darkcyan', strokeWidth: 4 };
                }
                if (params.highlightState === 'unhighlighted-series') {
                    return { strokeOpacity: 0.2 };
                }
                return {};
            },
        },
        {
            type: 'radar-line',
            angleKey: 'trait',
            radiusKey: 'tank',
            marker: {
                size: 10,
                itemStyler: (params: AgRadarSeriesItemStylerParams): AgSeriesMarkerStyle | undefined => {
                    recordStyler('itemStyler', params);
                    if (params.highlightState === 'highlighted-item') {
                        return { fill: 'yellow', strokeWidth: 4 };
                    }
                    if (params.highlightState === 'unhighlighted-item') {
                        return { fill: 'lightgray' };
                    }
                    if (params.highlightState === 'highlighted-series') {
                        return { fill: 'khaki', strokeWidth: 2, size: 12 };
                    }
                    if (params.highlightState === 'unhighlighted-series') {
                        return { fillOpacity: 0.2 };
                    }
                },
            },
            styler: (params: AgRadarLineSeriesStylerParams): AgRadarLineSeriesStyle => {
                recordStyler('styler', params);
                if (params.highlightState === 'highlighted-item') {
                    return { marker: { size: 15 } };
                }
                if (params.highlightState === 'highlighted-series') {
                    return { stroke: 'gold', strokeWidth: 4 };
                }
                if (params.highlightState === 'unhighlighted-series') {
                    return { strokeOpacity: 0.2 };
                }
                return {};
            },
        },
        {
            type: 'radar-line',
            angleKey: 'trait',
            radiusKey: 'damage',
            marker: {
                size: 10,
                itemStyler: (params: AgRadarSeriesItemStylerParams): AgSeriesMarkerStyle | undefined => {
                    recordStyler('itemStyler', params);
                    if (params.highlightState === 'highlighted-item') {
                        return { fill: 'lime', strokeWidth: 4 };
                    }
                    if (params.highlightState === 'unhighlighted-item') {
                        return { fill: 'lightgray' };
                    }
                    if (params.highlightState === 'highlighted-series') {
                        return { fill: 'forestgreen', strokeWidth: 2, size: 12 };
                    }
                    if (params.highlightState === 'unhighlighted-series') {
                        return { fillOpacity: 0.2 };
                    }
                },
            },
            styler: (params: AgRadarLineSeriesStylerParams): AgRadarLineSeriesStyle => {
                recordStyler('styler', params);
                if (params.highlightState === 'highlighted-item') {
                    return { marker: { size: 15 } };
                }
                if (params.highlightState === 'highlighted-series') {
                    return { stroke: 'lawngreen', strokeWidth: 4 };
                }
                if (params.highlightState === 'unhighlighted-series') {
                    return { strokeOpacity: 0.2 };
                }
                return {};
            },
        },
    ],
    legend: {
        position: 'bottom',
        item: {
            line: {
                length: 40,
            },
        },
    },
};

const chart = AgCharts.create(options);

// e2e hook: expose styler/itemStyler invocations to stylers.spec.ts
(window as any).agE2E = { popStylerCalls: () => stylerCalls.splice(0) };
