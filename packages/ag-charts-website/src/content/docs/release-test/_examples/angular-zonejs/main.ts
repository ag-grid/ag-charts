import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

function checkAngularZone(handler: string) {
    const zone = globalThis.Zone?.current;
    if (zone?.name !== 'angular') {
        console.error(`${handler} must be called from Angular Zone`);
    } else {
        console.log(`${handler} called from Angular Zone`);
    }
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
    data: [
        {
            quarter: 'Q1',
            petrol: 200,
            diesel: 100,
        },
        {
            quarter: 'Q2',
            petrol: 300,
            diesel: 130,
        },
        {
            quarter: 'Q3',
            petrol: 350,
            diesel: 160,
        },
        {
            quarter: 'Q4',
            petrol: 400,
            diesel: 200,
        },
    ],
    series: [
        {
            xKey: 'quarter',
            yKey: 'petrol',
            listeners: {
                nodeClick: (params) => {
                    checkAngularZone('nodeClick');
                },
                nodeDoubleClick: (params) => {
                    checkAngularZone('nodeDoubleClick');
                },
            },
        },
        {
            xKey: 'quarter',
            yKey: 'diesel',
        },
    ],
    listeners: {
        seriesNodeClick: (params) => {
            checkAngularZone('seriesNodeClick');
        },
        seriesNodeDoubleClick: (params) => {
            checkAngularZone('seriesNodeDoubleClick');
        },
        click: (params) => {
            checkAngularZone('click');
        },
        doubleClick: (params) => {
            checkAngularZone('doubleClick');
        },
    },
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
    legend: {
        listeners: {
            legendItemClick: () => {
                checkAngularZone('legendItemClick');
            },
            legendItemDoubleClick: () => {
                checkAngularZone('legendItemDoubleClick');
            },
        },
    },
};

AgCharts.create(options);
