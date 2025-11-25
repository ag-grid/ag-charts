import {
    AgCharts,
    AgPolarChartOptions,
    AgRadarAreaSeriesStyle,
    AgRadarAreaSeriesStylerParams,
    AgRadarSeriesItemStylerParams,
    AgSeriesMarkerStyle,
} from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'radar-area',
            angleKey: 'trait',
            radiusKey: 'healer',
            fillOpacity: 0.3,
            marker: {
                size: 10,
                itemStyler: (params: AgRadarSeriesItemStylerParams): AgSeriesMarkerStyle | undefined => {
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
            styler: (params: AgRadarAreaSeriesStylerParams): AgRadarAreaSeriesStyle => {
                if (params.highlightState === 'highlighted-item') {
                    return { marker: { size: 15 } };
                }
                if (params.highlightState === 'highlighted-series') {
                    return { stroke: 'darkcyan', strokeWidth: 4, fillOpacity: 1 };
                }
                if (params.highlightState === 'unhighlighted-series') {
                    return { strokeOpacity: 0.2, fill: 'gray', fillOpacity: 0.1 };
                }
                return {};
            },
        },
        {
            type: 'radar-area',
            angleKey: 'trait',
            radiusKey: 'tank',
            fillOpacity: 0.3,
            marker: {
                size: 10,
                itemStyler: (params: AgRadarSeriesItemStylerParams): AgSeriesMarkerStyle | undefined => {
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
            styler: (params: AgRadarAreaSeriesStylerParams): AgRadarAreaSeriesStyle => {
                if (params.highlightState === 'highlighted-item') {
                    return { marker: { size: 15 } };
                }
                if (params.highlightState === 'highlighted-series') {
                    return { stroke: 'gold', strokeWidth: 4, fillOpacity: 1 };
                }
                if (params.highlightState === 'unhighlighted-series') {
                    return { strokeOpacity: 0.2, fill: 'gray', fillOpacity: 0.1 };
                }
                return {};
            },
        },
        {
            type: 'radar-area',
            angleKey: 'trait',
            radiusKey: 'damage',
            fillOpacity: 0.3,
            marker: {
                size: 10,
                itemStyler: (params: AgRadarSeriesItemStylerParams): AgSeriesMarkerStyle | undefined => {
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
            styler: (params: AgRadarAreaSeriesStylerParams): AgRadarAreaSeriesStyle => {
                if (params.highlightState === 'highlighted-item') {
                    return { marker: { size: 15 } };
                }
                if (params.highlightState === 'highlighted-series') {
                    return { stroke: 'lawngreen', strokeWidth: 4, fillOpacity: 1 };
                }
                if (params.highlightState === 'unhighlighted-series') {
                    return { strokeOpacity: 0.2, fill: 'gray', fillOpacity: 0.1 };
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
