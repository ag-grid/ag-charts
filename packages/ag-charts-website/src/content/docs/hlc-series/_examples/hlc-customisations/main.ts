import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    HlcSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    OrdinalTimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    HlcSeriesModule,
    LegendModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Dow Jones Industrial Average',
    },
    subtitle: {
        text: 'HLC Customisations',
    },
    footnote: {
        text: '1 Minute',
    },
    series: [
        {
            type: 'hlc',
            xKey: 'date',
            xName: 'Time',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            item: {
                high: {
                    fillOpacity: 0.2,
                    lineDash: [4, 4],
                },
                low: {
                    fillOpacity: 0.2,
                    lineDash: [4, 4],
                },
                close: {
                    strokeWidth: 3,
                    marker: {
                        enabled: true,
                        shape: 'diamond',
                        size: 8,
                    },
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'ordinal-time',
            label: {
                format: '%H:%M',
            },
        },
        y: {
            type: 'number',
            position: 'right',
            crosshair: {
                label: {
                    format: ',.2f',
                },
            },
        },
    },
};

AgCharts.create(options);
