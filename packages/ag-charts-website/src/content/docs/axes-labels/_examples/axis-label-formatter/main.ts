import { AgChartOptions, AgCharts } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { os: 'Windows', share: 0.88 },
        { os: 'macOS', share: 0.094 },
        { os: 'Linux', share: 0.187 },
    ],
    title: {
        text: 'Desktop Operating Systems',
    },
    series: [
        {
            type: 'bar',
            xKey: 'os',
            yKey: 'share',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            label: {
                formatter: ({ value }) => {
                    return value == 'Windows' ? '== Windows ==' : value;
                },
            },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => {
                    return params.value * 100 + '%';
                },
            },
        },
    ],
};

AgCharts.create(options);
