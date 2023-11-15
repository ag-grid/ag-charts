import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: "Apple's Revenue by Product Category",
    },
    subtitle: {
        text: 'In Billion U.S. Dollars',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'NAQ1',
            yName: 'Q1 - North America',
            legendItemName: 'Q1',
            stackGroup: 'na',
            fill: '#5090dc',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'NAQ2',
            yName: 'Q2 - North America',
            legendItemName: 'Q2',
            stackGroup: 'na',
            fill: '#ffa03a',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'NAQ3',
            yName: 'Q3 - North America',
            legendItemName: 'Q3',
            stackGroup: 'na',
            fill: '#459d55',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'NAQ4',
            yName: 'Q4 - North America',
            legendItemName: 'Q4',
            stackGroup: 'na',
            fill: '#34bfe1',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'EURQ1',
            yName: 'Q1 - Europe',
            legendItemName: 'Q1',
            stackGroup: 'eur',
            showInLegend: false,
            fill: '#5090dc',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'EURQ2',
            yName: 'Q2 - Europe',
            legendItemName: 'Q2',
            stackGroup: 'eur',
            showInLegend: false,
            fill: '#ffa03a',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'EURQ3',
            yName: 'Q3 - Europe',
            legendItemName: 'Q3',
            stackGroup: 'eur',
            showInLegend: false,
            fill: '#459d55',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'EURQ4',
            yName: 'Q4 - Europe',
            legendItemName: 'Q4',
            stackGroup: 'eur',
            showInLegend: false,
            fill: '#34bfe1',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'ASIAQ1',
            yName: 'Q1 - Asia',
            legendItemName: 'Q1',
            stackGroup: 'asia',
            showInLegend: false,
            fill: '#5090dc',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'ASIAQ2',
            yName: 'Q2 - Asia',
            legendItemName: 'Q2',
            stackGroup: 'asia',
            showInLegend: false,
            fill: '#ffa03a',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'ASIAQ3',
            yName: 'Q3 - Asia',
            legendItemName: 'Q3',
            stackGroup: 'asia',
            showInLegend: false,
            fill: '#459d55',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'ASIAQ4',
            yName: 'Q4 - Asia',
            legendItemName: 'Q4',
            stackGroup: 'asia',
            showInLegend: false,
            fill: '#34bfe1',
        },
    ],
};

AgCharts.create(options);
