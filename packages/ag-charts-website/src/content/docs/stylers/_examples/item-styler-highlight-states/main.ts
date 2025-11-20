import { AgBarSeriesItemStylerParams, AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Highlight State Styling Demo',
    },
    subtitle: {
        text: 'Hover over bars or legend items to see different highlight states',
    },
    data: [
        { category: 'Q1', series1: 30, series2: 45 },
        { category: 'Q2', series1: 25, series2: 55 },
        { category: 'Q3', series1: 40, series2: 35 },
        { category: 'Q4', series1: 35, series2: 50 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'series1',
            yName: 'Product A',
            fill: '#5470c6',
            itemStyler: (params: AgBarSeriesItemStylerParams<unknown, unknown>) => {
                // The new highlightState parameter provides more granular control
                switch (params.highlightState) {
                    case 'highlighted-item':
                        // This specific bar is highlighted - make it bright and bold
                        return {
                            fill: '#ffd700', // Gold color
                            fillOpacity: 1,
                            stroke: '#ff8c00', // Dark orange border
                            strokeWidth: 4,
                            strokeOpacity: 1,
                        };
                    case 'unhighlighted-item':
                        // Another bar in this series is highlighted - fade this one
                        return {
                            fill: '#5470c6',
                            fillOpacity: 0.2,
                            stroke: '#5470c6',
                            strokeOpacity: 0.1,
                            strokeWidth: 1,
                        };
                    case 'highlighted-series':
                        // The entire series is highlighted (via legend) - make it prominent
                        return {
                            fill: '#7d9adb', // Lighter shade
                            fillOpacity: 0.9,
                            stroke: '#3d5394', // Darker shade
                            strokeWidth: 2,
                            strokeOpacity: 1,
                        };
                    case 'unhighlighted-series':
                        // Another series is highlighted - significantly fade this series
                        return {
                            fill: '#5470c6',
                            fillOpacity: 0.15,
                            stroke: '#5470c6',
                            strokeOpacity: 0.1,
                            strokeWidth: 1,
                        };
                    case 'none':
                    default:
                        // No highlighting active - use default styles
                        return undefined;
                }
            },
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'series2',
            yName: 'Product B',
            fill: '#91cc75',
            itemStyler: (params: AgBarSeriesItemStylerParams<unknown, unknown>) => {
                // Similar styling logic for the second series
                switch (params.highlightState) {
                    case 'highlighted-item':
                        // This specific bar is highlighted - make it bright and bold
                        return {
                            fill: '#ffd700', // Gold color
                            fillOpacity: 1,
                            stroke: '#ff8c00', // Dark orange border
                            strokeWidth: 4,
                            strokeOpacity: 1,
                        };
                    case 'unhighlighted-item':
                        // Another bar in this series is highlighted - fade this one
                        return {
                            fill: '#91cc75',
                            fillOpacity: 0.2,
                            stroke: '#91cc75',
                            strokeOpacity: 0.1,
                            strokeWidth: 1,
                        };
                    case 'highlighted-series':
                        // The entire series is highlighted (via legend) - make it prominent
                        return {
                            fill: '#a7d698', // Lighter shade
                            fillOpacity: 0.9,
                            stroke: '#6fa054', // Darker shade
                            strokeWidth: 2,
                            strokeOpacity: 1,
                        };
                    case 'unhighlighted-series':
                        // Another series is highlighted - significantly fade this series
                        return {
                            fill: '#91cc75',
                            fillOpacity: 0.15,
                            stroke: '#91cc75',
                            strokeOpacity: 0.1,
                            strokeWidth: 1,
                        };
                    case 'none':
                    default:
                        // No highlighting active - use default styles
                        return undefined;
                }
            },
        },
    ],
    legend: {
        position: 'bottom',
    },
};

AgCharts.create(options);
