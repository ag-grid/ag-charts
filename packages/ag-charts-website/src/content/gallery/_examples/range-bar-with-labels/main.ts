import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const data = getData();

// Calculate statistics for reference lines
const allSalaries = data.flatMap((d) => [d.low, d.high]);
const avgSalary = allSalaries.reduce((a, b) => a + b, 0) / allSalaries.length;
const medianSalary = allSalaries.sort((a, b) => a - b)[Math.floor(allSalaries.length / 2)];

const formatter = ({ value }: { value: number | Date | string | string[] }) =>
    value.toLocaleString('en-GB', {
        style: 'currency',
        currency: 'GBP',
        notation: 'compact',
        compactDisplay: 'short',
    });

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'Salary Ranges By Department',
    },
    subtitle: {
        text: 'Low and High Salary Brackets Across Various Departments',
    },
    // Root-level formatter for consistent currency formatting
    formatter: {
        y: formatter,
    },
    tooltip: {
        enabled: true,
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    series: [
        {
            type: 'range-bar',
            yName: 'Salary Range',
            xKey: 'department',
            xName: 'Department',
            yLowKey: 'low',
            yLowName: 'Low',
            yHighKey: 'high',
            yHighName: 'High',
            cornerRadius: 8,
            itemStyler: ({ datum }) => {
                const rangeSize = datum.high - datum.low;
                const avgRange = data.reduce((sum, d) => sum + (d.high - d.low), 0) / data.length;
                const opacity = 0.5 + (rangeSize / avgRange) * 0.5;
                return {
                    fillOpacity: Math.min(1, Math.max(0.3, opacity)),
                };
            },
            label: {
                placement: 'outside',
                color: 'rgb(118,118,118)',
            },
            tooltip: {
                renderer: ({ datum }) => {
                    const low = datum['low'] as number;
                    const high = datum['high'] as number;
                    const range = high - low;
                    const midpoint = (high + low) / 2;
                    return {
                        heading: datum['department']!,
                        title: 'Salary Range',
                        data: [
                            {
                                label: 'Minimum',
                                value: formatter({ value: low }),
                            },
                            {
                                label: 'Maximum',
                                value: formatter({ value: high }),
                            },
                            {
                                label: 'Range',
                                value: formatter({ value: range }),
                            },
                            {
                                label: 'Midpoint',
                                value: formatter({ value: midpoint }),
                            },
                        ],
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            paddingInner: 0.4,
            bandHighlight: {
                enabled: true,
            },
        },
        {
            type: 'number',
            position: 'right',
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [3, 3],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            crosshair: {
                enabled: true,
                strokeWidth: 1,
                lineDash: [5, 5],
                label: {
                    enabled: true,
                },
            },
            crossLines: [
                {
                    type: 'line',
                    value: avgSalary,
                    strokeWidth: 1,
                    lineDash: [4, 4],
                    label: {
                        text: `Average (${avgSalary.toLocaleString('en-GB', {
                            style: 'currency',
                            currency: 'GBP',
                        })})`,
                        position: 'left',
                        padding: 5,
                    },
                },
            ],
        },
    ],
    seriesArea: {
        padding: {
            right: 25,
        },
    },
};

AgCharts.create(options);
