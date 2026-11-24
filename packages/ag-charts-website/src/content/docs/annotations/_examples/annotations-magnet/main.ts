import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    AnnotationsModule,
    CategoryAxisModule,
    ChartToolbarModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    AnnotationsModule,
    CategoryAxisModule,
    ChartToolbarModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Sales Revenue',
    },
    subtitle: {
        text: 'Draw a line near a data point, with the magnet on',
    },
    footnote: {
        text: '2024, values in $1000s',
    },
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'revenue',
            interpolation: { type: 'smooth' },
        },
    ],
    annotations: {
        enabled: true,
        magnet: {
            enabled: true,
            range: 30,
        },
        toolbar: {
            buttons: [
                {
                    type: 'switch',
                    icon: 'no-magnet',
                    tooltip: 'toolbarAnnotationsMagnet',
                    checkedOverrides: { icon: 'magnet' },
                    value: 'magnet',
                },
                { icon: 'trend-line-drawing', tooltip: 'toolbarAnnotationsLineAnnotations', value: 'line-menu' },
                { icon: 'delete', tooltip: 'toolbarAnnotationsClearAll', value: 'clear' },
            ],
        },
    },
};

const chart = AgCharts.create(options);

function setRange() {
    chart.updateDelta({ annotations: { magnet: { range: 30 } } });
}

function setNearest() {
    chart.updateDelta({ annotations: { magnet: { range: 'nearest' } } });
}
