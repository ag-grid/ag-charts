import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

const STATIONS = [
    'Finsbury\nPark',
    'Seven\nSisters',
    'Tottenham\nHale',
    'Warren\nStreet',
    'Oxford\nCircus',
    'Green\nPark',
];

// Make the maker scale-in animation duration = 0.
(window as any).agChartsDebug = ['animationImmediateMarkerSwipeScaleIn'];

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: STATIONS.map((station) => {
        return { station, early: 4000 };
    }),
    animation: {
        enabled: true,
        duration: 60_000,
    },
    series: [
        {
            type: 'line',
            xKey: 'station',
            yKey: 'early',
            marker: { size: 15, fill: 'red', shape: 'cross' },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            gridLine: { style: [{ stroke: 'gray', lineDash: [10, 5] }] },
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

let chart = AgCharts.create(options);

function reset() {
    chart.destroy();
    chart = AgCharts.create(options);
}
