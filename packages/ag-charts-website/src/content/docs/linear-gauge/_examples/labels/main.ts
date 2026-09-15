import {
    AgCharts,
    AgLinearGaugeLabelPlacement,
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
    container: document.getElementById('myChart'),
    direction: 'horizontal',
    value: 50,
    scale: {
        min: 0,
        max: 100,
        label: {
            enabled: false,
        },
    },
    label: {
        enabled: true,
        placement: 'inside-start',
        avoidCollisions: true,
        color: { ref: 'textColor' },
    },
};

const chart = AgCharts.createGauge(options);

function setLabelPlacement(placement: AgLinearGaugeLabelPlacement) {
    options.label!.placement = placement;
    chart.update(options);
}

function setAvoidCollisions(avoidCollisions: boolean) {
    options.label!.avoidCollisions = avoidCollisions;
    chart.update(options);
}

function setValue(value: string) {
    document.getElementById('gaugeValueLabel')!.innerHTML = value;
    options.value = Number(value);
    chart.update(options);
}
