import {
    AgCharts,
    AgRadialGaugeOptions,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    RadialGaugeModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([RadialGaugeModule, AnimationModule, CrosshairModule, LegendModule, ContextMenuModule]);
const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 85,
    scale: {
        min: 0,
        max: 100,
    },
    segmentation: {
        enabled: true,
        interval: {
            count: 4,
        },
        spacing: 2,
    },
};

const chart = AgCharts.createGauge(options);

function setSegmentationInterval(event: Event) {
    switch ((event.target as HTMLInputElement).value) {
        case 'step':
            options.segmentation!.interval = { step: 10 };
            break;
        case 'count':
            options.segmentation!.interval = { count: 4 };
            break;
        case 'values':
            options.segmentation!.interval = { values: [40, 50, 60] };
            break;
    }
    chart.update(options);
}
