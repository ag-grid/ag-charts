import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Dow Jones Industrial Average',
    },
    subtitle: {
        text: 'Candlestick Patterns',
    },
    footnote: {
        text: '1 Minute',
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            xName: 'Time',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
        },
    ],
    axes: [
        {
            type: 'ordinal-time',
            position: 'bottom',
            label: {
                format: '%H:%M',
            },
        },
        {
            type: 'number',
            position: 'right',
            label: {
                formatter: ({ value }) => Number(value).toLocaleString(),
            },
        },
    ],
    annotations: {
        enabled: true,
    },
    toolbar: {
        annotations: {
            enabled: true,
        },
    },
    tooltip: { enabled: false },
};

const chart = AgCharts.create(options);

let blob =
    'eyJhbm5vdGF0aW9ucyI6W3sidHlwZSI6InBhcmFsbGVsLWNoYW5uZWwiLCJzaXplIjoxMi40NjA3MzI5ODQyOTEwOTksIm1pZGRsZSI6eyJzdHJva2VXaWR0aCI6MSwibGluZURhc2giOls2LDVdfSwiYmFja2dyb3VuZCI6eyJmaWxsIjoiIzUwOTBkYyIsImZpbGxPcGFjaXR5IjowLjJ9LCJzdGFydCI6eyJ4IjoiMjAyNC0wMy0yMVQxODo0NTowMC4wMDBaIiwieSI6Mzk4MjYuNDkyMTQ2NTk2ODZ9LCJlbmQiOnsieCI6IjIwMjQtMDMtMjFUMTg6NTY6MDAuMDAwWiIsInkiOjM5ODQxLjM2MTI1NjU0NDV9LCJoYW5kbGUiOnsiZmlsbCI6IndoaXRlIn0sInN0cm9rZSI6IiMyYjVjOTUiLCJzdHJva2VPcGFjaXR5IjoxLCJzdHJva2VXaWR0aCI6Mn0seyJ0eXBlIjoicGFyYWxsZWwtY2hhbm5lbCIsInNpemUiOjEyLjYxNzgwMTA0NzExOTQyOCwibWlkZGxlIjp7InN0cm9rZVdpZHRoIjoxLCJsaW5lRGFzaCI6WzYsNV19LCJiYWNrZ3JvdW5kIjp7ImZpbGwiOiIjNTA5MGRjIiwiZmlsbE9wYWNpdHkiOjAuMn0sInN0YXJ0Ijp7IngiOnsiX190eXBlIjoiZGF0ZSIsInZhbHVlIjoiVGh1IE1hciAyMSAyMDI0IDE4OjQzOjAwIEdNVCswMDAwIChHcmVlbndpY2ggTWVhbiBUaW1lKSJ9LCJ5IjozOTgyNC44NjkxMDk5NDc2NH0sImVuZCI6eyJ4Ijp7Il9fdHlwZSI6ImRhdGUiLCJ2YWx1ZSI6IlRodSBNYXIgMjEgMjAyNCAxODo1NjowMCBHTVQrMDAwMCAoR3JlZW53aWNoIE1lYW4gVGltZSkifSwieSI6Mzk4NDAuMDUyMzU2MDIwOTR9LCJoYW5kbGUiOnsiZmlsbCI6IndoaXRlIn0sInN0cm9rZSI6IiMyYjVjOTUiLCJzdHJva2VPcGFjaXR5IjoxLCJzdHJva2VXaWR0aCI6Mn1dLCJ0eXBlIjoiYW5ub3RhdGlvbnMiLCJ2ZXJzaW9uIjoiMTAuMCJ9';

function saveAnnotations() {
    chart.saveAnnotations().then((b) => {
        blob = b;
        console.log(`Saving [${blob}]`);
    });
}

function restoreAnnotations() {
    console.log(`Restoring [${blob}]`);
    chart.restoreAnnotations(blob);
}
