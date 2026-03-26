import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    width: 668,
    height: 220,
    zoom: { enabled: true, autoScaling: { enabled: false } },
    axes: {
        y: { position: 'left', nice: true, label: { autoRotate: false } },
        x: { position: 'bottom', label: { autoRotate: false } },
    },
    legend: { enabled: false },
    series: [
        { type: 'bar', xKey: 'country', yKey: 'gold', width: 20 },
        { type: 'bar', xKey: 'country', yKey: 'silver', width: 20 },
        { type: 'bar', xKey: 'country', yKey: 'bronze', width: 20 },
    ],
    data: [
        { country: 'United States', gold: 552, silver: 440, bronze: 320 },
        { country: 'Russia', gold: 234, silver: 221, bronze: 313 },
        { country: 'Australia', gold: 163, silver: 226, bronze: 220 },
        { country: 'Canada', gold: 168, silver: 98, bronze: 104 },
        { country: 'Norway', gold: 97, silver: 44, bronze: 51 },
        { country: 'China', gold: 234, silver: 156, bronze: 140 },
        { country: 'Zimbabwe', gold: 2, silver: 4, bronze: 1 },
        { country: 'Netherlands', gold: 101, silver: 135, bronze: 82 },
        { country: 'South Korea', gold: 110, silver: 93, bronze: 105 },
        { country: 'Croatia', gold: 35, silver: 14, bronze: 32 },
    ],
};

AgCharts.create(options);
