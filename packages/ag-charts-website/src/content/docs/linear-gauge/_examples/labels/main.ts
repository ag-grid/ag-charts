import { AgCharts, AgLinearGaugeLabelPlacement, AgLinearGaugeOptions } from 'ag-charts-enterprise';

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
    },
};

const chart = AgCharts.createGauge(options);

const placementColors: Record<AgLinearGaugeLabelPlacement, string> = {
    'inside-start': 'white',
    'outside-start': '#888',
    'inside-end': '#888',
    'outside-end': '#888',
    'inside-center': 'white',
    'bar-inside': 'white',
    'bar-inside-end': 'white',
    'bar-outside-end': '#888',
    'bar-end': 'white',
};

function setLabelPlacement(placement: AgLinearGaugeLabelPlacement) {
    options.label!.placement = placement;
    options.label!.color = placementColors[placement];
    chart.update(options);
}

function setAvoidCollisions(avoidCollisions: boolean) {
    options.label!.avoidCollisions = avoidCollisions;
    chart.update(options);
}

function setValue(value: number) {
    options.value = value;
    chart.update(options);
}
