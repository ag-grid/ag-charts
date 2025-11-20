import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';
import { ModuleRegistry } from 'ag-charts-community';
import { AngleCategoryAxisModule, RadarAreaSeriesModule, RadiusNumberAxisModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([AngleCategoryAxisModule, RadarAreaSeriesModule, RadiusNumberAxisModule]);
const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Software & Hardware Revenues',
    },
    subtitle: {
        text: 'Millions USD',
    },
    tooltip: {
        mode: 'shared',
    },
    series: [
        {
            type: 'radar-area',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
            fillOpacity: 0.4,
            label: {
                enabled: true,
            },
            marker: {
                enabled: true,
            },
        },
        {
            type: 'radar-area',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
            fillOpacity: 0.6,
            marker: {
                enabled: true,
            },
        },
    ],
    axes: {
        radius: {
            type: 'radius-number',
            shape: 'circle',
            interval: { step: 0.1 },
            label: {
                enabled: false,
            },
        },
        angle: {
            type: 'angle-category',
            line: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
            },
        },
    },
};

AgCharts.create(options);
