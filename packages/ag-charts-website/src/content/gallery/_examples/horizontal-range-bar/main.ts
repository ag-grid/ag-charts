import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const subjects = ['Math', 'English', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Student Performance Over the Academic Year',
    },
    subtitle: {
        text: 'Comparison of Low and High Scores by Subject',
    },
    footnote: {
        text: 'The range of student scores in various subjects, including both the start and end of the academic year',
    },
    data: getData(),
    series: [
        {
            type: 'range-bar',
            direction: 'horizontal',
            xKey: 'subject',
            xName: 'Subject',
            yName: 'Exam Results Range',
            yLowKey: 'low',
            yHighKey: 'high',
            cornerRadius: 3,
            itemStyler: ({ datum, xKey }) => {
                const isSecondExam = datum[xKey].slice(-1) === '2';
                return {
                    fillOpacity: isSecondExam ? 1 : 0.5,
                };
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
            line: {
                enabled: false,
            },
            paddingInner: 0.7,
            paddingOuter: 0.3,
            label: {
                enabled: false,
            },
            crossLines: subjects.map((subject) => ({
                type: 'range',
                range: [subject, `${subject} 2`],
                fillOpacity: 0,
                lineDash: [1, 2],
                strokeOpacity: 0.4,
                label: {
                    text: subject,
                    position: 'inside',
                    fontSize: 11,
                },
            })),
        },
        {
            type: 'number',
            position: 'top',
            gridLine: {
                enabled: false,
            },
            crosshair: {
                snap: true,
            },
        },
    ],
};

AgCharts.create(options);
