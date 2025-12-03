import { AgCartesianChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

function checkAngularZone(handler: string) {
    if ((globalThis as any).Zone?.current?.name !== 'angular') {
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
            type: 'line',
            xKey: 'quarter',
            yKey: 'petrol',
            listeners: {
                seriesNodeClick: () => {
                    checkAngularZone('nodeClick');
                },
                seriesNodeDoubleClick: () => {
                    checkAngularZone('nodeDoubleClick');
                },
            },
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'diesel',
        },
    ],
    listeners: {
        seriesNodeClick: () => {
            checkAngularZone('seriesNodeClick');
        },
        seriesNodeDoubleClick: () => {
            checkAngularZone('seriesNodeDoubleClick');
        },
        click: () => {
            checkAngularZone('click');
        },
        doubleClick: () => {
            checkAngularZone('doubleClick');
        },
    },
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
