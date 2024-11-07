import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';

const performanceStages = ['VERY POOR', 'POOR', 'AVERAGE', 'GOOD', 'VERY GOOD', 'EXCELLENT'].flatMap((item) => [
    '',
    item,
]);

const options: AgGaugeOptions = {
    type: 'radial-gauge',
    container: document.getElementById('myChart'),
    value: 89,
    segmentation: {
        interval: {
            count: 4,
        },
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
    },
    label: {
        fontSize: 20,
    },
    secondaryLabel: {
        text: 'Grid Performance',
    },
};

AgCharts.createGauge(options);
