import {
    AgCharts,
    AgLinearGaugeOptions,
    AllGaugeModule,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule, AnimationModule, CrosshairModule, LegendModule, ContextMenuModule]);
const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    direction: 'horizontal',
    container: document.getElementById('myChart'),
    padding: {
        left: 30,
        right: 30,
    },
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
            count: 10,
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
