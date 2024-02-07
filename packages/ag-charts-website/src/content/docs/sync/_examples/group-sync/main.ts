import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
            label: {
                autoRotate: false,
            },
        },
    ],
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'spending',
        },
    ],
    tooltip: {
        enabled: false,
    },
    sync: {
        enabled: true,
    },
    zoom: {
        enabled: true,
        enableSelecting: true,
        enableAxisDragging: false,
        anchorPointX: 'pointer',
    },
};

const chart1 = AgCharts.create({
    ...options,
    data: getData(200, -200),
    title: {
        text: 'Average expenditure on coffee',
    },
    subtitle: {
        text: `per person per week in Krakozhia\nspanning 200 years starting from ${new Date().getFullYear() - 200}`,
    },
    container: document.getElementById('myChart1'),
    sync: { groupId: 'altGroup' },
});

const chart2 = AgCharts.create({
    ...options,
    data: getData(200),
    title: {
        text: 'Average expenditure on coffee',
    },
    subtitle: {
        text: `per person per week in Krakozhia\nspanning 200 years starting from ${new Date().getFullYear()}`,
    },
    container: document.getElementById('myChart2'),
});

const chart3 = AgCharts.create({
    ...options,
    data: getData(200, -200),
    title: {
        text: 'Average expenditure on tea',
    },
    subtitle: {
        text: `per person per week in Krakozhia\nspanning 200 years starting from ${new Date().getFullYear() - 200}`,
    },
    container: document.getElementById('myChart3'),
    sync: { groupId: 'altGroup' },
});

const chart4 = AgCharts.create({
    ...options,
    data: getData(200),
    title: {
        text: 'Average expenditure on tea',
    },
    subtitle: {
        text: `per person per week in Krakozhia\nspanning 200 years starting from ${new Date().getFullYear()}`,
    },
    container: document.getElementById('myChart4'),
});
