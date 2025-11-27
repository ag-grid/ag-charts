import { AgCharts, AgLinearGaugeOptions, AllGaugeModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllGaugeModule]);
const performanceStages = ['VERY POOR', 'POOR', 'AVERAGE', 'GOOD', 'VERY GOOD', 'EXCELLENT'].flatMap((item) => [
    '',
    item,
]);

const options: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('myChart'),
    direction: 'horizontal',
    title: {
        text: 'Performance Level',
    },
    value: 55,
    segmentation: {
        spacing: 4,
    },
    scale: {
        min: 0,
        max: 100,
        interval: {
            step: 10,
        },
        label: {
            placement: 'after',
            formatter: ({ index }) => {
                return `${performanceStages[index]}`;
            },
        },
    },
    bar: {
        fillMode: 'discrete',
    },
    targets: [
        {
            value: 80,
            text: 'Target',
            placement: 'before',
            shape: 'circle',
            fillOpacity: 0.3,
        },
    ],
    label: {
        placement: 'inside-end',
    },
    tooltip: {
        enabled: true,
        renderer: (params) => {
            const currentValue = params.value;
            const targetValue = 80;
            const performance = performanceStages[Math.floor((currentValue / 100) * performanceStages.length)];
            const gap =
                currentValue >= targetValue
                    ? `${(currentValue - targetValue).toFixed(0)} above target`
                    : `${(targetValue - currentValue).toFixed(0)} below target`;

            return {
                title: 'Performance Score',
                data: [
                    { label: 'Current:', value: `${currentValue}/100` },
                    { label: 'Category:', value: `${performance || 'Excellent'}` },
                    { label: 'Target:', value: `${targetValue}/100` },
                    { label: 'Gap:', value: `${gap}` },
                ],
            };
        },
    },
};

AgCharts.createGauge(options);
