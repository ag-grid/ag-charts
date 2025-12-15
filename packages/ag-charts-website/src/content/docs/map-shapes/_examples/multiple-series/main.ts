import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    MapShapeSeriesModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { central, eastern, mountain, pacific } from './data';
import { topology } from './topology';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    MapShapeSeriesModule,
    ContextMenuModule,
]);

window.agChartsDebug = 'options-graph';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Timezones Across America',
    },
    topology,
    series: [
        {
            type: 'map-shape',
            data: pacific,
            idKey: 'name',
            title: 'Pacific',
            fill: { type: 'gradient' },
            // itemStyler: (params) => {
            //     if (params.datum.name === 'Nevada') {
            //         return { fill: { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'pink' }] } };
            //     }
            //     return { fill: { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'green' }] } };
            // },
        },
        {
            type: 'map-shape',
            data: mountain,
            idKey: 'name',
            title: 'Mountain',
            // fill: { type: 'gradient' },
            fill: 'red',
            itemStyler: (params) => {
                if (params.datum.name === 'Colorado') {
                    return { fill: { type: 'gradient' } };
                    return { fill: { type: 'gradient', colorStops: [{ color: 'pink' }, { color: 'green' }] } };
                }
                // return Math.random() > 0.5 ? { fill: { type: 'gradient' } } : { fill: 'red' };
            },
        },
        {
            type: 'map-shape',
            data: central,
            idKey: 'name',
            title: 'Central',
            itemStyler: (params) => {
                if (params.datum.name === 'Minnesota') {
                    return {
                        fill: { type: 'gradient', colorStops: [{ color: 'pink' }, { color: 'purple' }] },
                    };
                }
                return {
                    fill: { type: 'gradient', colorStops: [{ color: 'red' }, { color: 'blue' }] },
                };
            },
        },
        // {
        //     type: 'map-shape',
        //     data: eastern,
        //     idKey: 'name',
        //     title: 'Eastern',
        // },
    ],
    legend: {
        enabled: true,
    },
};

AgCharts.create(options);
