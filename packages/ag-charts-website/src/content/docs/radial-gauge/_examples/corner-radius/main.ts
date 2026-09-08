import {
    AgCharts,
    AgRadialGaugeOptions,
    AllGaugeModule,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule, AnimationModule, CrosshairModule, LegendModule, ContextMenuModule]);
const options: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 85,
    scale: {
        min: 0,
        max: 100,
    },
    cornerRadius: 99,
    cornerMode: 'container',
    segmentation: {
        enabled: false,
        interval: {
            count: 4,
        },
        spacing: 2,
    },
};

const chart = AgCharts.createGauge(options);

function setCornerMode(event: Event) {
    options.cornerMode = (event.target as HTMLInputElement).value as 'container' | 'item';
    chart.update(options);
}

function setSegmentation(event: Event) {
    options.segmentation!.enabled = (event.target as HTMLInputElement).value === 'true';
    chart.update(options);
}
