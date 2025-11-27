import { ModuleRegistry } from 'ag-charts-community';
import { AgCharts, AgGaugeOptions, AllGaugeModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule]);
const performanceStages = ['VERY POOR', 'POOR', 'AVERAGE', 'GOOD', 'VERY GOOD', 'EXCELLENT'].flatMap((item) => [
    '',
    item,
]);

const options: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 89,
    segmentation: {
        spacing: 4,
    },
    innerRadiusRatio: 0.7,
    scale: {
        min: 0,
        max: 100,
        interval: {
            step: 10,
        },
        label: {
            formatter: ({ index }) => {
                return `${performanceStages[index]}`;
            },
        },
    },
    bar: {
        fillMode: 'discrete',
        fills: [
            { color: '#ef5452' },
            { color: '#F38B06' },
            { color: '#e1cc00' },
            { color: '#92B83C' },
            { color: '#459d55' },
        ],
    },
    label: {
        formatter: ({ value }) => {
            return `${value.toFixed(0)}%`;
        },
    },
    secondaryLabel: {
        text: 'Grid Performance',
    },
};

AgCharts.createGauge(options);
