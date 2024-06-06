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
        annotationOptions: {
            enabled: true,
        },
    },
    tooltip: { enabled: false },
};

const chart = AgCharts.create(options);

let blob =
    'eyJhbm5vdGF0aW9ucyI6W3sidHlwZSI6InBhcmFsbGVsLWNoYW5uZWwiLCJoZWlnaHQiOjEyLjQ2MDczMjk4NDI5MTA5OSwibWlkZGxlIjp7InN0cm9rZVdpZHRoIjoxLCJsaW5lRGFzaCI6WzYsNV19LCJiYWNrZ3JvdW5kIjp7ImZpbGwiOiIjNTA5MGRjIiwiZmlsbE9wYWNpdHkiOjAuMn0sInN0YXJ0Ijp7IngiOiIyMDI0LTAzLTIxVDE4OjQ1OjAwLjAwMFoiLCJ5IjozOTgyNi40OTIxNDY1OTY4Nn0sImVuZCI6eyJ4IjoiMjAyNC0wMy0yMVQxODo1NjowMC4wMDBaIiwieSI6Mzk4NDEuMzYxMjU2NTQ0NX0sImhhbmRsZSI6eyJmaWxsIjoid2hpdGUifSwic3Ryb2tlIjoiIzJiNWM5NSIsInN0cm9rZU9wYWNpdHkiOjEsInN0cm9rZVdpZHRoIjoyfSx7InR5cGUiOiJwYXJhbGxlbC1jaGFubmVsIiwiaGVpZ2h0IjoxMi42MTc4MDEwNDcxMTk0MjgsIm1pZGRsZSI6eyJzdHJva2VXaWR0aCI6MSwibGluZURhc2giOls2LDVdfSwiYmFja2dyb3VuZCI6eyJmaWxsIjoiIzUwOTBkYyIsImZpbGxPcGFjaXR5IjowLjJ9LCJzdGFydCI6eyJ4Ijp7Il9fdHlwZSI6ImRhdGUiLCJ2YWx1ZSI6IlRodSBNYXIgMjEgMjAyNCAxODo0MzowMCBHTVQrMDAwMCAoR3JlZW53aWNoIE1lYW4gVGltZSkifSwieSI6Mzk4MjQuODY5MTA5OTQ3NjR9LCJlbmQiOnsieCI6eyJfX3R5cGUiOiJkYXRlIiwidmFsdWUiOiJUaHUgTWFyIDIxIDIwMjQgMTg6NTY6MDAgR01UKzAwMDAgKEdyZWVud2ljaCBNZWFuIFRpbWUpIn0sInkiOjM5ODQwLjA1MjM1NjAyMDk0fSwiaGFuZGxlIjp7ImZpbGwiOiJ3aGl0ZSJ9LCJzdHJva2UiOiIjMmI1Yzk1Iiwic3Ryb2tlT3BhY2l0eSI6MSwic3Ryb2tlV2lkdGgiOjJ9XSwidHlwZSI6ImFubm90YXRpb25zIiwidmVyc2lvbiI6IjEwLjAifQ==';

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
