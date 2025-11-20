import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';
import { AllGaugeModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule]);
const options: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    title: {
        text: 'Vehicle Speed Monitor',
    },
    value: 89,
    startAngle: 270,
    endAngle: 540,
    tooltip: {
        enabled: true,
        renderer: ({ value }) => {
            const status = value >= 70 ? 'EXCEEDING LIMIT' : 'WITHIN LIMIT';
            const risk = value >= 85 ? 'HIGH RISK' : value >= 65 ? 'MODERATE RISK' : 'SAFE';

            return {
                heading: 'Current Speed',
                title: `${value} mph`,
                data: [
                    { label: 'Status', value: status },
                    { label: 'Risk Level', value: risk },
                    { label: 'Speed Limit', value: '70 mph' },
                    { label: 'Safety Zone', value: '≤ 65 mph' },
                ],
            };
        },
    },
    scale: {
        min: 0,
        max: 120,
        interval: {
            step: 10,
        },
        fillOpacity: 0.85,
    },
    segmentation: {
        interval: {
            values: [65, 85, 100],
        },
    },
    bar: {
        fillOpacity: 0.8,
    },
    innerRadiusRatio: 0.8,

    secondaryLabel: {
        text: 'mph',
    },
    cornerRadius: 40,
    targets: [
        {
            value: 70,
            shape: 'triangle',
            placement: 'inside',
            spacing: 12,
            size: 16,
            strokeWidth: 2,
            text: 'LIMIT',
            label: {
                fontSize: 18,
            },
        },
    ],
};

AgCharts.createGauge(options);
