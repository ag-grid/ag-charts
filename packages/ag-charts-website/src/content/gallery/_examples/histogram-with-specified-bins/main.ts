import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

type GradeBoundaries = {
    U: [number, number];
    E: [number, number];
    D: [number, number];
    C: [number, number];
    B: [number, number];
    A: [number, number];
    'A*': [number, number];
};

const gradeBoundaries: GradeBoundaries = {
    U: [0, 98],
    E: [98, 130],
    D: [130, 162],
    C: [162, 194],
    B: [194, 226],
    A: [226, 258],
    'A*': [258, 370],
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Student Performance Report',
    },
    subtitle: {
        text: 'Distribution of Exam Scores and Grades',
    },
    footnote: {
        text: 'Academic Performance of Students at Clifton School (2023)',
    },
    series: Object.entries(getData()).map(([grade, gradeData]) => ({
        data: gradeData,
        type: 'histogram',
        xKey: 'score',
        xName: grade,
        yName: grade,
        bins: [gradeBoundaries[grade as keyof typeof gradeBoundaries]],
        areaPlot: true,
        tooltip: {
            renderer: ({ datum: { domain }, xName }) => {
                return {
                    title: `Grade: ${xName}`,
                    content: `Score: ${domain.join(' - ')}`,
                };
            },
        },
        stroke: 'transparent',
        strokeWidth: 2,
        cornerRadius: 6,
    })),
    axes: [
        {
            position: 'bottom',
            type: 'number',
            nice: false,
            gridLine: {
                enabled: false,
            },
        },
        {
            position: 'left',
            type: 'number',
            label: {
                enabled: false,
            },
        },
    ],
    legend: {
        position: 'top',
    },
};

AgCharts.create(options);
