import { AgCharts, AgLinearGaugeOptions } from 'ag-charts-enterprise';

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
        interval: {
            count: 4,
        },
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
                content: `Current: ${currentValue}/100\nCategory: ${performance || 'Excellent'}\nTarget: ${targetValue}/100\nGap: ${gap}`,
            };
        },
    },
};

AgCharts.createGauge(options);
