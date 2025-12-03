import {
    AgCharts,
    AgMarkerShapeFn,
    AgPolarChartOptions,
    AgRadarAreaSeriesOptions,
    ContextMenuModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

const shieldPath: AgMarkerShapeFn = ({ path, x, y, size }) => {
    const s = size / 2;
    path.clear();
    path.moveTo(x + s * 0.7, y - s);
    path.lineTo(x + s * 0.7, y + s * 0.3);
    path.lineTo(x, y + s);
    path.lineTo(x - s * 0.7, y + s * 0.3);
    path.lineTo(x - s * 0.7, y - s);
    path.closePath();
};

const styler: AgRadarAreaSeriesOptions['styler'] = (params) => {
    switch (params.radiusKey) {
        case 'tank':
            return {
                stroke: '#3b82f6',
                strokeWidth: 3,
                fill: '#93c5fd',
                fillOpacity: 0.16,
                marker: {
                    fill: '#3b82f6',
                    fillOpacity: 0.9,
                    shape: shieldPath,
                    size: 18,
                    stroke: '#1e3a8a',
                    strokeWidth: 1.5,
                },
            };
        case 'damage':
            return {
                stroke: '#ef4444',
                strokeWidth: 2.5,
                strokeOpacity: 0.85,
                lineDash: [6, 4],
                fill: '#fca5a5',
                fillOpacity: 0.13,
                marker: {
                    fill: '#ef4444',
                    fillOpacity: 0.85,
                    size: 14,
                    stroke: '#7f1d1d',
                    strokeWidth: 1.2,
                },
            };
        case 'healer':
            return {
                stroke: '#10b981',
                strokeWidth: 3,
                strokeOpacity: 0.9,
                lineDash: [3, 3],
                fill: '#6ee7b7',
                fillOpacity: 0.15,
                marker: {
                    fill: '#10b981',
                    fillOpacity: 0.9,
                    shape: 'plus',
                    size: 18,
                    stroke: '#065f46',
                    strokeWidth: 1.5,
                },
            };
        default:
            break;
    }
};

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'radar-area',
            angleKey: 'trait',
            radiusKey: 'healer',
            stroke: 'limegreen', // ignored
            strokeWidth: 30, // ignored
            strokeOpacity: 0.3, // ignored
            lineDash: [7, 7, 4, 4], // ignored
            fill: 'lime', // ignored
            fillOpacity: 1, // ignored
            marker: {
                fill: 'mediumseagreen', // ignored
                fillOpacity: 0.2, // ignored
                shape: 'heart', // ignored
                size: 40, // ignored
                stroke: 'seagreen', // ignored
                strokeWidth: 5, // ignored
            },
            styler,
        },
        {
            type: 'radar-area',
            angleKey: 'trait',
            radiusKey: 'tank',
            stroke: 'fuchsia', // ignored
            strokeWidth: 3, // not ignored
            strokeOpacity: 0.9, // not ignored
            // marker should be enabled
            styler,
        },
        {
            type: 'radar-area',
            angleKey: 'trait',
            radiusKey: 'damage',
            // should use all style properties from the styler
            marker: {}, // should be enabled, but with the styler's styling
            styler,
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
