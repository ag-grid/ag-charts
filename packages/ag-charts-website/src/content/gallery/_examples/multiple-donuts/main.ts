import { DonutSeriesModule, ModuleRegistry } from 'ag-charts-community';
import { AgCharts, AgDonutSeriesOptions, AgPolarChartOptions, AnimationModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AnimationModule, DonutSeriesModule]);
const data = getData();

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Water Usage Comparison',
    },
    subtitle: {
        text: 'Daily Water Consumption Per Person by Region (Litres)',
    },
    series: [
        {
            data: data['countries'],
            type: 'donut',
            angleKey: 'value',
            sectorLabelKey: 'country',
            outerRadiusRatio: 1,
            innerRadiusRatio: 0.62,
            cornerRadius: 5,
            fillOpacity: 0.85,
            strokeWidth: 2,
            strokeOpacity: 0.2,
            highlight: {
                highlightedItem: {
                    strokeWidth: 3,
                    strokeOpacity: 0.5,
                },
            },
            tooltip: {
                renderer: ({ datum, angleKey, sectorLabelKey }) => ({
                    heading: 'Water Usage Comparison',
                    title: datum[sectorLabelKey!],
                    data: [
                        {
                            label: 'Water Usage',
                            value: `${datum[angleKey].toLocaleString()} litres/day`,
                        },
                        {
                            label: 'Share',
                            value: `${((datum[angleKey] / data['countries'].reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%`,
                        },
                    ],
                }),
            },
        } as AgDonutSeriesOptions,
        {
            data: data['continents'],
            type: 'donut',
            angleKey: 'value',
            sectorLabelKey: 'continent',
            outerRadiusRatio: 0.52,
            innerRadiusRatio: 0.15,
            cornerRadius: 3,
            fillOpacity: 0.95,
            strokeWidth: 2,
            strokeOpacity: 0.15,
            highlight: {
                highlightedItem: {
                    strokeWidth: 3,
                    strokeOpacity: 0.4,
                },
            },
            tooltip: {
                renderer: ({ datum, angleKey, sectorLabelKey }) => ({
                    heading: 'Regional Overview',
                    title: datum[sectorLabelKey!],
                    data: [
                        {
                            label: 'Total Usage',
                            value: `${datum[angleKey].toLocaleString()} litres/day`,
                        },
                        {
                            label: 'Average per Country',
                            value: `${(datum[angleKey] / 3).toFixed(0)} litres/day`,
                        },
                    ],
                }),
            },
        } as AgDonutSeriesOptions,
    ],
    formatter: {
        angle: '#{,.0f}L',
    },
    legend: {
        enabled: false,
    },
    animation: {
        enabled: true,
        duration: 800,
    },
};

AgCharts.create(options);
