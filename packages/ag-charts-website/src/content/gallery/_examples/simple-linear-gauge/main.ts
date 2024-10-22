import { AgCharts, AgLinearGaugeOptions } from 'ag-charts-enterprise';

const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('myChart'),
    theme: {
        overrides: {
            'linear-gauge': {
                targets: {
                    placement: 'before',
                    size: 10,
                    fillOpacity: 0,
                    shape: 'circle',
                    strokeWidth: 2,
                    stroke: 'orange',
                },
            },
        },
    },
    title: {
        text: 'Assessment of Chemical Concentration Levels',
        spacing: 50,
    },
    value: 84,
    segmentation: {
        interval: {
            count: 2,
        },
        spacing: 4,
    },
    cornerRadius: 50,
    scale: {
        min: 0,
        max: 100,
        interval: {
            step: 33,
        },
        label: {
            enabled: false,
        },
    },
    bar: {
        fillMode: 'discrete',
        strokeWidth: 1,
        strokeOpacity: 0.2,
        fillOpacity: 0.7,
    },
    targets: [
        {
            value: 20,
            text: 'Low 0-20 mol/L',
        },
        {
            value: 33,
            text: 'Suboptimal Concentration 21-33 mol/L',
        },
        {
            value: 65,
            text: 'Operational Range 34-65 mol/L',
        },
        {
            value: 80,
            text: 'Optimal 66-80 mol/L',
            stroke: 'green',
        },
        {
            value: 89,
            text: 'Threshold Limit >80 mol/L',
            stroke: 'red',
            placement: 'after',
            shape: 'line',
            size: 20,
        },
    ],
    label: {
        enabled: false,
    },
};

AgCharts.createGauge(options);
