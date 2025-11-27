import { ModuleRegistry } from 'ag-charts-community';
import { AgCharts, AgLinearGaugeOptions, AllGaugeModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule]);
const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('myChart'),
    theme: {
        overrides: {
            'linear-gauge': {
                targets: {
                    placement: 'before',
                    size: 12,
                    fillOpacity: 0,
                    shape: 'circle',
                    strokeWidth: 3,
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
        label: {
            enabled: false,
        },
    },
    bar: {
        fillMode: 'discrete',
        strokeWidth: 1,
        strokeOpacity: 0.2,
        fillOpacity: 0.8,
    },
    tooltip: {
        enabled: true,
        renderer: ({ value }) => ({
            heading: `Current Level: ${value} mol/L`,
            title: 'Chemical Concentration',
            data: [
                { label: 'Measured Value', value: `${value} mol/L` },
                { label: 'Status', value: getStatusForValue(value) },
                { label: 'Range', value: getRangeForValue(value) },
            ],
        }),
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
            size: 25,
        },
    ],
};

function getStatusForValue(value: number): string {
    if (value <= 20) return 'Low Level';
    if (value <= 33) return 'Suboptimal';
    if (value <= 65) return 'Operational';
    if (value <= 80) return 'Optimal';
    return 'Above Threshold';
}

function getRangeForValue(value: number): string {
    if (value <= 20) return '0-20 mol/L';
    if (value <= 33) return '21-33 mol/L';
    if (value <= 65) return '34-65 mol/L';
    if (value <= 80) return '66-80 mol/L';
    return '>80 mol/L';
}

AgCharts.createGauge(options);
