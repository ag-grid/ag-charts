import { HistogramSeriesModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, AgHistogramSeriesOptions } from 'ag-charts-enterprise';
import { CrosshairModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([CrosshairModule, HistogramSeriesModule, LegendModule, NumberAxisModule]);
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

const options: AgCartesianChartOptions<DataType> = {
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
    formatter: {
        y: ({ value }) => (typeof value === 'number' ? value.toFixed(1) : String(value)),
    },
    series: Object.entries(getData()).map(
        ([grade, gradeData], index) =>
            ({
                data: gradeData,
                type: 'histogram',
                xKey: 'score',
                xName: grade,
                yName: `Grade ${grade}`,
                bins: [gradeBoundaries[grade as keyof typeof gradeBoundaries]],
                areaPlot: true,
                tooltip: {
                    renderer: ({ datum, xName }) => {
                        const [minScore, maxScore] = datum.domain;
                        const scoreRange = minScore === maxScore ? `${minScore}` : `${minScore} - ${maxScore}`;

                        return {
                            heading: scoreRange,
                            title: `Grade ${xName}`,
                            data: [{ label: 'Students', value: datum.frequency.toFixed(0) }],
                        };
                    },
                },
                strokeWidth: 1,
                cornerRadius: 4,
                fill: index % 3 === 1 ? { type: 'pattern' } : undefined,
            }) satisfies AgHistogramSeriesOptions<DataType>
    ),
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
            nice: false,
            title: {
                text: 'Exam Score',
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            crosshair: {
                enabled: true,
                lineDash: [5, 5],
                label: {
                    enabled: true,
                    formatter: ({ value }) => value.toFixed(0),
                },
            },
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Frequency Density',
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
    },
    legend: {
        maxHeight: 240,
        maxWidth: 280,
        position: {
            placement: 'top-right',
            floating: true,
            xOffset: -20,
            yOffset: 20,
        },
        padding: 10,
        border: {
            enabled: true,
        },
        item: {
            paddingX: 16,
            paddingY: 8,
            marker: {
                size: 18,
            },
        },
    },
};

AgCharts.create(options);
