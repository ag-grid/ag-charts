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
        fontSize: 14,
        placement: 'inside-end',
    },
};

AgCharts.createGauge(options);
