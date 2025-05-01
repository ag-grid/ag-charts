import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Water Usage',
    },
    subtitle: {
        text: 'Daily Water Usage Per Person Per Day In Litres',
    },
    data: getData(),
    series: [
        {
            type: 'area',
            stacked: true,
            yKey: 'Germany',
            xKey: 'year',

            fill: {
                type: 'image',
                url: 'https://localhost:4600/charts/example-assets/docs-images/flags/germany.png',
                height: 20,
                width: 20,
                repetition: 'repeat',
                backgroundFill: 'transparent',
            },
        },
        {
            type: 'area',
            stacked: true,
            yKey: 'UK',
            xKey: 'year',

            fill: {
                type: 'image',
                url: 'https://localhost:4600/charts/example-assets/docs-images/flags/uk.png',
                height: 20,
                width: 20,
                repetition: 'repeat',
                backgroundFill: 'transparent',
            },
        },
        {
            type: 'area',
            stacked: true,
            yKey: 'Italy',
            xKey: 'year',

            fill: {
                type: 'image',
                url: 'https://localhost:4600/charts/example-assets/docs-images/flags/italy.png',
                height: 20,
                width: 20,
                repetition: 'repeat',
                backgroundFill: 'transparent',
            },
        },
        {
            type: 'area',
            stacked: true,
            yKey: 'India',
            xKey: 'year',

            fill: {
                type: 'image',
                url: 'https://localhost:4600/charts/example-assets/docs-images/flags/india.png',
                height: 20,
                width: 20,
                repetition: 'repeat',
                backgroundFill: 'transparent',
            },
        },
        {
            type: 'area',
            stacked: true,
            yKey: 'Japan',
            xKey: 'year',

            fill: {
                type: 'image',
                url: 'https://localhost:4600/charts/example-assets/docs-images/flags/japan.png',
                height: 20,
                width: 20,
                repetition: 'repeat',
                backgroundFill: 'transparent',
            },
        },
    ],
};

const chart = AgCharts.create(options);
