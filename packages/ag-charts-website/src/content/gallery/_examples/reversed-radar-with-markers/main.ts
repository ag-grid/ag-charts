import { ModuleRegistry } from 'ag-charts-community';
import {
    AgChartOptions,
    AgCharts,
    AngleNumberAxisModule,
    ContextMenuModule,
    RadarLineSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AngleNumberAxisModule, RadarLineSeriesModule, RadiusNumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'FRIENDS & ACQUAINTANCES',
    },
    animation: { enabled: false },
    series: Object.entries(getData()).map(([relationship, data]) => ({
        data,
        type: 'radar-line',
        angleKey: 'recognitionTime',
        angleName: 'Recognition Time',
        radiusKey: 'closeness',
        radiusName: `${relationship
            .split(' ')
            .map((word) => `${word[0].toUpperCase()}${word.substring(1)}`)
            .join(' ')}`,
        strokeWidth: 0,
        marker: {
            strokeWidth: 1,
            fillOpacity: 0.1,
        },
    })),
    axes: {
        angle: {
            type: 'angle-number',
            line: {
                enabled: false,
            },
        },
        radius: {
            type: 'radius-number',
            shape: 'circle',
            reverse: true,
            label: {
                enabled: false,
            },
            interval: {
                step: 0.4,
            },
        },
    },
};

AgCharts.create(options);
