import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import { BandHighlightModule, BoxPlotSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BandHighlightModule, BoxPlotSeriesModule, CategoryAxisModule, NumberAxisModule]);
const data = getData();

// Calculate overall median for reference line
const allMedians = data.map((d) => d.median);
const overallMedian = allMedians.reduce((a, b) => a + b, 0) / allMedians.length;

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'HR Analytics Dashboard',
    },
    subtitle: {
        text: 'Annual Compensation Distribution by Role - 2024',
    },
    data: data,
    series: [
        {
            type: 'box-plot',
            direction: 'horizontal',
            yName: 'Employee Salaries',
            xKey: 'role',
            xName: 'Role',
            minKey: 'min',
            minName: 'Minimum',
            q1Key: 'q1',
            q1Name: 'Q1',
            medianKey: 'median',
            medianName: 'Median',
            q3Key: 'q3',
            q3Name: 'Q3',
            maxKey: 'max',
            maxName: 'Maximum',
            strokeWidth: 1.5,
            cornerRadius: 4,
            whisker: {
                strokeWidth: 1.5,
            },
            cap: {
                lengthRatio: 0.5,
            },
        },
    ],
    axes: {
        y: {
            position: 'left',
            type: 'category',
            paddingInner: 0.6,
            paddingOuter: 0.3,
            bandHighlight: {
                enabled: true,
            },
            gridLine: {
                enabled: true,
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
            line: {
                enabled: false,
            },
            thickness: 130,
            label: {
                spacing: 12,
                wrapping: 'always',
            },
        },
        x: {
            position: 'bottom',
            type: 'number',
            nice: true,
            gridLine: {
                enabled: true,
                style: [
                    {
                        lineDash: [3, 3],
                    },
                ],
            },
            label: {
                formatter: ({ value }) => `£${(value / 1000).toFixed(0)}k`,
            },
            crossLines: [
                {
                    type: 'line',
                    value: overallMedian,
                    strokeWidth: 2,
                    lineDash: [6, 4],
                    label: {
                        text: `Company Median: £${(overallMedian / 1000).toFixed(0)}k`,
                        position: 'top',
                        padding: 8,
                    },
                },
                {
                    type: 'range',
                    range: [0, 6000],
                    strokeWidth: 0,
                    fillOpacity: 0.03,
                    label: {
                        text: 'Entry Level',
                        position: 'inside-top-left',
                        padding: 4,
                    },
                },
                {
                    type: 'range',
                    range: [10000, 20000],
                    strokeWidth: 0,
                    fillOpacity: 0.03,
                    label: {
                        text: 'Senior Level',
                        position: 'inside-top-right',
                        padding: 4,
                    },
                },
            ],
        },
    },
};
AgCharts.create(options);
