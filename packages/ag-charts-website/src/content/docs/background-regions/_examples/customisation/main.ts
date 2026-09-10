import {
    AgCartesianChartOptions,
    AgCharts,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    ScatterSeriesModule,
} from 'ag-charts-enterprise';

import { dealSeries } from './data';

ModuleRegistry.registerModules([LegendModule, NumberAxisModule, ScatterSeriesModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Deal Size by Segment',
    },
    seriesArea: {
        backgroundRegions: [
            {
                fill: '#5090dc',
                fillOpacity: 0.2,
                stroke: '#2b5c95',
                strokeWidth: 2,
                xRange: { start: 14, end: 31 },
                yRange: { start: 27500, end: 63000 },
                label: {
                    text: 'Retail',
                    position: 'top-left',
                    yOffset: -4,
                    color: '#2b5c95',
                    fontSize: 13,
                    fontWeight: 'bold',
                    fill: '#ffffff',
                    fillOpacity: 0.85,
                    cornerRadius: 4,
                    padding: { top: 4, right: 8, bottom: 4, left: 8 },
                    border: {
                        enabled: true,
                        stroke: '#2b5c95',
                    },
                },
            },
            {
                fill: '#ffa03a',
                fillOpacity: 0.2,
                stroke: '#cc6f10',
                strokeWidth: 2,
                xRange: { start: 43, end: 67 },
                yRange: { start: 76500, end: 129500 },
                label: {
                    text: 'Mid-Market',
                    position: 'top-left',
                    yOffset: -4,
                    color: '#cc6f10',
                    fontSize: 13,
                    fontWeight: 'bold',
                    fill: '#ffffff',
                    fillOpacity: 0.85,
                    cornerRadius: 4,
                    padding: { top: 4, right: 8, bottom: 4, left: 8 },
                    border: {
                        enabled: true,
                        stroke: '#cc6f10',
                    },
                },
            },
            {
                fill: '#459d55',
                fillOpacity: 0.2,
                stroke: '#1e652e',
                strokeWidth: 2,
                xRange: { start: 95, end: 135 },
                yRange: { start: 170500, end: 233000 },
                label: {
                    text: 'Enterprise',
                    position: 'top-left',
                    yOffset: -4,
                    color: '#1e652e',
                    fontSize: 13,
                    fontWeight: 'bold',
                    fill: '#ffffff',
                    fillOpacity: 0.85,
                    cornerRadius: 4,
                    padding: { top: 4, right: 8, bottom: 4, left: 8 },
                    border: {
                        enabled: true,
                        stroke: '#1e652e',
                    },
                },
            },
        ],
    },
    series: [
        {
            type: 'scatter',
            title: 'Retail',
            data: dealSeries.Retail,
            xKey: 'cycleDays',
            xName: 'Sales Cycle',
            yKey: 'dealValue',
            yName: 'Deal Value',
        },
        {
            type: 'scatter',
            title: 'Mid-Market',
            data: dealSeries.MidMarket,
            xKey: 'cycleDays',
            xName: 'Sales Cycle',
            yKey: 'dealValue',
            yName: 'Deal Value',
        },
        {
            type: 'scatter',
            title: 'Enterprise',
            data: dealSeries.Enterprise,
            xKey: 'cycleDays',
            xName: 'Sales Cycle',
            yKey: 'dealValue',
            yName: 'Deal Value',
        },
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            nice: false,
            title: {
                text: 'Sales Cycle (days)',
            },
            label: {
                formatter: (params) => {
                    return params.value + ' days';
                },
            },
        },
        y: {
            type: 'number',
            position: 'left',
            nice: false,
            title: {
                text: 'Deal Value',
            },
            label: {
                formatter: (params) => {
                    return '$' + params.value / 1000 + 'k';
                },
            },
        },
    },
};

const chart = AgCharts.create(options);
