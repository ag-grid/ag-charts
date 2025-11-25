import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { BandHighlightModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([LineSeriesModule, BandHighlightModule, CategoryAxisModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Eating Hours In A Day',
    },
    subtitle: {
        text: 'Hours spent per day eating and drinking by age group',
    },
    footnote: {
        text: 'Source: American Time Use Survey (2012-2022)',
    },
    tooltip: {
        enabled: true,
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    series: Object.entries(getData()).map(([ageGroup, data]) => ({
        data,
        type: 'line',
        xKey: 'year',
        yKey: 'estimate',
        yName: ageGroup,
        interpolation: {
            type: 'smooth',
        },
        label: {
            enabled: true,
            formatter: (params) => {
                // Only show labels for first and last points
                const currentYear = params.datum.year;
                if (currentYear === '2012' || currentYear === '2022') {
                    const value = params.value as number;
                    return `${Math.round(value * 60)}m`;
                }
                return '';
            },
        },
        marker: {
            size: 7,
            strokeWidth: 2,
        },
    })),
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            line: {
                enabled: false,
            },
            bandHighlight: {
                enabled: true,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Time',
            },
            interval: { step: 0.5 },
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
            tick: {
                size: 10,
            },
            line: {
                enabled: true,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 1,
                    strokeOpacity: 0.3,
                    lineDash: [6, 4],
                    label: {
                        text: '1 hour',
                        position: 'right',
                    },
                },
            ],
        },
    },
    formatter: {
        y(params) {
            const value = params.value as number;

            if (params.source === 'series-label') {
                return `${Math.round(value * 60)}m`;
            }

            const hours = Math.floor(value);
            const minutes = Math.round((value % 1) * 60);
            const minutesString = String(minutes).padStart(2, '0');

            if (params.source !== 'axis-label') {
                return `${hours}h ${minutesString}m`;
            }

            if (hours === 0) {
                return `${minutes}m`;
            } else if (minutes === 0) {
                return `${hours}h`;
            }
            return `${hours}h ${minutesString}m`;
        },
    },
};

AgCharts.create(options);
